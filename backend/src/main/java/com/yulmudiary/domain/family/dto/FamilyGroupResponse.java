package com.yulmudiary.domain.family.dto;

import com.yulmudiary.domain.family.entity.FamilyGroup;

public record FamilyGroupResponse(
        Long id,
        String name,
        /** RELATIVE 초대 코드 */
        String inviteCode,
        /** PARENT 초대 코드 (null이면 비활성) */
        String parentInviteCode
) {
    public static FamilyGroupResponse from(FamilyGroup group) {
        return new FamilyGroupResponse(
                group.getId(),
                group.getName(),
                group.getInviteCode(),
                group.getParentInviteCode()
        );
    }
}
