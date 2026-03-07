package com.yulmudiary.domain.diary.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class MyReactionResponse {

    private Long id;
    private String emoji;
    private LocalDateTime createdAt;
    private Long postId;
    private String postContent;
    private String postThumbnailUrl;
}
