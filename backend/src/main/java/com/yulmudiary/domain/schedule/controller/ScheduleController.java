package com.yulmudiary.domain.schedule.controller;

import com.yulmudiary.domain.schedule.dto.ScheduleRequest;
import com.yulmudiary.domain.schedule.dto.ScheduleResponse;
import com.yulmudiary.domain.schedule.service.ScheduleService;
import com.yulmudiary.global.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "Schedule", description = "일정 API")
@RestController
@RequestMapping("/api/schedules")
@RequiredArgsConstructor
public class ScheduleController {

    private final ScheduleService scheduleService;

    @Operation(summary = "월별 일정 조회", description = "year, month 파라미터로 해당 월의 일정 목록을 조회합니다.")
    @GetMapping
    public ApiResponse<List<ScheduleResponse>> getByMonth(
            Authentication authentication,
            @Parameter(description = "연도 (예: 2026)")
            @RequestParam int year,
            @Parameter(description = "월 (1~12)")
            @RequestParam @Min(1) @Max(12) int month) {
        Long userId = (Long) authentication.getPrincipal();
        return ApiResponse.success(scheduleService.getByMonth(userId, year, month));
    }

    @Operation(summary = "일정 등록")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<ScheduleResponse> create(
            Authentication authentication,
            @Valid @RequestBody ScheduleRequest request) {
        Long userId = (Long) authentication.getPrincipal();
        return ApiResponse.success(scheduleService.create(userId, request));
    }

    @Operation(summary = "일정 수정")
    @PutMapping("/{id}")
    public ApiResponse<ScheduleResponse> update(
            @PathVariable Long id,
            Authentication authentication,
            @Valid @RequestBody ScheduleRequest request) {
        Long userId = (Long) authentication.getPrincipal();
        return ApiResponse.success(scheduleService.update(id, userId, request));
    }

    @Operation(summary = "일정 삭제")
    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(
            @PathVariable Long id,
            Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();
        scheduleService.delete(id, userId);
        return ApiResponse.success(null);
    }
}
