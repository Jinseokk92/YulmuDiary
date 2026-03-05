package com.yulmudiary.domain.family.controller;

import com.yulmudiary.domain.family.dto.FamilyCreateRequest;
import com.yulmudiary.domain.family.dto.FamilyGroupResponse;
import com.yulmudiary.domain.family.dto.FamilyJoinRequest;
import com.yulmudiary.domain.family.dto.FamilyMembershipResponse;
import com.yulmudiary.domain.family.entity.FamilyRole;
import com.yulmudiary.domain.family.service.FamilyService;
import com.yulmudiary.global.auth.annotation.RequireRole;
import com.yulmudiary.global.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@Tag(name = "Family", description = "가족 그룹 API")
@RestController
@RequestMapping("/api/family-groups")
@RequiredArgsConstructor
public class FamilyController {

    private final FamilyService familyService;

    @Operation(
            summary = "가족 그룹 생성",
            description = "새 가족 그룹을 생성하고 생성자를 PARENT로 자동 가입시킵니다. " +
                          "RELATIVE 초대 코드와 PARENT 초대 코드가 함께 생성됩니다."
    )
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<FamilyGroupResponse> create(
            Authentication authentication,
            @Valid @RequestBody FamilyCreateRequest request) {
        Long userId = (Long) authentication.getPrincipal();
        return ApiResponse.success(familyService.create(userId, request));
    }

    @Operation(
            summary = "초대 코드로 가족 그룹 가입",
            description = "6자리 초대 코드를 입력해 가족 그룹에 가입합니다. " +
                          "일반 초대 코드 → RELATIVE, PARENT 초대 코드 → PARENT 역할로 가입됩니다."
    )
    @PostMapping("/join")
    public ApiResponse<FamilyMembershipResponse> join(
            Authentication authentication,
            @Valid @RequestBody FamilyJoinRequest request) {
        Long userId = (Long) authentication.getPrincipal();
        return ApiResponse.success(familyService.join(userId, request.inviteCode()));
    }

    @Operation(
            summary = "내 가족 그룹 정보 조회",
            description = "소속된 가족 그룹 정보와 초대 코드를 조회합니다. PARENT 권한 필요."
    )
    @GetMapping("/mine")
    @RequireRole(FamilyRole.PARENT)
    public ApiResponse<FamilyGroupResponse> getMyGroup(Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();
        return ApiResponse.success(familyService.getMyGroup(userId));
    }

    @Operation(
            summary = "PARENT 초대 코드 재발급",
            description = "기존 PARENT 초대 코드를 무효화하고 새 코드를 발급합니다. PARENT 권한 필요."
    )
    @PostMapping("/regenerate-parent-code")
    @RequireRole(FamilyRole.PARENT)
    public ApiResponse<FamilyGroupResponse> regenerateParentCode(Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();
        return ApiResponse.success(familyService.regenerateParentCode(userId));
    }
}
