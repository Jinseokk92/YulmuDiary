package com.yulmudiary.domain.notification.service;

import com.yulmudiary.domain.diary.entity.DiaryPost;
import com.yulmudiary.domain.media.service.MediaUrlResolver;
import com.yulmudiary.domain.notification.dto.NotificationPageResponse;
import com.yulmudiary.domain.notification.dto.NotificationResponse;
import com.yulmudiary.domain.notification.entity.Notification;
import com.yulmudiary.domain.notification.entity.NotificationType;
import com.yulmudiary.domain.notification.repository.NotificationRepository;
import com.yulmudiary.domain.user.entity.User;
import com.yulmudiary.global.exception.NotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final MediaUrlResolver mediaUrlResolver;

    /**
     * 알림 생성.
     * sender == recipient(자기 자신 행위)이면 생성하지 않는다.
     *
     * @param extra COMMENT → 댓글 내용 전문 / REACTION → 이모지 문자열
     */
    @Transactional
    public void create(User sender, User recipient, DiaryPost diaryPost,
                       NotificationType type, String extra) {
        if (sender.getId().equals(recipient.getId())) {
            log.debug("[알림 생성 스킵] 자기 자신 행위 — userId={}", sender.getId());
            return;
        }
        if (type == NotificationType.COMMENT && !recipient.isCommentNotificationEnabled()) {
            log.debug("[알림 생성 스킵] 댓글 알림 비활성 — recipientId={}", recipient.getId());
            return;
        }
        if (type == NotificationType.REACTION && !recipient.isReactionNotificationEnabled()) {
            log.debug("[알림 생성 스킵] 반응 알림 비활성 — recipientId={}", recipient.getId());
            return;
        }
        String message = buildMessage(sender.getName(), type, extra);
        Notification notification = Notification.builder()
                .recipient(recipient)
                .sender(sender)
                .diaryPost(diaryPost)
                .type(type)
                .message(message)
                .extra(extra)
                .build();
        notificationRepository.save(notification);
        log.debug("[알림 생성] type={}, sender={}, recipient={}, diaryPostId={}",
                type, sender.getId(), recipient.getId(), diaryPost.getId());
    }

    /** 내 알림 목록 (커서 페이징, 최신순) */
    public NotificationPageResponse getMyNotifications(Long userId, Long cursor, int size) {
        log.debug("[알림 목록 조회] userId={}, cursor={}, size={}", userId, cursor, size);

        List<Notification> notifications;
        if (cursor == null) {
            notifications = notificationRepository.findByRecipientIdOrderByIdDesc(
                    userId, PageRequest.of(0, size + 1));
        } else {
            notifications = notificationRepository.findByRecipientIdAndIdLessThanOrderByIdDesc(
                    userId, cursor, PageRequest.of(0, size + 1));
        }

        log.debug("[알림 목록 조회] 결과 수={}", notifications.size());

        boolean hasNext = notifications.size() > size;
        List<Notification> content = hasNext ? notifications.subList(0, size) : notifications;

        Long nextCursor = hasNext ? content.get(content.size() - 1).getId() : null;
        return NotificationPageResponse.builder()
                .items(content.stream().map(n -> NotificationResponse.from(n, mediaUrlResolver)).toList())
                .nextCursor(nextCursor)
                .hasNext(hasNext)
                .build();
    }

    /** 미읽 알림 수 */
    public long countUnread(Long userId) {
        long count = notificationRepository.countByRecipientIdAndIsReadFalse(userId);
        log.debug("[미읽 알림 수] userId={}, count={}", userId, count);
        return count;
    }

    /** 전체 읽음 처리 */
    @Transactional
    public void markAllRead(Long userId) {
        notificationRepository.markAllReadByRecipientId(userId);
        log.debug("[전체 읽음 처리] userId={}", userId);
    }

    /** 단건 읽음 처리 */
    @Transactional
    public void markOneRead(Long notificationId, Long userId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new NotFoundException("알림을 찾을 수 없습니다. id=" + notificationId));
        if (!notification.getRecipient().getId().equals(userId)) {
            return;
        }
        notification.markRead();
    }

    // ── private ─────────────────────────────────────────────────────────────

    private String buildMessage(String senderName, NotificationType type, String extra) {
        return switch (type) {
            case COMMENT -> {
                String preview = (extra != null && extra.length() > 30)
                        ? extra.substring(0, 30) + "..."
                        : (extra != null ? extra : "");
                yield senderName + "님이 댓글을 남겼어요: " + preview;
            }
            case REACTION -> {
                String emoji = (extra != null && !extra.isBlank()) ? extra + " " : "";
                yield senderName + "님이 " + emoji + "반응을 남겼어요.";
            }
        };
    }
}
