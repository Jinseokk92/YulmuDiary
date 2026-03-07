package com.yulmudiary.domain.diary.service;

import com.yulmudiary.domain.baby.entity.Baby;
import com.yulmudiary.domain.baby.repository.BabyRepository;
import com.yulmudiary.domain.diary.dto.DiaryPostPageResponse;
import com.yulmudiary.domain.diary.dto.DiaryPostPaginatedResponse;
import com.yulmudiary.domain.diary.dto.DiaryPostRequest;
import com.yulmudiary.domain.diary.dto.DiaryPostResponse;
import com.yulmudiary.domain.diary.entity.DiaryPost;
import com.yulmudiary.domain.diary.entity.Media;
import com.yulmudiary.domain.diary.entity.MediaType;
import com.yulmudiary.domain.diary.repository.DiaryPostRepository;
import com.yulmudiary.domain.media.service.MediaUrlResolver;
import com.yulmudiary.domain.user.entity.User;
import com.yulmudiary.domain.user.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DiaryPostService {

    private final DiaryPostRepository diaryPostRepository;
    private final UserRepository userRepository;
    private final BabyRepository babyRepository;
    private final MediaUrlResolver mediaUrlResolver;


    @Transactional
    public DiaryPostResponse create(Long authorId, DiaryPostRequest request) {
        User author = userRepository.findById(authorId)
                .orElseThrow(() -> new EntityNotFoundException("사용자를 찾을 수 없습니다. id=" + authorId));
        Baby baby = babyRepository.findById(request.getBabyId())
                .orElseThrow(() -> new EntityNotFoundException("아기를 찾을 수 없습니다. id=" + request.getBabyId()));

        DiaryPost post = DiaryPost.builder()
                .baby(baby)
                .author(author)
                .content(request.getContent())
                .milestoneTag(request.getMilestoneTag())
                .build();

        addMedia(post, request.getMediaUrls(), request.getMediaThumbnailUrls());

        diaryPostRepository.save(post);
        return DiaryPostResponse.from(post, mediaUrlResolver);
    }

    public DiaryPostResponse getById(Long id) {
        DiaryPost post = diaryPostRepository.findByIdWithMedia(id)
                .orElseThrow(() -> new EntityNotFoundException("일기를 찾을 수 없습니다. id=" + id));
        return DiaryPostResponse.from(post, mediaUrlResolver);
    }

    // ── 커서 기반 (기존 유지) ─────────────────────────────────────────

    public DiaryPostPageResponse getByBaby(Long babyId, Long cursor, int size) {
        List<DiaryPost> posts;
        if (cursor == null) {
            posts = diaryPostRepository.findByBabyIdLatest(babyId, PageRequest.of(0, size + 1));
        } else {
            posts = diaryPostRepository.findByBabyIdAndCursor(babyId, cursor, PageRequest.of(0, size + 1));
        }

        boolean hasNext = posts.size() > size;
        List<DiaryPost> content = hasNext ? posts.subList(0, size) : posts;

        List<DiaryPostResponse> items = content.stream()
                .map(p -> DiaryPostResponse.from(p, mediaUrlResolver))
                .toList();

        Long nextCursor = hasNext ? content.get(content.size() - 1).getId() : null;

        return DiaryPostPageResponse.builder()
                .items(items)
                .nextCursor(nextCursor)
                .hasNext(hasNext)
                .build();
    }

    // ── 페이지 번호 기반 ─────────────────────────────────────────────

    public DiaryPostPaginatedResponse getByBabyPaged(Long babyId, int page, int size) {
        long total = diaryPostRepository.countByBabyId(babyId);
        List<DiaryPost> posts = diaryPostRepository.findByBabyIdLatest(
                babyId, PageRequest.of(page, size));

        List<DiaryPostResponse> content = posts.stream()
                .map(p -> DiaryPostResponse.from(p, mediaUrlResolver))
                .toList();

        int totalPages = total == 0 ? 1 : (int) Math.ceil((double) total / size);

        return DiaryPostPaginatedResponse.builder()
                .content(content)
                .totalElements(total)
                .totalPages(totalPages)
                .currentPage(page + 1)
                .build();
    }

    @Transactional
    public DiaryPostResponse update(Long id, Long authorId, DiaryPostRequest request) {
        DiaryPost post = diaryPostRepository.findByIdWithMedia(id)
                .orElseThrow(() -> new EntityNotFoundException("일기를 찾을 수 없습니다. id=" + id));

        validateAuthor(post, authorId);

        post.update(request.getContent(), request.getMilestoneTag());
        post.clearMedia();
        addMedia(post, request.getMediaUrls(), request.getMediaThumbnailUrls());

        return DiaryPostResponse.from(post, mediaUrlResolver);
    }

    @Transactional
    public void delete(Long id, Long authorId) {
        DiaryPost post = diaryPostRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("일기를 찾을 수 없습니다. id=" + id));

        validateAuthor(post, authorId);

        diaryPostRepository.delete(post);
    }

    private void validateAuthor(DiaryPost post, Long authorId) {
        if (!post.getAuthor().getId().equals(authorId)) {
            throw new IllegalArgumentException("작성자만 수정/삭제할 수 있습니다.");
        }
    }

    private void addMedia(DiaryPost post, List<String> mediaUrls, List<String> mediaThumbnailUrls) {
        if (mediaUrls == null || mediaUrls.isEmpty()) {
            return;
        }
        for (int i = 0; i < mediaUrls.size(); i++) {
            String url = mediaUrls.get(i);
            if (url == null || url.trim().isEmpty()) {
                continue;
            }

            String thumbnailUrl = (mediaThumbnailUrls != null && i < mediaThumbnailUrls.size())
                    ? mediaThumbnailUrls.get(i)
                    : null;

            Media media = Media.builder()
                    .diaryPost(post)
                    .url(url)
                    .thumbnailUrl(thumbnailUrl)
                    .type(MediaType.PHOTO)
                    .displayOrder(i)
                    .build();
            post.addMedia(media);
        }
    }
}
