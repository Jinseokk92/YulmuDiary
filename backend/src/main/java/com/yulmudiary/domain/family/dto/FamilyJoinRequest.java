package com.yulmudiary.domain.family.dto;

import jakarta.validation.constraints.NotBlank;

public record FamilyJoinRequest(
        @NotBlank(message = "초대 코드는 필수입니다.") String inviteCode
) {}
