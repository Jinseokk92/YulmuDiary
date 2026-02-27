package com.yulmudiary.domain.media.service;

import com.yulmudiary.domain.media.dto.ImagePaths;
import jakarta.annotation.PostConstruct;
import net.coobird.thumbnailator.Thumbnails;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@Service
public class LocalImageStorageServiceImpl implements ImageStorageService {

    private static final int ORIGINAL_MAX_WIDTH = 1200;
    private static final int THUMBNAIL_MAX_WIDTH = 600;

    private final Path uploadDir;
    private final Path originalsDir;
    private final Path thumbnailsDir;

    public LocalImageStorageServiceImpl(@Value("${app.media.upload-dir:./uploads}") String uploadDir) {
        this.uploadDir = Paths.get(uploadDir).toAbsolutePath().normalize();
        this.originalsDir = this.uploadDir.resolve("originals");
        this.thumbnailsDir = this.uploadDir.resolve("thumbnails");
    }

    @PostConstruct
    public void init() {
        try {
            Files.createDirectories(originalsDir);
            Files.createDirectories(thumbnailsDir);
        } catch (IOException e) {
            throw new RuntimeException("업로드 디렉토리를 생성할 수 없습니다: " + uploadDir, e);
        }
    }

    @Override
    public ImagePaths store(MultipartFile file) {
        String originalFilename = file.getOriginalFilename();
        String extension = extractExtension(originalFilename);
        String storedFilename = UUID.randomUUID() + extension;

        try {
            BufferedImage originalImage = ImageIO.read(file.getInputStream());

            if (originalImage == null) {
                // 이미지가 아닌 파일은 원본 그대로 저장
                Path targetPath = originalsDir.resolve(storedFilename);
                file.transferTo(targetPath.toFile());
                return new ImagePaths(
                        "originals/" + storedFilename,
                        "originals/" + storedFilename
                );
            }

            int width = originalImage.getWidth();

            // Original: 1200px 이하면 그대로, 초과면 리사이징
            Path originalPath = originalsDir.resolve(storedFilename);
            if (width > ORIGINAL_MAX_WIDTH) {
                Thumbnails.of(originalImage)
                        .width(ORIGINAL_MAX_WIDTH)
                        .toFile(originalPath.toFile());
            } else {
                Thumbnails.of(originalImage)
                        .scale(1.0)
                        .toFile(originalPath.toFile());
            }

            // Thumbnail: 600px로 리사이징
            Path thumbnailPath = thumbnailsDir.resolve(storedFilename);
            if (width > THUMBNAIL_MAX_WIDTH) {
                Thumbnails.of(originalImage)
                        .width(THUMBNAIL_MAX_WIDTH)
                        .toFile(thumbnailPath.toFile());
            } else {
                Thumbnails.of(originalImage)
                        .scale(1.0)
                        .toFile(thumbnailPath.toFile());
            }

            return new ImagePaths(
                    "originals/" + storedFilename,
                    "thumbnails/" + storedFilename
            );
        } catch (IOException e) {
            throw new RuntimeException("파일 저장에 실패했습니다: " + originalFilename, e);
        }
    }

    @Override
    public Path load(String filename) {
        return uploadDir.resolve(filename);
    }

    private String extractExtension(String filename) {
        if (filename != null && filename.contains(".")) {
            return filename.substring(filename.lastIndexOf("."));
        }
        return "";
    }
}
