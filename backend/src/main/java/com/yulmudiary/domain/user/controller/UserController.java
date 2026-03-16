package com.yulmudiary.domain.user.controller;

import com.yulmudiary.domain.diary.dto.MyCommentPageResponse;
import com.yulmudiary.domain.diary.dto.MyReactionPageResponse;
import com.yulmudiary.domain.diary.service.CommentService;
import com.yulmudiary.domain.diary.service.ReactionService;
import com.yulmudiary.domain.user.dto.NotificationSettingsRequest;
import com.yulmudiary.domain.user.dto.NotificationSettingsResponse;
import com.yulmudiary.domain.user.dto.UserResponse;
import com.yulmudiary.domain.user.dto.UserStatsResponse;
import com.yulmudiary.domain.user.dto.UserUpdateRequest;
import com.yulmudiary.domain.user.repository.UserRepository;
import com.yulmudiary.domain.user.service.UserService;
import com.yulmudiary.global.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Tag(name = "User", description = "사용자 API")
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;
    private final UserService userService;
    private final CommentService commentService;
    private final ReactionService reactionService;

    @Operation(summary = "사용자 목록 조회")
    @GetMapping
    public ApiResponse<List<UserResponse>> getAll() {
        List<UserResponse> users = userRepository.findAll().stream()
                .map(UserResponse::from)
                .toList();
        return ApiResponse.success(users);
    }

    @Operation(summary = "내 프로필 수정 (닉네임, 한 줄 소개)")
    @PutMapping("/me")
    public ApiResponse<UserResponse> updateMyProfile(
            Authentication authentication,
            @Valid @RequestBody UserUpdateRequest request) {
        Long userId = (Long) authentication.getPrincipal();
        return ApiResponse.success(userService.updateProfile(userId, request));
    }

    @Operation(summary = "내 활동 통계 (게시글 수, 사진 수, 반응 수)")
    @GetMapping("/me/stats")
    public ApiResponse<UserStatsResponse> getMyStats(Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();
        return ApiResponse.success(userService.getUserStats(userId));
    }

    @Operation(summary = "내 댓글 목록 조회 (Cursor 페이징)")
    @GetMapping("/me/comments")
    public ApiResponse<MyCommentPageResponse> getMyComments(
            Authentication authentication,
            @Parameter(description = "커서 (이전 페이지 마지막 ID)")
            @RequestParam(required = false) Long cursor,
            @Parameter(description = "페이지 크기")
            @RequestParam(defaultValue = "20") int size) {
        Long userId = (Long) authentication.getPrincipal();
        return ApiResponse.success(commentService.getByAuthor(userId, cursor, size));
    }

    @Operation(summary = "내 반응 목록 조회 (Cursor 페이징)")
    @GetMapping("/me/reactions")
    public ApiResponse<MyReactionPageResponse> getMyReactions(
            Authentication authentication,
            @Parameter(description = "커서 (이전 페이지 마지막 ID)")
            @RequestParam(required = false) Long cursor,
            @Parameter(description = "페이지 크기")
            @RequestParam(defaultValue = "30") int size) {
        Long userId = (Long) authentication.getPrincipal();
        return ApiResponse.success(reactionService.getByUser(userId, cursor, size));
    }

    @Operation(summary = "내 알림 설정 조회")
    @GetMapping("/notification-settings")
    public ApiResponse<NotificationSettingsResponse> getNotificationSettings(
            Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();
        return ApiResponse.success(userService.getNotificationSettings(userId));
    }

    @Operation(summary = "내 알림 설정 변경")
    @PatchMapping("/notification-settings")
    public ApiResponse<NotificationSettingsResponse> updateNotificationSettings(
            Authentication authentication,
            @RequestBody NotificationSettingsRequest request) {
        Long userId = (Long) authentication.getPrincipal();
        return ApiResponse.success(userService.updateNotificationSettings(userId, request));
    }

    @Operation(summary = "내 프로필 사진 변경")
    @PutMapping(value = "/me/profile-image", consumes = "multipart/form-data")
    public ApiResponse<UserResponse> updateMyProfileImage(
            Authentication authentication,
            @RequestPart("file") MultipartFile file) {
        Long userId = (Long) authentication.getPrincipal();
        return ApiResponse.success(userService.updateProfileImage(userId, file));
    }
}
