package com.yulmudiary.domain.diary.repository;

import com.yulmudiary.domain.diary.entity.Reaction;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ReactionRepository extends JpaRepository<Reaction, Long> {

    Optional<Reaction> findByDiaryPostIdAndUserIdAndEmoji(Long diaryPostId, Long userId, String emoji);

    void deleteByDiaryPostIdAndUserIdAndEmoji(Long diaryPostId, Long userId, String emoji);
}
