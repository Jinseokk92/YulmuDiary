package com.yulmudiary.domain.diary.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class MyCommentResponse {

    private Long id;
    private String content;
    private LocalDateTime createdAt;
    private Long postId;
    private String postContent;
    private String postThumbnailUrl;
}
