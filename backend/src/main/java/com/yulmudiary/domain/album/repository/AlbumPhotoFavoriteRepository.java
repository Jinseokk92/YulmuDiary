package com.yulmudiary.domain.album.repository;

import com.yulmudiary.domain.album.entity.AlbumPhotoFavorite;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface AlbumPhotoFavoriteRepository extends JpaRepository<AlbumPhotoFavorite, Long> {

    Optional<AlbumPhotoFavorite> findByAlbumPhotoIdAndUserId(Long albumPhotoId, Long userId);

    boolean existsByAlbumPhotoIdAndUserId(Long albumPhotoId, Long userId);

    void deleteByAlbumPhotoId(Long albumPhotoId);

    @Query("SELECT f FROM AlbumPhotoFavorite f " +
            "JOIN FETCH f.albumPhoto ap " +
            "JOIN FETCH ap.uploader " +
            "JOIN FETCH ap.baby " +
            "WHERE f.user.id = :userId " +
            "ORDER BY f.id DESC")
    List<AlbumPhotoFavorite> findByUserIdLatest(@Param("userId") Long userId, Pageable pageable);

    @Query("SELECT f FROM AlbumPhotoFavorite f " +
            "JOIN FETCH f.albumPhoto ap " +
            "JOIN FETCH ap.uploader " +
            "JOIN FETCH ap.baby " +
            "WHERE f.user.id = :userId AND f.id < :cursor " +
            "ORDER BY f.id DESC")
    List<AlbumPhotoFavorite> findByUserIdAndCursor(
            @Param("userId") Long userId,
            @Param("cursor") Long cursor,
            Pageable pageable);
}
