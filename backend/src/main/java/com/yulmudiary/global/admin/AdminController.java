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
import org.springframework.web.multipart.MultipartFile;

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

    @Operation(summary = "앱 설정 조회 (아기 이름, 출산 예정일, 출생 일시, 대표 사진)")
    @RequireAdmin
    @GetMapping("/app-settings")
    public ApiResponse<AppSettingsResponse> getAppSettings() {
        return ApiResponse.success(adminService.getAppSettings());
    }

    @Operation(summary = "앱 설정 변경 (아기 이름, 출산 예정일, 출생 일시)",
            description = "bornAt은 생략하거나 null이면 기존 값이 유지된다. 미래 시각은 허용하지 않는다. " +
                    "clearBornAt=true를 보내면 출생일시를 초기화(null)한다. clearBornAt과 bornAt을 동시에 보내면 400.")
    @RequireAdmin
    @PatchMapping("/app-settings")
    public ApiResponse<AppSettingsResponse> updateAppSettings(
            @Valid @RequestBody AppSettingsUpdateRequest request) {
        return ApiResponse.success(adminService.updateAppSettings(request));
    }

    // ── E. 아기 대표 사진 ───────────────────────────────────────────────

    @Operation(summary = "아기 대표 사진 변경 (관리자)",
            description = "이미지 Content-Type · 최대 5MB. 교체 성공 후 기존 파일은 삭제된다.")
    @RequireAdmin
    @PutMapping(value = "/app-settings/baby-photo", consumes = "multipart/form-data")
    public ApiResponse<AppSettingsResponse> updateBabyPhoto(
            @RequestPart("file") MultipartFile file) {
        return ApiResponse.success(adminService.updateBabyPhoto(file));
    }

    @Operation(summary = "아기 대표 사진 초기화 (관리자)",
            description = "profileImageUrl만 null로 초기화한다. 이름·출산예정일·출생일시는 변경하지 않는다. " +
                    "트랜잭션 커밋 성공 후에만 기존 파일을 삭제한다.")
    @RequireAdmin
    @DeleteMapping("/app-settings/baby-photo")
    public ApiResponse<AppSettingsResponse> resetBabyPhoto() {
        return ApiResponse.success(adminService.resetBabyPhoto());
    }
}
