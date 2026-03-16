package com.yulmudiary.domain.notification.repository;

import com.yulmudiary.domain.notification.entity.Notification;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    /**
     * 최신순 첫 페이지 (cursor 없음).
     * @EntityGraph 로 sender/diaryPost 즉시 로딩 — JOIN FETCH + Pageable 조합의
     * Hibernate 6 in-memory 페이징 경고를 피하기 위해 파생 쿼리 방식 사용.
     */
    @EntityGraph(attributePaths = {"sender", "diaryPost"})
    List<Notification> findByRecipientIdOrderByIdDesc(Long recipientId, Pageable pageable);

    /**
     * 최신순 이후 페이지 (cursor 있음) — id < cursor 조건.
     */
    @EntityGraph(attributePaths = {"sender", "diaryPost"})
    List<Notification> findByRecipientIdAndIdLessThanOrderByIdDesc(
            Long recipientId, Long id, Pageable pageable);

    /** 미읽 알림 수 */
    long countByRecipientIdAndIsReadFalse(Long recipientId);

    /** 전체 읽음 처리 */
    @Modifying
    @Query("UPDATE Notification n SET n.isRead = true WHERE n.recipient.id = :recipientId AND n.isRead = false")
    void markAllReadByRecipientId(@Param("recipientId") Long recipientId);
}
