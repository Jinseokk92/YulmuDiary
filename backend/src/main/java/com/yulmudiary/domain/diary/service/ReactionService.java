package com.yulmudiary.domain.diary.service;

import com.yulmudiary.domain.diary.dto.MyReactionPageResponse;
import com.yulmudiary.domain.diary.dto.MyReactionResponse;
import com.yulmudiary.domain.diary.dto.ReactionRequest;
import com.yulmudiary.domain.diary.dto.ReactionResponse;
import com.yulmudiary.domain.diary.entity.DiaryPost;
import com.yulmudiary.domain.diary.entity.Media;
import com.yulmudiary.domain.diary.entity.Reaction;
import com.yulmudiary.domain.diary.repository.DiaryPostRepository;
import com.yulmudiary.domain.diary.repository.ReactionRepository;
import com.yulmudiary.domain.media.service.MediaUrlResolver;
import com.yulmudiary.domain.user.entity.User;
import com.yulmudiary.domain.user.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ReactionService {

    private final ReactionRepository reactionRepository;
    private final DiaryPostRepository diaryPostRepository;
    private final UserRepository userRepository;
    private final MediaUrlResolver mediaUrlResolver;

    // ── 내 반응 (사용자 기반 커서 페이징) ─────────────────────────

    public MyReactionPageResponse getByUser(Long userId, Long cursor, int size) {
        List<Reaction> reactions;
        if (cursor == null) {
            reactions = reactionRepository.findByUserIdLatest(userId, PageRequest.of(0, size + 1));
        } else {
            reactions = reactionRepository.findByUserIdAndCursor(userId, cursor, PageRequest.of(0, size + 1));
        }

        boolean hasNext = reactions.size() > size;
        List<Reaction> content = hasNext ? reactions.subList(0, size) : reactions;

        List<MyReactionResponse> items = content.stream()
                .map(r -> {
                    DiaryPost post = r.getDiaryPost();
                    String rawThumbnail = post.getMediaList().stream()
                            .min(Comparator.comparingInt(Media::getDisplayOrder))
                            .map(m -> m.getThumbnailUrl() != null ? m.getThumbnailUrl() : m.getUrl())
                            .orElse(null);
                    String postText = post.getContent();
                    String snippet = postText != null && postText.length() > 80
                            ? postText.substring(0, 80)
                            : postText;
                    return MyReactionResponse.builder()
                            .id(r.getId())
                            .emoji(r.getEmoji())
                            .createdAt(r.getCreatedAt())
                            .postId(post.getId())
                            .postContent(snippet)
                            .postThumbnailUrl(mediaUrlResolver.resolve(rawThumbnail))
                            .build();
                })
                .toList();

        Long nextCursor = hasNext ? content.get(content.size() - 1).getId() : null;
        return MyReactionPageResponse.builder()
                .items(items)
                .nextCursor(nextCursor)
                .hasNext(hasNext)
                .build();
    }

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
