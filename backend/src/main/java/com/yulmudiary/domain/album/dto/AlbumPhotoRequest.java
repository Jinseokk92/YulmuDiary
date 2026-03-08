package com.yulmudiary.domain.album.dto;

import com.yulmudiary.domain.album.entity.GrowthPhaseType;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Getter
@NoArgsConstructor
public class AlbumPhotoRequest {

    @NotNull(message = "babyId는 필수입니다.")
    private Long babyId;

    @NotNull(message = "url은 필수입니다.")
    private String url;

    private String thumbnailUrl;

    @NotNull(message = "growthPhaseType은 필수입니다.")
    private GrowthPhaseType growthPhaseType;

    @NotNull(message = "growthIndex는 필수입니다.")
    private Integer growthIndex;

    private String caption;

    private LocalDate takenAt;
}
