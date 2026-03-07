package com.yulmudiary.domain.diary.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class MyReactionPageResponse {

    private List<MyReactionResponse> items;
    private Long nextCursor;
    private boolean hasNext;
}
