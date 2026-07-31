package com.yulmudiary.domain.baby.dto;

import com.yulmudiary.domain.baby.entity.Baby;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;

/**
 * Baby 조회 응답 DTO
 * birthDate 필드를 출산 예정일(dueDate)로 활용한다.
 *
 * <p>응답은 "출산 전" 필드군과 "출산 후" 필드군으로 나뉘며, {@code born} 값으로 구분한다.
 *
 * <ul>
 *   <li>출산 전({@code born=false}) : dDayCount · pregnancyWeeks · pregnancyDays 사용</li>
 *   <li>출산 후({@code born=true})  : ageDays · ageWeeks · ageRemainDays 사용</li>
 * </ul>
 *
 * <p><b>주의</b> — dDayCount·pregnancyWeeks·pregnancyDays는 언제나 <i>출산 예정일</i> 기준으로
 * 계산된다. 예정일이 지나면 dDayCount는 음수가 되고 pregnancyWeeks는 40주를 넘어가지만,
 * 이는 실제 출생과 무관한 값이다. 기존 클라이언트와의 호환을 위해 계산식을 그대로 두므로
 * {@code born=true}인 경우 이 세 필드에 의존해서는 안 된다.
 */
public record BabyResponse(
        Long id,
        String name,
        String dueDate,         // YYYY-MM-DD (출산 예정일)
        int dDayCount,          // 예정일까지 남은 일수 (양수=D-N, 0=D-Day, 음수=D+N) — born=true면 무의미
        int pregnancyWeeks,     // 임신 주차 — born=true면 무의미
        int pregnancyDays,      // 주차 내 나머지 일수 — born=true면 무의미
        String gender,
        String profileImageUrl, // 대표 사진 URL (미등록 시 null)

        // ── 실제 출생 기준 필드 ──────────────────────────────────────────
        LocalDateTime bornAt,   // 실제 출생 일시 (출산 전이면 null)
        boolean born,           // 출생일이 오늘 이하이면 true
        int ageDays,            // 생후 일수 (출생 당일 = 0) — born=false면 0
        int ageWeeks,           // ageDays / 7 — born=false면 0
        int ageRemainDays       // ageDays % 7 — born=false면 0
) {
    /** 표준 임신 기간: 40주 = 280일 */
    private static final int STANDARD_PREGNANCY_DAYS = 280;

    /** 서비스 기준 시간대. JVM 기본 타임존과 무관하게 항상 KST로 '오늘'을 판단한다. */
    private static final ZoneId KST = ZoneId.of("Asia/Seoul");

    public static BabyResponse from(Baby baby) {
        return from(baby, LocalDate.now(KST));
    }

    /**
     * '오늘'을 주입받는 변환 메서드. 날짜 경계 테스트용으로 분리했다.
     *
     * @param today Asia/Seoul 기준 오늘 날짜
     */
    static BabyResponse from(Baby baby, LocalDate today) {
        LocalDate dueDate = baby.getBirthDate(); // birthDate를 출산 예정일로 사용

        // D-day: 예정일 - 오늘 (양수=미래=D-N, 0=당일, 음수=과거=D+N)
        long dDayCount = ChronoUnit.DAYS.between(today, dueDate);

        // LMP(마지막 생리일) = 출산 예정일 - 280일 (역산)
        LocalDate lmp = dueDate.minusDays(STANDARD_PREGNANCY_DAYS);
        long totalPregnancyDays = ChronoUnit.DAYS.between(lmp, today);

        int pregnancyWeeks = totalPregnancyDays > 0 ? (int) (totalPregnancyDays / 7) : 0;
        int pregnancyDays  = totalPregnancyDays > 0 ? (int) (totalPregnancyDays % 7) : 0;

        // 실제 출생 기준 계산.
        // 시각(예: 09:12)은 무시하고 날짜 차이만 사용한다. Duration을 쓰면 24시간이 지나지 않은
        // 만큼 하루가 절사되어 D+1이 밀리므로 반드시 toLocalDate() 후 DAYS.between으로 계산한다.
        LocalDateTime bornAt = baby.getBornAt();
        boolean born = bornAt != null && !bornAt.toLocalDate().isAfter(today);

        int ageDays = born ? (int) ChronoUnit.DAYS.between(bornAt.toLocalDate(), today) : 0;

        return new BabyResponse(
                baby.getId(),
                baby.getName(),
                dueDate.toString(),
                (int) dDayCount,
                pregnancyWeeks,
                pregnancyDays,
                baby.getGender().name(),
                baby.getProfileImageUrl(),
                bornAt,
                born,
                ageDays,
                ageDays / 7,
                ageDays % 7
        );
    }
}
