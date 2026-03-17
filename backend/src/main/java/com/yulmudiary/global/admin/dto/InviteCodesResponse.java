package com.yulmudiary.global.admin.dto;

import com.yulmudiary.domain.family.entity.FamilyGroup;

public record InviteCodesResponse(
        String relativeCode,
        String parentCode
) {
    public static InviteCodesResponse from(FamilyGroup group) {
        return new InviteCodesResponse(group.getInviteCode(), group.getParentInviteCode());
    }
}
