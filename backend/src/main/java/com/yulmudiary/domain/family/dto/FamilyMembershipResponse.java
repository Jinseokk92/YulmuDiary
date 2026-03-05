package com.yulmudiary.domain.family.dto;

import com.yulmudiary.domain.family.entity.FamilyMembership;

public record FamilyMembershipResponse(
        Long membershipId,
        Long familyGroupId,
        String familyGroupName,
        /** "PARENT" 또는 "RELATIVE" */
        String role
) {
    public static FamilyMembershipResponse from(FamilyMembership membership) {
        return new FamilyMembershipResponse(
                membership.getId(),
                membership.getFamilyGroup().getId(),
                membership.getFamilyGroup().getName(),
                membership.getRole().name()
        );
    }
}
