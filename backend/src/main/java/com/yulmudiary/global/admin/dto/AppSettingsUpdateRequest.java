package com.yulmudiary.global.admin.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record AppSettingsUpdateRequest(
        @NotBlank
        @Size(max = 30)
        String babyName,

        @NotNull
        LocalDate dueDate
) {}
