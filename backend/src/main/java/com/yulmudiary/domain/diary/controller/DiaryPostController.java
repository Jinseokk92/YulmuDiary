package com.yulmudiary.domain.diary.controller;

import com.yulmudiary.domain.diary.dto.DiaryPostPageResponse;
import com.yulmudiary.domain.diary.dto.DiaryPostPaginatedResponse;
import com.yulmudiary.domain.diary.dto.DiaryPostRequest;
import com.yulmudiary.domain.diary.dto.DiaryPostResponse;
import com.yulmudiary.domain.diary.dto.DiaryPostSortType;
import com.yulmudiary.domain.diary.service.DiaryPostService;
import com.yulmudiary.domain.family.entity.FamilyRole;
import com.yulmudiary.global.auth.AuthTarget;
import com.yulmudiary.global.auth.CheckFamilyAuth;
import com.yulmudiary.global.auth.annotation.RequireRole;
import com.yulmudiary.global.response.ApiResponse;

import java.util.List;
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

    @Operation(summary = "고정된 일기 목록 조회")
    @CheckFamilyAuth(AuthTarget.BABY_ID)
    @GetMapping("/pinned")
    public ApiResponse<List<DiaryPostResponse>> getPinned(
            @Parameter(description = "아기 ID", required = true)
            @RequestParam Long babyId,
            Authentication authentication) {
        Long currentUserId = (Long) authentication.getPrincipal();
        return ApiResponse.success(diaryPostService.getPinned(babyId, currentUserId));
    }

    @Operation(summary = "일기 단건 조회")
    @CheckFamilyAuth(AuthTarget.POST_ID)
    @GetMapping("/{id}")
    public ApiResponse<DiaryPostResponse> getById(
            @PathVariable Long id,
            Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();
        return ApiResponse.success(diaryPostService.getById(id, userId));
    }

    @Operation(summary = "일기 목록 조회 (Cursor 페이징)")
    @CheckFamilyAuth(AuthTarget.BABY_ID)
    @GetMapping
    public ApiResponse<DiaryPostPageResponse> getByBaby(
            Authentication authentication,
            @Parameter(description = "아기 ID", required = true)
            @RequestParam Long babyId,
            @Parameter(description = "커서 (이전 페이지 마지막 ID)")
            @RequestParam(required = false) Long cursor,
            @Parameter(description = "페이지 크기")
            @RequestParam(defaultValue = "10") int size) {
        Long currentUserId = (Long) authentication.getPrincipal();
        return ApiResponse.success(diaryPostService.getByBaby(babyId, cursor, size, currentUserId));
    }

    @Operation(summary = "일기 목록 조회 (페이지 번호 기반)")
    @CheckFamilyAuth(AuthTarget.BABY_ID)
    @GetMapping("/pages")
    public ApiResponse<DiaryPostPaginatedResponse> getByBabyPaged(
            Authentication authentication,
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
            @RequestParam(required = false) Long userId,
            @Parameter(description = "검색 키워드 (내용·해시태그·작성자명)")
            @RequestParam(required = false) String keyword) {
        Long currentUserId = (Long) authentication.getPrincipal();
        return ApiResponse.success(diaryPostService.getByBabyPaged(babyId, page - 1, size, sort, startDate, endDate, userId, keyword, currentUserId));
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

    @Operation(summary = "일기 고정/해제 토글 (PARENT 전용)")
    @CheckFamilyAuth(AuthTarget.POST_ID)
    @RequireRole(FamilyRole.PARENT)
    @PatchMapping("/{id}/pin")
    public ApiResponse<DiaryPostResponse> togglePin(
            @PathVariable Long id,
            Authentication authentication) {
        Long currentUserId = (Long) authentication.getPrincipal();
        return ApiResponse.success(diaryPostService.togglePin(id, currentUserId));
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
