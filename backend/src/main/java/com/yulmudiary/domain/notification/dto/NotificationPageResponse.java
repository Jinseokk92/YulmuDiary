package com.yulmudiary.domain.notification.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class NotificationPageResponse {

    private List<NotificationResponse> items;
    private Long nextCursor;
    private boolean hasNext;
}
