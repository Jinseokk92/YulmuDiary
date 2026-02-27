package com.yulmudiary.domain.diary.controller;

import com.yulmudiary.domain.diary.dto.ReactionRequest;
import com.yulmudiary.domain.diary.dto.ReactionResponse;
import com.yulmudiary.domain.diary.service.ReactionService;
import com.yulmudiary.global.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@Tag(name = "Reaction", description = "리액션 API")
@RestController
@RequestMapping("/api/diary-posts/{postId}/reactions")
@RequiredArgsConstructor
public class ReactionController {

    private final ReactionService reactionService;

    @Operation(summary = "리액션 토글 (추가/삭제)")
    @PostMapping
    public ApiResponse<ReactionResponse> toggle(
            @PathVariable Long postId,
            Authentication authentication,
            @Valid @RequestBody ReactionRequest request) {
        Long userId = (Long) authentication.getPrincipal();
        ReactionResponse response = reactionService.toggle(postId, userId, request);
        return ApiResponse.success(response);
    }
}
