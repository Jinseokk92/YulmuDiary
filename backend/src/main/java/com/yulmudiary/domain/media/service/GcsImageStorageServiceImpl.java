package com.yulmudiary.domain.media.service;

import com.google.cloud.storage.BlobId;
import com.google.cloud.storage.BlobInfo;
import com.google.cloud.storage.Storage;
import com.google.cloud.storage.StorageOptions;
import com.yulmudiary.domain.media.dto.ImagePaths;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.util.UUID;

/**
 * Google Cloud Storage 기반 이미지 저장 구현체.
 * prod 프로파일에서만 활성화된다.
 *
 * <p>OutOfMemoryError 방지를 위해 ImageIO.read()를 사용하지 않고
 * MultipartFile의 InputStream을 GCS로 직접 스트리밍 전송한다.
 *
 * <p>인증 방식 (Application Default Credentials):
 * - Cloud Run: 인스턴스에 부착된 서비스 계정 자동 사용 (별도 설정 불필요)
 * - 로컬 GCS 테스트: GOOGLE_APPLICATION_CREDENTIALS 환경변수로 서비스 계정 JSON 키 경로 지정
 */
@Service
@Profile("prod")
public class GcsImageStorageServiceImpl implements ImageStorageService {

    private final String bucketName;
    private final String gcsBaseUrl;
    private Storage storage;

    public GcsImageStorageServiceImpl(
            @Value("${app.media.gcs.bucket-name}") String bucketName) {
        this.bucketName = bucketName;
        this.gcsBaseUrl = "https://storage.googleapis.com/" + bucketName + "/";
    }

    @PostConstruct
    public void init() {
        // Application Default Credentials (ADC) 자동 탐지
        // - Cloud Run: 서비스 계정 자동 인증
        // - 로컬: GOOGLE_APPLICATION_CREDENTIALS 환경변수 또는 gcloud auth application-default login
        this.storage = StorageOptions.getDefaultInstance().getService();
    }

    @Override
    public ImagePaths store(MultipartFile file) {
        String originalFilename = file.getOriginalFilename();
        String extension = extractExtension(originalFilename);
        String storedFilename = UUID.randomUUID() + extension;
        String objectName = "originals/" + storedFilename;

        BlobId blobId = BlobId.of(bucketName, objectName);
        BlobInfo blobInfo = BlobInfo.newBuilder(blobId)
                .setContentType(resolveContentType(file, extension))
                .build();

        try (InputStream inputStream = file.getInputStream()) {
            // InputStream을 GCS로 직접 스트리밍 업로드 (메모리에 전체 로드하지 않음)
            storage.createFrom(blobInfo, inputStream);
        } catch (IOException e) {
            throw new RuntimeException("GCS 업로드에 실패했습니다: " + originalFilename, e);
        }

        String publicUrl = gcsBaseUrl + objectName;
        // GCS 환경에서는 별도 썸네일 없이 원본 URL을 공유한다.
        // 향후 Cloud CDN 이미지 변환 파라미터나 별도 리사이징 파이프라인으로 교체 가능.
        return new ImagePaths(publicUrl, publicUrl);
    }

    private String resolveContentType(MultipartFile file, String extension) {
        String contentType = file.getContentType();
        if (contentType != null && !contentType.isBlank()) {
            return contentType;
        }
        return switch (extension.toLowerCase()) {
            case ".jpg", ".jpeg" -> "image/jpeg";
            case ".png" -> "image/png";
            case ".gif" -> "image/gif";
            case ".webp" -> "image/webp";
            default -> "application/octet-stream";
        };
    }

    private String extractExtension(String filename) {
        if (filename != null && filename.contains(".")) {
            return filename.substring(filename.lastIndexOf("."));
        }
        return "";
    }
}
