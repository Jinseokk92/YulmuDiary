package com.yulmudiary.global.admin.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record InviteCodeRegenerateRequest(
        @NotBlank
        @Pattern(regexp = "PARENT|RELATIVE", message = "role은 PARENT 또는 RELATIVE여야 합니다.")
        String role
) {}
