package com.yulmudiary.domain.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class UserUpdateRequest {

    @NotBlank(message = "닉네임은 필수입니다.")
    @Size(max = 30, message = "닉네임은 30자 이하여야 합니다.")
    private String name;

    @Size(max = 100, message = "한 줄 소개는 100자 이하여야 합니다.")
    private String bio;
}
