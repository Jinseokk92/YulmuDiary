package com.yulmudiary.domain.diary.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class DiaryPostPaginatedResponse {

    private List<DiaryPostResponse> content;
    private long totalElements;
    private int totalPages;
    private int currentPage; // 1-based
}
