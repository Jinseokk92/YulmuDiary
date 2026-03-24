package com.yulmudiary.domain.bestphoto.controller;

import com.yulmudiary.domain.bestphoto.dto.BestPhotoStatusResponse;
import com.yulmudiary.domain.bestphoto.dto.NominateRequest;
import com.yulmudiary.domain.bestphoto.dto.NominationResponse;
import com.yulmudiary.domain.bestphoto.dto.VoteRequest;
import com.yulmudiary.domain.bestphoto.service.BestPhotoService;
import com.yulmudiary.global.auth.annotation.RequireAdmin;
import com.yulmudiary.global.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@Tag(name = "BestPhoto", description = "베스트 포토 어워드 API")
@RestController
@RequestMapping("/api/best-photo")
@RequiredArgsConstructor
public class BestPhotoController {

    private final BestPhotoService bestPhotoService;

    // ── Admin endpoints ────────────────────────────────────────────────────

    @Operation(summary = "라운드 시작 (관리자 전용)")
    @RequireAdmin
    @PostMapping("/rounds")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<Void> startRound() {
        bestPhotoService.startRound();
        return ApiResponse.success(null);
    }

    @Operation(summary = "투표 단계 시작 (관리자 전용)")
    @RequireAdmin
    @PostMapping("/rounds/start-vote")
    public ApiResponse<Void> startVoting() {
        bestPhotoService.startVoting();
        return ApiResponse.success(null);
    }

    @Operation(summary = "투표 종료 및 결과 확정 (관리자 전용)")
    @RequireAdmin
    @PostMapping("/rounds/end-vote")
    public ApiResponse<Void> endVoting() {
        bestPhotoService.endVoting();
        return ApiResponse.success(null);
    }

    // ── User endpoints ─────────────────────────────────────────────────────

    @Operation(summary = "사진 추천")
    @PostMapping("/nominate")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<NominationResponse> nominate(
            Authentication authentication,
            @RequestBody NominateRequest request) {
        Long userId = (Long) authentication.getPrincipal();
        return ApiResponse.success(bestPhotoService.nominate(request.getAlbumPhotoId(), userId));
    }

    @Operation(summary = "추천 취소")
    @DeleteMapping("/nominate/{id}")
    public ApiResponse<Void> cancelNomination(
            Authentication authentication,
            @PathVariable Long id) {
        Long userId = (Long) authentication.getPrincipal();
        bestPhotoService.cancelNomination(id, userId);
        return ApiResponse.success(null);
    }

    @Operation(summary = "투표")
    @PostMapping("/vote")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<Void> vote(
            Authentication authentication,
            @RequestBody VoteRequest request) {
        Long userId = (Long) authentication.getPrincipal();
        bestPhotoService.vote(request.getNominationId(), userId);
        return ApiResponse.success(null);
    }

    @Operation(summary = "현재 베스트 포토 상태 조회")
    @GetMapping("/status")
    public ApiResponse<BestPhotoStatusResponse> getStatus(Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();
        return ApiResponse.success(bestPhotoService.getStatus(userId));
    }
}
