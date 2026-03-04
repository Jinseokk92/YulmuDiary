package com.yulmudiary.domain.baby.dto;

import com.yulmudiary.domain.baby.entity.Baby;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

/**
 * Baby 조회 응답 DTO
 * birthDate 필드를 출산 예정일(dueDate)로 활용한다.
 *
 * - dDayCount : 양수 = 예정일까지 남은 일수(D-N), 0 = D-Day, 음수 = 예정일이 지난 일수(D+N)
 * - pregnancyWeeks/Days : 표준 임신 기간 40주(280일) 기준으로 LMP를 역산해 계산
 */
public record BabyResponse(
        Long id,
        String name,
        String dueDate,         // YYYY-MM-DD
        int dDayCount,          // 남은 일수 (양수=D-N, 0=D-Day, 음수=D+N)
        int pregnancyWeeks,     // 임신 주차
        int pregnancyDays,      // 주차 내 나머지 일수
        String gender,
        String profileImageUrl
) {
    /** 표준 임신 기간: 40주 = 280일 */
    private static final int STANDARD_PREGNANCY_DAYS = 280;

    public static BabyResponse from(Baby baby) {
        LocalDate today = LocalDate.now();
        LocalDate dueDate = baby.getBirthDate(); // birthDate를 출산 예정일로 사용

        // D-day: 예정일 - 오늘 (양수=미래=D-N, 0=당일, 음수=과거=D+N)
        long dDayCount = ChronoUnit.DAYS.between(today, dueDate);

        // LMP(마지막 생리일) = 출산 예정일 - 280일 (역산)
        LocalDate lmp = dueDate.minusDays(STANDARD_PREGNANCY_DAYS);
        long totalPregnancyDays = ChronoUnit.DAYS.between(lmp, today);

        int pregnancyWeeks = totalPregnancyDays > 0 ? (int) (totalPregnancyDays / 7) : 0;
        int pregnancyDays  = totalPregnancyDays > 0 ? (int) (totalPregnancyDays % 7) : 0;

        return new BabyResponse(
                baby.getId(),
                baby.getName(),
                dueDate.toString(),
                (int) dDayCount,
                pregnancyWeeks,
                pregnancyDays,
                baby.getGender().name(),
                baby.getProfileImageUrl()
        );
    }
}
