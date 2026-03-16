package com.yulmudiary.domain.schedule.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;

@Getter
@NoArgsConstructor
public class ScheduleRequest {

    @NotBlank(message = "일정 제목은 필수입니다.")
    private String title;

    private String memo;

    @NotNull(message = "일정 날짜는 필수입니다.")
    private LocalDate eventDate;

    private Boolean isAllDay = true;

    @JsonFormat(pattern = "HH:mm")
    private LocalTime startTime;

    @JsonFormat(pattern = "HH:mm")
    private LocalTime endTime;

    private String placeName;

    private String placeAddress;

    /** 종일 아닌 경우 시작·종료 시간 필수 검증 */
    @AssertTrue(message = "종일 일정이 아닌 경우 시작 시간과 종료 시간이 필요합니다.")
    public boolean isTimesRequiredWhenNotAllDay() {
        if (Boolean.FALSE.equals(isAllDay)) {
            return startTime != null && endTime != null;
        }
        return true;
    }

    /** 종료 시간은 시작 시간 이후여야 함 */
    @AssertTrue(message = "종료 시간은 시작 시간 이후여야 합니다.")
    public boolean isEndTimeAfterStartTime() {
        if (startTime != null && endTime != null) {
            return endTime.isAfter(startTime);
        }
        return true;
    }
}
