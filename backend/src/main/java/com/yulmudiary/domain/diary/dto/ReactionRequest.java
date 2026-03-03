package com.yulmudiary.domain.diary.dto;

import jakarta.validation.constraints.NotBlank;

public record ReactionRequest(
        @NotBlank(message = "emoji는 필수입니다.") String emoji
) {}
