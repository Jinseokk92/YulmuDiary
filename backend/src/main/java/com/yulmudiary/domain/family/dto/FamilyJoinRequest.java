package com.yulmudiary.domain.family.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record FamilyJoinRequest(

        @NotBlank(message = "초대 코드는 필수입니다.")
        @Size(min = 6, max = 6, message = "초대 코드는 6자리여야 합니다.")
        String inviteCode
) {}
