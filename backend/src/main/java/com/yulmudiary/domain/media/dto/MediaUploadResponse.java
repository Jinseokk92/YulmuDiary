package com.yulmudiary.domain.media.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.List;

@Getter
@AllArgsConstructor
public class MediaUploadResponse {

    private List<ImagePaths> images;
}
