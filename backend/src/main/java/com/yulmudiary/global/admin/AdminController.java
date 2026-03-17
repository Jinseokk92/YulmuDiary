package com.yulmudiary.global.admin;

import com.yulmudiary.domain.diary.service.DiaryPostService;
import com.yulmudiary.global.admin.dto.*;
import com.yulmudiary.global.auth.annotation.RequireAdmin;
import com.yulmudiary.global.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "Admin", description = "관리자 API")
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;
    private final DiaryPostService diaryPostService;

    // ── A. 초대 코드 관리 ──────────────────────────────────────────────

    @Operation(summary = "초대 코드 목록 조회")
    @RequireAdmin
    @GetMapping("/invite-codes")
    public ApiResponse<InviteCodesResponse> getInviteCodes(Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();
        return ApiResponse.success(adminService.getInviteCodes(userId));
    }

    @Operation(summary = "초대 코드 재발급")
    @RequireAdmin
    @PostMapping("/invite-codes/regenerate")
    public ApiResponse<InviteCodeRegenerateResponse> regenerateInviteCode(
            Authentication authentication,
            @Valid @RequestBody InviteCodeRegenerateRequest request) {
        Long userId = (Long) authentication.getPrincipal();
        return ApiResponse.success(adminService.regenerateInviteCode(userId, request.role()));
    }

    // ── B. 멤버 관리 ────────────────────────────────────────────────────

    @Operation(summary = "가족 멤버 목록 조회")
    @RequireAdmin
    @GetMapping("/family-group/members")
    public ApiResponse<List<AdminMemberResponse>> getMembers(Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();
        return ApiResponse.success(adminService.getMembers(userId));
    }

    @Operation(summary = "멤버 강제 퇴출")
    @RequireAdmin
    @DeleteMapping("/family-group/members/{targetUserId}")
    public ApiResponse<Void> removeMember(
            Authentication authentication,
            @PathVariable Long targetUserId) {
        Long userId = (Long) authentication.getPrincipal();
        adminService.removeMember(userId, targetUserId);
        return ApiResponse.success(null);
    }

    // ── C. 전체 게시글 삭제 ─────────────────────────────────────────────

    @Operation(summary = "게시글 강제 삭제 (관리자)")
    @RequireAdmin
    @DeleteMapping("/diary-posts/{postId}")
    public ApiResponse<Void> deletePost(
            Authentication authentication,
            @PathVariable Long postId) {
        Long userId = (Long) authentication.getPrincipal();
        diaryPostService.delete(postId, userId);
        return ApiResponse.success(null);
    }

    // ── D. 앱 설정 관리 ─────────────────────────────────────────────────

    @Operation(summary = "앱 설정 조회 (아기 이름, 출산 예정일)")
    @RequireAdmin
    @GetMapping("/app-settings")
    public ApiResponse<AppSettingsResponse> getAppSettings() {
        return ApiResponse.success(adminService.getAppSettings());
    }

    @Operation(summary = "앱 설정 변경 (아기 이름, 출산 예정일)")
    @RequireAdmin
    @PatchMapping("/app-settings")
    public ApiResponse<AppSettingsResponse> updateAppSettings(
            @Valid @RequestBody AppSettingsUpdateRequest request) {
        return ApiResponse.success(adminService.updateAppSettings(request));
    }
}
