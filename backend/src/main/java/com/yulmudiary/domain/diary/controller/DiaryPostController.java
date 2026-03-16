package com.yulmudiary.domain.diary.controller;

import com.yulmudiary.domain.diary.dto.DiaryPostPageResponse;
import com.yulmudiary.domain.diary.dto.DiaryPostPaginatedResponse;
import com.yulmudiary.domain.diary.dto.DiaryPostRequest;
import com.yulmudiary.domain.diary.dto.DiaryPostResponse;
import com.yulmudiary.domain.diary.dto.DiaryPostSortType;
import com.yulmudiary.domain.diary.service.DiaryPostService;
import com.yulmudiary.global.auth.AuthTarget;
import com.yulmudiary.global.auth.CheckFamilyAuth;
import com.yulmudiary.global.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@Tag(name = "DiaryPost", description = "육아 일기 API")
@RestController
@RequestMapping("/api/diary-posts")
@RequiredArgsConstructor
public class DiaryPostController {

    private final DiaryPostService diaryPostService;

    @Operation(summary = "일기 생성")
    @CheckFamilyAuth(AuthTarget.BABY_ID)
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<DiaryPostResponse> create(
            Authentication authentication,
            @Valid @RequestBody DiaryPostRequest request) {
        Long userId = (Long) authentication.getPrincipal();
        return ApiResponse.success(diaryPostService.create(userId, request));
    }

    @Operation(summary = "일기 단건 조회")
    @CheckFamilyAuth(AuthTarget.POST_ID)
    @GetMapping("/{id}")
    public ApiResponse<DiaryPostResponse> getById(@PathVariable Long id) {
        return ApiResponse.success(diaryPostService.getById(id));
    }

    @Operation(summary = "일기 목록 조회 (Cursor 페이징)")
    @CheckFamilyAuth(AuthTarget.BABY_ID)
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

    @Operation(summary = "일기 목록 조회 (페이지 번호 기반)")
    @CheckFamilyAuth(AuthTarget.BABY_ID)
    @GetMapping("/pages")
    public ApiResponse<DiaryPostPaginatedResponse> getByBabyPaged(
            @Parameter(description = "아기 ID", required = true)
            @RequestParam Long babyId,
            @Parameter(description = "페이지 번호 (1부터 시작)")
            @RequestParam(defaultValue = "1") int page,
            @Parameter(description = "페이지 크기")
            @RequestParam(defaultValue = "5") int size,
            @Parameter(description = "정렬 기준 (LATEST | OLDEST)")
            @RequestParam(defaultValue = "LATEST") DiaryPostSortType sort,
            @Parameter(description = "시작 날짜 (YYYY-MM-DD)")
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @Parameter(description = "종료 날짜 (YYYY-MM-DD)")
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @Parameter(description = "사용자 ID 필터")
            @RequestParam(required = false) Long userId) {
        return ApiResponse.success(diaryPostService.getByBabyPaged(babyId, page - 1, size, sort, startDate, endDate, userId));
    }

    @Operation(summary = "내 게시글 목록 조회 (Cursor 페이징)")
    @GetMapping("/my")
    public ApiResponse<DiaryPostPageResponse> getMyPosts(
            Authentication authentication,
            @Parameter(description = "커서 (이전 페이지 마지막 ID)")
            @RequestParam(required = false) Long cursor,
            @Parameter(description = "페이지 크기")
            @RequestParam(defaultValue = "10") int size) {
        Long userId = (Long) authentication.getPrincipal();
        return ApiResponse.success(diaryPostService.getByAuthor(userId, cursor, size));
    }

    @Operation(summary = "일기 수정")
    @CheckFamilyAuth(AuthTarget.POST_ID)
    @PutMapping("/{id}")
    public ApiResponse<DiaryPostResponse> update(
            @PathVariable Long id,
            Authentication authentication,
            @Valid @RequestBody DiaryPostRequest request) {
        Long userId = (Long) authentication.getPrincipal();
        return ApiResponse.success(diaryPostService.update(id, userId, request));
    }

    @Operation(summary = "일기 삭제")
    @CheckFamilyAuth(AuthTarget.POST_ID)
    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(
            @PathVariable Long id,
            Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();
        diaryPostService.delete(id, userId);
        return ApiResponse.success(null);
    }
}
