package com.yulmudiary.domain.diary.controller;

import com.yulmudiary.domain.diary.dto.DiaryPostPageResponse;
import com.yulmudiary.domain.diary.dto.DiaryPostRequest;
import com.yulmudiary.domain.diary.dto.DiaryPostResponse;
import com.yulmudiary.domain.diary.service.DiaryPostService;
import com.yulmudiary.global.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@Tag(name = "DiaryPost", description = "육아 일기 API")
@RestController
@RequestMapping("/api/diary-posts")
@RequiredArgsConstructor
public class DiaryPostController {

    private final DiaryPostService diaryPostService;

    @Operation(summary = "일기 생성")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<DiaryPostResponse> create(
            Authentication authentication,
            @Valid @RequestBody DiaryPostRequest request) {
        Long userId = (Long) authentication.getPrincipal();
        return ApiResponse.success(diaryPostService.create(userId, request));
    }

    @Operation(summary = "일기 단건 조회")
    @GetMapping("/{id}")
    public ApiResponse<DiaryPostResponse> getById(@PathVariable Long id) {
        return ApiResponse.success(diaryPostService.getById(id));
    }

    @Operation(summary = "일기 목록 조회 (Cursor 페이징)")
    @GetMapping
    public ApiResponse<DiaryPostPageResponse> getByBaby(
            @Parameter(description = "아기 ID", required = true)
            @RequestParam Long babyId,
            @Parameter(description = "커서 (이전 페이지 마지막 ID)")
            @RequestParam(required = false) Long cursor,
            @Parameter(description = "페이지 크기")
            @RequestParam(defaultValue = "10") int size) {
        return ApiResponse.success(diaryPostService.getByBaby(babyId, cursor, size));
    }

    @Operation(summary = "일기 수정")
    @PutMapping("/{id}")
    public ApiResponse<DiaryPostResponse> update(
            @PathVariable Long id,
            Authentication authentication,
            @Valid @RequestBody DiaryPostRequest request) {
        Long userId = (Long) authentication.getPrincipal();
        return ApiResponse.success(diaryPostService.update(id, userId, request));
    }

    @Operation(summary = "일기 삭제")
    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(
            @PathVariable Long id,
            Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();
        diaryPostService.delete(id, userId);
        return ApiResponse.success(null);
    }
}
