package com.yulmudiary.domain.notification.entity;

import com.yulmudiary.domain.diary.entity.DiaryPost;
import com.yulmudiary.domain.user.entity.User;
import com.yulmudiary.global.entity.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "notifications", indexes = {
        @Index(name = "idx_notification_recipient_read", columnList = "recipient_id, is_read")
})
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Notification extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recipient_id", nullable = false)
    private User recipient;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sender_id", nullable = false)
    private User sender;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "diary_post_id", nullable = false)
    private DiaryPost diaryPost;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private NotificationType type;

    @Column(nullable = false)
    private String message;

    /**
     * 타입별 부가 정보 (원본 값, 잘림 없음).
     * COMMENT → 댓글 전문 (DTO에서 최대 30자로 truncate)
     * REACTION → 이모지 문자열 (예: "😍")
     */
    @Column(length = 500)
    private String extra;

    @Column(nullable = false)
    private boolean isRead = false;

    @Builder
    public Notification(User recipient, User sender, DiaryPost diaryPost,
                        NotificationType type, String message, String extra) {
        this.recipient = recipient;
        this.sender = sender;
        this.diaryPost = diaryPost;
        this.type = type;
        this.message = message;
        this.extra = extra;
        this.isRead = false;
    }

    public void markRead() {
        this.isRead = true;
    }
}
