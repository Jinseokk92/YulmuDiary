package com.yulmudiary.domain.user.dto;

import com.yulmudiary.domain.user.entity.User;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class UserResponse {

    private Long id;
    private String name;
    private String profileImageUrl;
    private String bio;

    public static UserResponse from(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .profileImageUrl(user.getProfileImageUrl())
                .bio(user.getBio())
                .build();
    }
}
