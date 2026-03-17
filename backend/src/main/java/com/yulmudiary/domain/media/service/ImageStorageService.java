package com.yulmudiary.domain.media.service;

import com.yulmudiary.domain.media.dto.ImagePaths;
import org.springframework.web.multipart.MultipartFile;

public interface ImageStorageService {

    /**
     * 파일을 저장하고 완전한 public URL을 담은 ImagePaths를 반환한다.
     * - Local 프로파일: http://localhost:8080/api/media/files/... 형태의 URL
     * - Prod 프로파일:  https://storage.googleapis.com/{bucket}/... 형태의 GCS URL
     */
    ImagePaths store(MultipartFile file);

    /**
     * URL로 지정된 파일을 저장소에서 삭제한다.
     * 파일을 찾지 못하거나 삭제에 실패해도 예외를 던지지 않는다.
     */
    void deleteByUrl(String url);
}
