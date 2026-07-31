package com.yulmudiary.global.admin.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 관리자 앱 설정 변경 요청 DTO
 *
 * @param bornAt       실제 출생 일시. <b>null이면 "변경 없음"</b>으로 처리되어 기존 값이 유지된다.
 *                     (bornAt을 보내지 않는 기존 클라이언트가 저장할 때 기존 출생일시가 지워지지 않도록 한 조치)
 *                     미래 시각은 허용하지 않는다.
 * @param clearBornAt  {@code true}면 출생일시를 명시적으로 비운다(null로 초기화). {@code bornAt}과
 *                     동시에 값이 오면 요청 자체를 거부한다.
 */
public record AppSettingsUpdateRequest(
        @NotBlank
        @Size(max = 30)
        String babyName,

        @NotNull
        LocalDate dueDate,

        @PastOrPresent(message = "출생 일시는 미래로 설정할 수 없습니다.")
        LocalDateTime bornAt,

        Boolean clearBornAt
) {}
