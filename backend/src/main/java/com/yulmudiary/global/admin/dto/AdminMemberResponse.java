package com.yulmudiary.global.admin.dto;

import com.yulmudiary.domain.family.entity.FamilyMembership;

import java.time.LocalDateTime;

public record AdminMemberResponse(
        Long userId,
        String name,
        String email,
        String profileImageUrl,
        String role,
        LocalDateTime joinedAt
) {
    public static AdminMemberResponse from(FamilyMembership membership) {
        return new AdminMemberResponse(
                membership.getUser().getId(),
                membership.getUser().getName(),
                membership.getUser().getEmail(),
                membership.getUser().getProfileImageUrl(),
                membership.getRole().name(),
                membership.getCreatedAt()
        );
    }
}
