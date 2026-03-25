package com.yulmudiary.domain.media.controller;

import com.yulmudiary.domain.media.dto.ImagePaths;
import com.yulmudiary.domain.media.dto.MediaUploadResponse;
import com.yulmudiary.domain.media.service.ImageStorageService;
import com.yulmudiary.domain.media.service.LocalImageStorageServiceImpl;
import com.yulmudiary.global.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.lang.Nullable;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;

import java.io.IOException;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.MalformedURLException;
import java.net.URL;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;

@Tag(name = "Media", description = "미디어 업로드 API")
@RestController
@RequestMapping("/api/media")
@RequiredArgsConstructor
public class MediaController {

    private final ImageStorageService imageStorageService;

    /**
     * 로컬 프로파일에서만 빈으로 등록된다.
     * prod(GCS) 환경에서는 null이므로 serveFile 엔드포인트가 404를 반환한다.
     */
    @Nullable
    @Autowired(required = false)
    private LocalImageStorageServiceImpl localStorageService;

    @Operation(summary = "파일 업로드 (다건)")
    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<MediaUploadResponse> upload(
            @RequestParam("files") List<MultipartFile> files) {

        List<ImagePaths> images = new ArrayList<>();
        for (MultipartFile file : files) {
            // store()가 완전한 public URL을 반환하므로 별도 URL 조합 불필요
            images.add(imageStorageService.store(file));
        }

        return ApiResponse.success(new MediaUploadResponse(images));
    }

    @Operation(summary = "파일 서빙 (로컬 전용)")
    @GetMapping("/files/{subdir}/{filename}")
    public ResponseEntity<Resource> serveFile(
            @PathVariable String subdir,
            @PathVariable String filename) {

        if (localStorageService == null) {
            // prod(GCS) 환경: 파일은 GCS URL로 직접 접근하므로 이 엔드포인트는 사용되지 않음
            return ResponseEntity.notFound().build();
        }

        try {
            Path filePath = localStorageService.load(subdir + "/" + filename);
            Resource resource = new UrlResource(filePath.toUri());

            if (!resource.exists() || !resource.isReadable()) {
                return ResponseEntity.notFound().build();
            }

            String contentType;
            try {
                contentType = Files.probeContentType(filePath);
            } catch (IOException e) {
                contentType = "application/octet-stream";
            }

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_TYPE, contentType != null ? contentType : "application/octet-stream")
                    .body(resource);
        } catch (MalformedURLException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @Operation(summary = "파일 서빙 (하위호환)")
    @GetMapping("/files/{filename}")
    public ResponseEntity<Resource> serveFileLegacy(@PathVariable String filename) {
        return serveFile("originals", filename);
    }

    private static final long MAX_PROXY_BYTES = 50L * 1024 * 1024; // 50MB

    @Operation(summary = "GCS 이미지 프록시 다운로드 (Android 인앱 브라우저 대응)")
    @GetMapping("/download")
    public ResponseEntity<StreamingResponseBody> downloadProxy(
            @RequestParam String url,
            @RequestParam(required = false, defaultValue = "image.jpg") String filename) {

        // GCS 도메인만 허용
        if (!url.startsWith("https://storage.googleapis.com/")) {
            return ResponseEntity.badRequest().build();
        }

        HttpURLConnection conn;
        try {
            conn = (HttpURLConnection) new URL(url).openConnection();
            conn.setConnectTimeout(10_000);
            conn.setReadTimeout(30_000);
            conn.connect();

            int status = conn.getResponseCode();
            if (status != 200) {
                conn.disconnect();
                return ResponseEntity.status(status).build();
            }

            // Content-Length 기반 사전 크기 체크
            long contentLength = conn.getContentLengthLong();
            if (contentLength > MAX_PROXY_BYTES) {
                conn.disconnect();
                return ResponseEntity.status(HttpStatus.PAYLOAD_TOO_LARGE).build();
            }
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY).build();
        }

        String rawContentType = conn.getContentType();
        String contentType = (rawContentType != null) ? rawContentType : "application/octet-stream";

        // RFC 5987 파일명 인코딩
        String safeAscii = filename.replaceAll("[^\\x20-\\x7E]", "_").replace("\"", "");
        String encoded = URLEncoder.encode(filename, StandardCharsets.UTF_8).replace("+", "%20");
        String contentDisposition = "attachment; filename=\"" + safeAscii
                + "\"; filename*=UTF-8''" + encoded;

        final HttpURLConnection finalConn = conn;
        StreamingResponseBody body = outputStream -> {
            try (InputStream in = finalConn.getInputStream()) {
                byte[] buffer = new byte[8192];
                long totalRead = 0;
                int bytesRead;
                while ((bytesRead = in.read(buffer)) != -1) {
                    totalRead += bytesRead;
                    if (totalRead > MAX_PROXY_BYTES) {
                        throw new IOException("파일 크기 초과 (50MB)");
                    }
                    outputStream.write(buffer, 0, bytesRead);
                }
            } finally {
                finalConn.disconnect();
            }
        };

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_TYPE, contentType)
                .header(HttpHeaders.CONTENT_DISPOSITION, contentDisposition)
                .header(HttpHeaders.CACHE_CONTROL, "no-cache")
                .body(body);
    }
}
