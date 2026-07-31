package com.yulmudiary.domain.baby.dto;

import com.yulmudiary.domain.baby.entity.Baby;
import com.yulmudiary.domain.baby.entity.Gender;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * BabyResponse의 출생 기준 계산 검증.
 * Spring 컨텍스트 없이 동작하도록 '오늘'을 주입하는 오버로드를 사용한다.
 */
class BabyResponseTest {

    private static final LocalDate DUE_DATE = LocalDate.of(2026, 6, 27);

    private Baby baby(LocalDateTime bornAt) {
        Baby baby = Baby.builder()
                .name("율무")
                .birthDate(DUE_DATE)
                .gender(Gender.MALE)
                .build();
        baby.updateBornAt(bornAt);
        return baby;
    }

    @Nested
    @DisplayName("bornAt이 없으면")
    class WhenBornAtIsNull {

        @Test
        @DisplayName("출산 전 상태로 동작하고 age 필드는 모두 0이다")
        void treatsAsNotBorn() {
            BabyResponse response = BabyResponse.from(baby(null), LocalDate.of(2026, 7, 31));

            assertThat(response.bornAt()).isNull();
            assertThat(response.born()).isFalse();
            assertThat(response.ageDays()).isZero();
            assertThat(response.ageWeeks()).isZero();
            assertThat(response.ageRemainDays()).isZero();
        }

        @Test
        @DisplayName("기존 임신 필드는 그대로 계산된다")
        void keepsLegacyPregnancyFields() {
            // LMP = 2026-06-27 - 280일 = 2025-09-20, 2026-05-16은 LMP+238일 = 34주 0일
            BabyResponse response = BabyResponse.from(baby(null), LocalDate.of(2026, 5, 16));

            assertThat(response.dueDate()).isEqualTo("2026-06-27");
            assertThat(response.dDayCount()).isEqualTo(42);
            assertThat(response.pregnancyWeeks()).isEqualTo(34);
            assertThat(response.pregnancyDays()).isZero();
        }
    }

    @Nested
    @DisplayName("bornAt이 있으면")
    class WhenBornAtExists {

        @Test
        @DisplayName("출생 당일은 D+0이다")
        void birthDayIsZero() {
            LocalDateTime bornAt = LocalDateTime.of(2026, 6, 12, 9, 12);

            BabyResponse response = BabyResponse.from(baby(bornAt), LocalDate.of(2026, 6, 12));

            assertThat(response.born()).isTrue();
            assertThat(response.ageDays()).isZero();
            assertThat(response.ageWeeks()).isZero();
            assertThat(response.ageRemainDays()).isZero();
            assertThat(response.bornAt()).isEqualTo(bornAt);
        }

        @Test
        @DisplayName("다음 날은 D+1이다 — 출생 시각(09:12)이 지나지 않아도 날짜가 바뀌면 1일")
        void nextDayIsOne() {
            LocalDateTime bornAt = LocalDateTime.of(2026, 6, 12, 9, 12);

            BabyResponse response = BabyResponse.from(baby(bornAt), LocalDate.of(2026, 6, 13));

            assertThat(response.ageDays()).isEqualTo(1);
            assertThat(response.ageWeeks()).isZero();
            assertThat(response.ageRemainDays()).isEqualTo(1);
        }

        @Test
        @DisplayName("2026-06-12 09:12 출생 → 2026-07-31은 D+49 (7주 0일)")
        void dPlus49() {
            LocalDateTime bornAt = LocalDateTime.of(2026, 6, 12, 9, 12);

            BabyResponse response = BabyResponse.from(baby(bornAt), LocalDate.of(2026, 7, 31));

            assertThat(response.born()).isTrue();
            assertThat(response.ageDays()).isEqualTo(49);
            assertThat(response.ageWeeks()).isEqualTo(7);
            assertThat(response.ageRemainDays()).isZero();
        }

        @Test
        @DisplayName("시각이 늦어도(23:59) 날짜 차이만 사용해 D+49가 유지된다")
        void ignoresTimeOfDay() {
            LocalDateTime lateNight = LocalDateTime.of(2026, 6, 12, 23, 59);

            BabyResponse response = BabyResponse.from(baby(lateNight), LocalDate.of(2026, 7, 31));

            assertThat(response.ageDays()).isEqualTo(49);
        }

        @Test
        @DisplayName("주차 나머지가 있는 경우 ageWeeks/ageRemainDays로 분해된다")
        void splitsWeeksAndDays() {
            LocalDateTime bornAt = LocalDateTime.of(2026, 6, 12, 9, 12);

            // 6/12 + 10일 = 6/22
            BabyResponse response = BabyResponse.from(baby(bornAt), LocalDate.of(2026, 6, 22));

            assertThat(response.ageDays()).isEqualTo(10);
            assertThat(response.ageWeeks()).isEqualTo(1);
            assertThat(response.ageRemainDays()).isEqualTo(3);
        }

        @Test
        @DisplayName("출생일이 미래면 아직 출산 전으로 본다")
        void futureBornAtIsNotBorn() {
            LocalDateTime future = LocalDateTime.of(2026, 6, 12, 9, 12);

            BabyResponse response = BabyResponse.from(baby(future), LocalDate.of(2026, 6, 11));

            assertThat(response.born()).isFalse();
            assertThat(response.ageDays()).isZero();
            // 값 자체는 표시용으로 그대로 내려준다
            assertThat(response.bornAt()).isEqualTo(future);
        }
    }
}
