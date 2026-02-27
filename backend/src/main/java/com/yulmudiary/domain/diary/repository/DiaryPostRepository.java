package com.yulmudiary.domain.diary.repository;

import com.yulmudiary.domain.diary.entity.DiaryPost;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface DiaryPostRepository extends JpaRepository<DiaryPost, Long> {

    @Query("SELECT dp FROM DiaryPost dp JOIN FETCH dp.author JOIN FETCH dp.baby " +
            "WHERE dp.baby.id = :babyId AND dp.id < :cursor ORDER BY dp.id DESC")
    List<DiaryPost> findByBabyIdAndCursor(@Param("babyId") Long babyId,
                                          @Param("cursor") Long cursor,
                                          Pageable pageable);

    @Query("SELECT dp FROM DiaryPost dp JOIN FETCH dp.author JOIN FETCH dp.baby " +
            "WHERE dp.baby.id = :babyId ORDER BY dp.id DESC")
    List<DiaryPost> findByBabyIdLatest(@Param("babyId") Long babyId, Pageable pageable);

    @Query("SELECT dp FROM DiaryPost dp JOIN FETCH dp.author LEFT JOIN FETCH dp.mediaList WHERE dp.id = :id")
    Optional<DiaryPost> findByIdWithMedia(@Param("id") Long id);
}
