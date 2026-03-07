package com.yulmudiary.domain.diary.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class MyCommentPageResponse {

    private List<MyCommentResponse> items;
    private Long nextCursor;
    private boolean hasNext;
}
