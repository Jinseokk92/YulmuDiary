package com.yulmudiary.global.auth.dto;

import com.yulmudiary.domain.user.entity.User;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class AuthMeResponse {

    private Long id;
    private String email;
    private String name;
    private String profileImageUrl;
    private String role;
    private Long familyGroupId;

    public static AuthMeResponse of(User user, Long familyGroupId) {
        return AuthMeResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .name(user.getName())
                .profileImageUrl(user.getProfileImageUrl())
                .role(user.getRole().name())
                .familyGroupId(familyGroupId)
                .build();
    }
}
