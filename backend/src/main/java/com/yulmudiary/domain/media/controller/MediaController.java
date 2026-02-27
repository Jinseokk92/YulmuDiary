package com.yulmudiary.domain.media.controller;

import com.yulmudiary.domain.media.dto.ImagePaths;
import com.yulmudiary.domain.media.dto.MediaUploadResponse;
import com.yulmudiary.domain.media.service.ImageStorageService;
import com.yulmudiary.global.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.io.IOException;
import java.net.MalformedURLException;
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

    @Operation(summary = "파일 업로드 (다건)")
    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<MediaUploadResponse> upload(
            @RequestParam("files") List<MultipartFile> files) {

        List<ImagePaths> images = new ArrayList<>();
        for (MultipartFile file : files) {
            ImagePaths paths = imageStorageService.store(file);
            String baseUrl = ServletUriComponentsBuilder.fromCurrentContextPath()
                    .path("/api/media/files/")
                    .toUriString();
            images.add(new ImagePaths(
                    baseUrl + paths.imageUrl(),
                    baseUrl + paths.thumbnailUrl()
            ));
        }

        return ApiResponse.success(new MediaUploadResponse(images));
    }

    @Operation(summary = "파일 서빙")
    @GetMapping("/files/{subdir}/{filename}")
    public ResponseEntity<Resource> serveFile(
            @PathVariable String subdir,
            @PathVariable String filename) {
        try {
            Path filePath = imageStorageService.load(subdir + "/" + filename);
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
}
