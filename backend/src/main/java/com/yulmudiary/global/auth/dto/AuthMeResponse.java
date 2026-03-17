package com.yulmudiary.global.auth.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.yulmudiary.domain.family.entity.FamilyRole;
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
    /** 가족 그룹 내 역할 (PARENT / RELATIVE). 미가입 시 null. */
    private String role;
    private Long familyGroupId;
    private String bio;
    @JsonProperty("isAdmin")
    private boolean isAdmin;

    public static AuthMeResponse of(User user, Long familyGroupId, FamilyRole familyRole) {
        return AuthMeResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .name(user.getName())
                .profileImageUrl(user.getProfileImageUrl())
                .role(familyRole != null ? familyRole.name() : null)
                .familyGroupId(familyGroupId)
                .bio(user.getBio())
                .isAdmin(user.isAdmin())
                .build();
    }
}
