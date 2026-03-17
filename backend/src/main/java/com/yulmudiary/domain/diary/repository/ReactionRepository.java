package com.yulmudiary.domain.diary.repository;

import com.yulmudiary.domain.diary.entity.Reaction;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ReactionRepository extends JpaRepository<Reaction, Long> {

    Optional<Reaction> findByDiaryPostIdAndUserIdAndEmoji(Long diaryPostId, Long userId, String emoji);

    @Query("SELECT COUNT(DISTINCT r.diaryPost.id) FROM Reaction r WHERE r.user.id = :userId")
    long countDistinctPostByUserId(@Param("userId") Long userId);

    // ── 내 반응 (게시글 기준 dedup, 최신 반응 대표, 커서 페이징) ──
    // 같은 게시글에 여러 반응이 있어도 MAX(id) 반응 1개만 조회한다.

    @Query("SELECT r FROM Reaction r JOIN FETCH r.user WHERE r.diaryPost.id = :postId ORDER BY r.id DESC")
    List<Reaction> findByDiaryPostIdWithUser(@Param("postId") Long postId);

    @Query("SELECT r FROM Reaction r JOIN FETCH r.user JOIN FETCH r.diaryPost " +
            "WHERE r.user.id = :userId " +
            "AND r.id = (SELECT MAX(r2.id) FROM Reaction r2 " +
            "            WHERE r2.user.id = :userId AND r2.diaryPost.id = r.diaryPost.id) " +
            "ORDER BY r.id DESC")
    List<Reaction> findByUserIdLatest(@Param("userId") Long userId, Pageable pageable);

    @Query("SELECT r FROM Reaction r JOIN FETCH r.user JOIN FETCH r.diaryPost " +
            "WHERE r.user.id = :userId AND r.id < :cursor " +
            "AND r.id = (SELECT MAX(r2.id) FROM Reaction r2 " +
            "            WHERE r2.user.id = :userId AND r2.diaryPost.id = r.diaryPost.id) " +
            "ORDER BY r.id DESC")
    List<Reaction> findByUserIdAndCursor(@Param("userId") Long userId,
                                         @Param("cursor") Long cursor,
                                         Pageable pageable);
}
