package com.yulmudiary.domain.family.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record FamilyCreateRequest(

        @NotBlank(message = "가족 그룹 이름은 필수입니다.")
        @Size(max = 50, message = "가족 그룹 이름은 50자 이하여야 합니다.")
        String name
) {}
