package com.yulmudiary.domain.diary.controller;

import com.yulmudiary.domain.diary.dto.CommentRequest;
import com.yulmudiary.domain.diary.dto.CommentResponse;
import com.yulmudiary.domain.diary.service.CommentService;
import com.yulmudiary.global.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "Comment", description = "댓글 API")
@RestController
@RequestMapping("/api/diary-posts/{postId}/comments")
@RequiredArgsConstructor
public class CommentController {

    private final CommentService commentService;

    @Operation(summary = "댓글 목록 조회")
    @GetMapping
    public ApiResponse<List<CommentResponse>> getByPostId(@PathVariable Long postId) {
        return ApiResponse.success(commentService.getByPostId(postId));
    }

    @Operation(summary = "댓글 작성")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<CommentResponse> create(
            @PathVariable Long postId,
            Authentication authentication,
            @Valid @RequestBody CommentRequest request) {
        Long userId = (Long) authentication.getPrincipal();
        return ApiResponse.success(commentService.create(postId, userId, request));
    }

    @Operation(summary = "댓글 삭제")
    @DeleteMapping("/{commentId}")
    public ApiResponse<Void> delete(
            @PathVariable Long postId,
            @PathVariable Long commentId,
            Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();
        commentService.delete(commentId, userId);
        return ApiResponse.success(null);
    }
}
