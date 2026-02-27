package com.yulmudiary.domain.media.service;

import com.yulmudiary.domain.media.dto.ImagePaths;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Path;

public interface ImageStorageService {

    ImagePaths store(MultipartFile file);

    Path load(String filename);
}
