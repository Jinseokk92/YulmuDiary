package com.yulmudiary.domain.family.controller;

import com.yulmudiary.domain.family.dto.FamilyJoinRequest;
import com.yulmudiary.domain.family.dto.FamilyJoinResponse;
import com.yulmudiary.domain.family.service.FamilyService;
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
@RequestMapping("/api/family-group")
@RequiredArgsConstructor
public class FamilyController {

    private final FamilyService familyService;

    @Operation(summary = "초대 코드로 가족 그룹 합류")
    @PostMapping("/join")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<FamilyJoinResponse> join(
            Authentication authentication,
            @Valid @RequestBody FamilyJoinRequest request) {
        Long userId = (Long) authentication.getPrincipal();
        return ApiResponse.success(familyService.join(userId, request));
    }
}
