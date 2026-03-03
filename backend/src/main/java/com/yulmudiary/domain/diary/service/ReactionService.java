package com.yulmudiary.domain.diary.service;

import com.yulmudiary.domain.diary.dto.ReactionRequest;
import com.yulmudiary.domain.diary.dto.ReactionResponse;
import com.yulmudiary.domain.diary.entity.DiaryPost;
import com.yulmudiary.domain.diary.entity.Reaction;
import com.yulmudiary.domain.diary.repository.DiaryPostRepository;
import com.yulmudiary.domain.diary.repository.ReactionRepository;
import com.yulmudiary.domain.user.entity.User;
import com.yulmudiary.domain.user.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ReactionService {

    private final ReactionRepository reactionRepository;
    private final DiaryPostRepository diaryPostRepository;
    private final UserRepository userRepository;

    @Transactional
    public ReactionResponse toggle(Long diaryPostId, Long userId, ReactionRequest request) {
        Optional<Reaction> existing = reactionRepository
                .findByDiaryPostIdAndUserIdAndEmoji(diaryPostId, userId, request.emoji());

        if (existing.isPresent()) {
            reactionRepository.delete(existing.get());
            return null;
        }

        DiaryPost post = diaryPostRepository.findById(diaryPostId)
                .orElseThrow(() -> new EntityNotFoundException("일기를 찾을 수 없습니다. id=" + diaryPostId));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("사용자를 찾을 수 없습니다. id=" + userId));

        Reaction reaction = Reaction.builder()
                .diaryPost(post)
                .user(user)
                .emoji(request.emoji())
                .build();

        reactionRepository.save(reaction);
        return ReactionResponse.from(reaction);
    }
}
