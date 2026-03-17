package com.yulmudiary.domain.diary.controller;

import com.yulmudiary.domain.diary.dto.ReactionRequest;
import com.yulmudiary.domain.diary.dto.ReactionResponse;
import com.yulmudiary.domain.diary.dto.ReactionUserResponse;
import com.yulmudiary.domain.diary.service.ReactionService;
import com.yulmudiary.global.auth.AuthTarget;
import com.yulmudiary.global.auth.CheckFamilyAuth;
import com.yulmudiary.global.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "Reaction", description = "리액션 API")
@RestController
@RequestMapping("/api/diary-posts/{postId}/reactions")
@RequiredArgsConstructor
public class ReactionController {

    private final ReactionService reactionService;

    @Operation(summary = "게시글 리액션 사용자 목록")
    @CheckFamilyAuth(AuthTarget.POST_ID)
    @GetMapping("/users")
    public ApiResponse<List<ReactionUserResponse>> getUsers(@PathVariable Long postId) {
        return ApiResponse.success(reactionService.getReactionUsers(postId));
    }

    @Operation(summary = "리액션 토글 (추가/삭제)")
    @CheckFamilyAuth(AuthTarget.POST_ID)
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
