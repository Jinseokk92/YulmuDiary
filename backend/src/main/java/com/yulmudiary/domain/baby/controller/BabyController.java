package com.yulmudiary.domain.baby.controller;

import com.yulmudiary.domain.baby.dto.BabyResponse;
import com.yulmudiary.domain.baby.service.BabyService;
import com.yulmudiary.global.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Baby", description = "아기 정보 API")
@RestController
@RequestMapping("/api/babies")
@RequiredArgsConstructor
public class BabyController {

    private final BabyService babyService;

    @Operation(summary = "아기 정보 조회 (D-day · 임신 주수 포함)")
    @GetMapping("/{id}")
    public ApiResponse<BabyResponse> getBaby(@PathVariable Long id) {
        return ApiResponse.success(babyService.getBaby(id));
    }
}
