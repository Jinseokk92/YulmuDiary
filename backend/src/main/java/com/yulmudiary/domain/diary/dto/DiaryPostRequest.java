package com.yulmudiary.domain.diary.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;

import java.util.List;

@Getter
public class DiaryPostRequest {

    @NotNull(message = "babyId는 필수입니다.")
    private Long babyId;

    private String content;

    private String milestoneTag;

    private List<String> mediaUrls;

    private List<String> mediaThumbnailUrls;
}
