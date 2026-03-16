package com.yulmudiary.domain.notification.dto;

import com.yulmudiary.domain.diary.entity.Media;
import com.yulmudiary.domain.media.service.MediaUrlResolver;
import com.yulmudiary.domain.notification.entity.Notification;
import com.yulmudiary.domain.notification.entity.NotificationType;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.Comparator;

@Getter
@Builder
public class NotificationResponse {

    private Long id;
    private Long senderId;
    private String senderNickname;
    private String senderProfileImageUrl;
    private Long diaryPostId;
    private String diaryThumbnailUrl;
    private String diaryContentSnippet;
    private NotificationType type;
    private String message;

    /** 댓글 알림일 때만 포함. 댓글 내용 미리보기 (최대 30자). */
    private String commentPreview;

    /** 반응 알림일 때만 포함. 실제 이모지 문자열 (예: "😍"). */
    private String reactionEmoji;

    private boolean isRead;
    private LocalDateTime createdAt;

    public static NotificationResponse from(Notification n, MediaUrlResolver resolver) {
        // 일기 첫 번째 이미지 썸네일
        String rawThumbnail = n.getDiaryPost().getMediaList().stream()
                .min(Comparator.comparingInt(Media::getDisplayOrder))
                .map(m -> m.getThumbnailUrl() != null ? m.getThumbnailUrl() : m.getUrl())
                .orElse(null);

        // 일기 내용 앞 60자
        String content = n.getDiaryPost().getContent();
        String snippet = (content != null && content.length() > 60)
                ? content.substring(0, 60)
                : content;

        // 타입별 부가 필드 파생
        String commentPreview = null;
        String reactionEmoji = null;
        if (n.getType() == NotificationType.COMMENT && n.getExtra() != null) {
            String raw = n.getExtra();
            commentPreview = raw.length() > 30 ? raw.substring(0, 30) : raw;
        } else if (n.getType() == NotificationType.REACTION) {
            reactionEmoji = n.getExtra();
        }

        return NotificationResponse.builder()
                .id(n.getId())
                .senderId(n.getSender().getId())
                .senderNickname(n.getSender().getName())
                .senderProfileImageUrl(n.getSender().getProfileImageUrl())
                .diaryPostId(n.getDiaryPost().getId())
                .diaryThumbnailUrl(resolver.resolve(rawThumbnail))
                .diaryContentSnippet(snippet)
                .type(n.getType())
                .message(n.getMessage())
                .commentPreview(commentPreview)
                .reactionEmoji(reactionEmoji)
                .isRead(n.isRead())
                .createdAt(n.getCreatedAt())
                .build();
    }
}
