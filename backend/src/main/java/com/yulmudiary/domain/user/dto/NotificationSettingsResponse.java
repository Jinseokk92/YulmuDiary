package com.yulmudiary.domain.user.dto;

import com.yulmudiary.domain.user.entity.User;
import lombok.Builder;

@Builder
public record NotificationSettingsResponse(
        boolean commentNotificationEnabled,
        boolean reactionNotificationEnabled
) {
    public static NotificationSettingsResponse from(User user) {
        return NotificationSettingsResponse.builder()
                .commentNotificationEnabled(user.isCommentNotificationEnabled())
                .reactionNotificationEnabled(user.isReactionNotificationEnabled())
                .build();
    }
}
