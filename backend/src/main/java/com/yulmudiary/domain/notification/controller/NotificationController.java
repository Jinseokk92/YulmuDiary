package com.yulmudiary.domain.notification.controller;

import com.yulmudiary.domain.notification.dto.NotificationPageResponse;
import com.yulmudiary.domain.notification.service.NotificationService;
import com.yulmudiary.global.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Slf4j
@Tag(name = "Notification", description = "알림 API")
@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @Operation(summary = "내 알림 목록 (커서 페이징, 최신순)")
    @GetMapping
    public ApiResponse<NotificationPageResponse> getMyNotifications(
            Authentication authentication,
            @RequestParam(required = false) Long cursor,
            @RequestParam(defaultValue = "20") int size) {
        Long userId = (Long) authentication.getPrincipal();
        log.debug("[GET /api/notifications] userId={}, cursor={}, size={}", userId, cursor, size);
        return ApiResponse.success(notificationService.getMyNotifications(userId, cursor, size));
    }

    @Operation(summary = "미읽 알림 수")
    @GetMapping("/unread-count")
    public ApiResponse<Map<String, Long>> getUnreadCount(Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();
        long count = notificationService.countUnread(userId);
        return ApiResponse.success(Map.of("count", count));
    }

    @Operation(summary = "전체 읽음 처리")
    @PatchMapping("/read-all")
    public ApiResponse<Void> markAllRead(Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();
        log.debug("[PATCH /api/notifications/read-all] userId={}", userId);
        notificationService.markAllRead(userId);
        return ApiResponse.success(null);
    }

    @Operation(summary = "단건 읽음 처리")
    @PatchMapping("/{id}/read")
    public ApiResponse<Void> markOneRead(
            @PathVariable Long id,
            Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();
        notificationService.markOneRead(id, userId);
        return ApiResponse.success(null);
    }
}
