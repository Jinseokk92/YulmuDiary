package com.yulmudiary.global.admin.dto;

import com.yulmudiary.domain.baby.entity.Baby;

import java.time.LocalDate;

public record AppSettingsResponse(
        Long babyId,
        String babyName,
        LocalDate dueDate
) {
    public static AppSettingsResponse from(Baby baby) {
        return new AppSettingsResponse(baby.getId(), baby.getName(), baby.getBirthDate());
    }
}
