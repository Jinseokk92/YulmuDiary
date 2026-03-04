package com.yulmudiary.domain.schedule.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Getter
@NoArgsConstructor
public class ScheduleRequest {

    @NotBlank(message = "일정 제목은 필수입니다.")
    private String title;

    private String memo;

    @NotNull(message = "일정 날짜는 필수입니다.")
    private LocalDate eventDate;

    private Boolean isAllDay = true;

    private String placeName;

    private String address;

    private String addressDetail;
}
