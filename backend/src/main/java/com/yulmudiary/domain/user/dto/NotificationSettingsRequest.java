package com.yulmudiary.domain.user.dto;

public record NotificationSettingsRequest(
        boolean commentNotificationEnabled,
        boolean reactionNotificationEnabled
) {}
