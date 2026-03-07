package com.yulmudiary.domain.diary.repository;

import com.yulmudiary.domain.diary.entity.DiaryPost;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface DiaryPostRepository extends JpaRepository<DiaryPost, Long> {

    // ── 커서 기반 (기존 유지) ──────────────────────────────────────────

    @Query("SELECT dp FROM DiaryPost dp JOIN FETCH dp.author JOIN FETCH dp.baby " +
            "WHERE dp.baby.id = :babyId AND dp.id < :cursor ORDER BY dp.id DESC")
    List<DiaryPost> findByBabyIdAndCursor(@Param("babyId") Long babyId,
                                          @Param("cursor") Long cursor,
                                          Pageable pageable);

    @Query("SELECT dp FROM DiaryPost dp JOIN FETCH dp.author JOIN FETCH dp.baby " +
            "WHERE dp.baby.id = :babyId ORDER BY dp.id DESC")
    List<DiaryPost> findByBabyIdLatest(@Param("babyId") Long babyId, Pageable pageable);

    // ── 페이지 번호 기반 전용 count (신규) ────────────────────────────

    @Query("SELECT COUNT(dp) FROM DiaryPost dp WHERE dp.baby.id = :babyId")
    long countByBabyId(@Param("babyId") Long babyId);

    @Query("SELECT COUNT(dp) FROM DiaryPost dp WHERE dp.author.id = :authorId")
    long countByAuthorId(@Param("authorId") Long authorId);

    @Query("SELECT COUNT(m) FROM Media m WHERE m.diaryPost.author.id = :authorId")
    long countMediaByAuthorId(@Param("authorId") Long authorId);

    // ── 내 게시글 (작성자 기반 커서 페이징) ──────────────────────────

    @Query("SELECT dp FROM DiaryPost dp JOIN FETCH dp.author JOIN FETCH dp.baby " +
            "WHERE dp.author.id = :authorId ORDER BY dp.id DESC")
    List<DiaryPost> findByAuthorIdLatest(@Param("authorId") Long authorId, Pageable pageable);

    @Query("SELECT dp FROM DiaryPost dp JOIN FETCH dp.author JOIN FETCH dp.baby " +
            "WHERE dp.author.id = :authorId AND dp.id < :cursor ORDER BY dp.id DESC")
    List<DiaryPost> findByAuthorIdAndCursor(@Param("authorId") Long authorId,
                                            @Param("cursor") Long cursor,
                                            Pageable pageable);

    // ── 단건 조회 ─────────────────────────────────────────────────────

    @Query("SELECT dp FROM DiaryPost dp JOIN FETCH dp.author LEFT JOIN FETCH dp.mediaList WHERE dp.id = :id")
    Optional<DiaryPost> findByIdWithMedia(@Param("id") Long id);
}
