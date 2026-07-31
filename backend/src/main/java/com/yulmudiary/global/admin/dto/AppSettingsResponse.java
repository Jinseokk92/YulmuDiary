package com.yulmudiary.global.admin.dto;

import com.yulmudiary.domain.baby.entity.Baby;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 관리자 앱 설정 응답 DTO
 *
 * @param dueDate         출산 예정일 (Baby.birthDate)
 * @param bornAt          실제 출생 일시 (미등록 시 null)
 * @param profileImageUrl 아기 대표 사진 URL (미등록 시 null)
 */
public record AppSettingsResponse(
        Long babyId,
        String babyName,
        LocalDate dueDate,
        LocalDateTime bornAt,
        String profileImageUrl
) {
    public static AppSettingsResponse from(Baby baby) {
        return new AppSettingsResponse(
                baby.getId(),
                baby.getName(),
                baby.getBirthDate(),
                baby.getBornAt(),
                baby.getProfileImageUrl()
        );
    }
}
