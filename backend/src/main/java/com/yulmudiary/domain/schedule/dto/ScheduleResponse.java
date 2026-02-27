package com.yulmudiary.domain.schedule.dto;

import com.yulmudiary.domain.schedule.entity.Schedule;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Builder
public class ScheduleResponse {

    private Long id;
    private Long userId;
    private String userNickname;
    private String title;
    private String memo;
    private LocalDate eventDate;
    private Boolean isAllDay;
    private LocalDateTime createdAt;

    public static ScheduleResponse from(Schedule schedule) {
        return ScheduleResponse.builder()
                .id(schedule.getId())
                .userId(schedule.getAuthor().getId())
                .userNickname(schedule.getAuthor().getName())
                .title(schedule.getTitle())
                .memo(schedule.getMemo())
                .eventDate(schedule.getEventDate())
                .isAllDay(schedule.getIsAllDay())
                .createdAt(schedule.getCreatedAt())
                .build();
    }
}
