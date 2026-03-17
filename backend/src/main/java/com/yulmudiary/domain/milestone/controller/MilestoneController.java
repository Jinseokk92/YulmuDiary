package com.yulmudiary.domain.milestone.controller;

import com.yulmudiary.domain.family.entity.FamilyRole;
import com.yulmudiary.domain.milestone.dto.MilestoneAchieveRequest;
import com.yulmudiary.domain.milestone.dto.MilestoneResponse;
import com.yulmudiary.domain.milestone.service.MilestoneService;
import com.yulmudiary.global.auth.annotation.RequireRole;
import com.yulmudiary.global.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "Milestone", description = "아기 이정표 API")
@RestController
@RequestMapping("/api/milestones")
@RequiredArgsConstructor
public class MilestoneController {

    private final MilestoneService milestoneService;

    @Operation(summary = "이정표 목록 조회 (없으면 기본 14개 자동 생성)")
    @GetMapping
    public ApiResponse<List<MilestoneResponse>> getAll(Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();
        return ApiResponse.success(milestoneService.getOrInitialize(userId));
    }

    @Operation(summary = "이정표 달성 기록 (PARENT 권한 필요)")
    @RequireRole(FamilyRole.PARENT)
    @PatchMapping(value = "/{id}/achieve", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<MilestoneResponse> achieve(
            @PathVariable Long id,
            Authentication authentication,
            @Valid @ModelAttribute MilestoneAchieveRequest request) {
        Long userId = (Long) authentication.getPrincipal();
        return ApiResponse.success(milestoneService.achieve(id, userId, request));
    }

    @Operation(summary = "이정표 달성 취소 (PARENT 권한 필요)")
    @RequireRole(FamilyRole.PARENT)
    @DeleteMapping("/{id}/achieve")
    public ApiResponse<Void> cancelAchieve(
            @PathVariable Long id,
            Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();
        milestoneService.cancelAchieve(id, userId);
        return ApiResponse.success(null);
    }
}
