package com.yulmudiary.domain.album.repository;

import com.yulmudiary.domain.album.entity.AlbumPhoto;
import com.yulmudiary.domain.album.entity.GrowthPhaseType;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface AlbumPhotoRepository extends JpaRepository<AlbumPhoto, Long> {

    // ── 단건 조회 ─────────────────────────────────────────────────────

    @Query("SELECT a FROM AlbumPhoto a JOIN FETCH a.uploader JOIN FETCH a.baby WHERE a.id = :id")
    Optional<AlbumPhoto> findByIdWithUploader(@Param("id") Long id);

    // ── 전체 목록 (필터 없음) ──────────────────────────────────────────

    @Query("SELECT a FROM AlbumPhoto a JOIN FETCH a.uploader " +
           "WHERE a.baby.id = :babyId ORDER BY a.id DESC")
    List<AlbumPhoto> findByBabyIdLatest(@Param("babyId") Long babyId, Pageable pageable);

    @Query("SELECT a FROM AlbumPhoto a JOIN FETCH a.uploader " +
           "WHERE a.baby.id = :babyId AND a.id < :cursor ORDER BY a.id DESC")
    List<AlbumPhoto> findByBabyIdAndCursor(
            @Param("babyId") Long babyId,
            @Param("cursor") Long cursor,
            Pageable pageable);

    // ── growthPhaseType 필터 ───────────────────────────────────────────

    @Query("SELECT a FROM AlbumPhoto a JOIN FETCH a.uploader " +
           "WHERE a.baby.id = :babyId AND a.growthPhaseType = :phase ORDER BY a.id DESC")
    List<AlbumPhoto> findByBabyIdAndPhaseLatest(
            @Param("babyId") Long babyId,
            @Param("phase") GrowthPhaseType phase,
            Pageable pageable);

    @Query("SELECT a FROM AlbumPhoto a JOIN FETCH a.uploader " +
           "WHERE a.baby.id = :babyId AND a.id < :cursor " +
           "AND a.growthPhaseType = :phase ORDER BY a.id DESC")
    List<AlbumPhoto> findByBabyIdAndPhaseAndCursor(
            @Param("babyId") Long babyId,
            @Param("cursor") Long cursor,
            @Param("phase") GrowthPhaseType phase,
            Pageable pageable);

    // ── growthPhaseType + growthIndex 정확히 일치 ─────────────────────

    @Query("SELECT a FROM AlbumPhoto a JOIN FETCH a.uploader " +
           "WHERE a.baby.id = :babyId AND a.growthPhaseType = :phase " +
           "AND a.growthIndex = :index ORDER BY a.id DESC")
    List<AlbumPhoto> findByBabyIdAndPhaseAndIndexLatest(
            @Param("babyId") Long babyId,
            @Param("phase") GrowthPhaseType phase,
            @Param("index") Integer index,
            Pageable pageable);

    @Query("SELECT a FROM AlbumPhoto a JOIN FETCH a.uploader " +
           "WHERE a.baby.id = :babyId AND a.id < :cursor " +
           "AND a.growthPhaseType = :phase AND a.growthIndex = :index ORDER BY a.id DESC")
    List<AlbumPhoto> findByBabyIdAndPhaseAndIndexAndCursor(
            @Param("babyId") Long babyId,
            @Param("cursor") Long cursor,
            @Param("phase") GrowthPhaseType phase,
            @Param("index") Integer index,
            Pageable pageable);

    // ── growthPhaseType + fromIndex ~ toIndex 범위 ────────────────────

    @Query("SELECT a FROM AlbumPhoto a JOIN FETCH a.uploader " +
           "WHERE a.baby.id = :babyId AND a.growthPhaseType = :phase " +
           "AND a.growthIndex BETWEEN :fromIndex AND :toIndex ORDER BY a.id DESC")
    List<AlbumPhoto> findByBabyIdAndPhaseAndRangeLatest(
            @Param("babyId") Long babyId,
            @Param("phase") GrowthPhaseType phase,
            @Param("fromIndex") Integer fromIndex,
            @Param("toIndex") Integer toIndex,
            Pageable pageable);

    @Query("SELECT a FROM AlbumPhoto a JOIN FETCH a.uploader " +
           "WHERE a.baby.id = :babyId AND a.id < :cursor " +
           "AND a.growthPhaseType = :phase " +
           "AND a.growthIndex BETWEEN :fromIndex AND :toIndex ORDER BY a.id DESC")
    List<AlbumPhoto> findByBabyIdAndPhaseAndRangeAndCursor(
            @Param("babyId") Long babyId,
            @Param("cursor") Long cursor,
            @Param("phase") GrowthPhaseType phase,
            @Param("fromIndex") Integer fromIndex,
            @Param("toIndex") Integer toIndex,
            Pageable pageable);
}
