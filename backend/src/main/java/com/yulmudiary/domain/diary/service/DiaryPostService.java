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
import com.yulmudiary.domain.diary.dto.DiaryPostSortType;
import com.yulmudiary.domain.diary.repository.DiaryPostRepository;
import com.yulmudiary.domain.diary.repository.DiaryPostSpec;
import com.yulmudiary.domain.media.service.ImageStorageService;
import com.yulmudiary.domain.media.service.MediaUrlResolver;
import com.yulmudiary.domain.user.entity.User;
import com.yulmudiary.domain.user.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DiaryPostService {

    private final DiaryPostRepository diaryPostRepository;
    private final UserRepository userRepository;
    private final BabyRepository babyRepository;
    private final MediaUrlResolver mediaUrlResolver;
    private final ImageStorageService imageStorageService;


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

    public DiaryPostResponse getById(Long id, Long currentUserId) {
        DiaryPost post = diaryPostRepository.findByIdWithMedia(id)
                .orElseThrow(() -> new EntityNotFoundException("일기를 찾을 수 없습니다. id=" + id));
        return DiaryPostResponse.from(post, mediaUrlResolver, currentUserId);
    }

    // ── 커서 기반 (기존 유지) ─────────────────────────────────────────

    public DiaryPostPageResponse getByBaby(Long babyId, Long cursor, int size, Long currentUserId) {
        List<DiaryPost> posts;
        if (cursor == null) {
            posts = diaryPostRepository.findByBabyIdLatest(babyId, PageRequest.of(0, size + 1));
        } else {
            posts = diaryPostRepository.findByBabyIdAndCursor(babyId, cursor, PageRequest.of(0, size + 1));
        }

        boolean hasNext = posts.size() > size;
        List<DiaryPost> content = hasNext ? posts.subList(0, size) : posts;

        List<DiaryPostResponse> items = content.stream()
                .map(p -> DiaryPostResponse.from(p, mediaUrlResolver, currentUserId))
                .toList();

        Long nextCursor = hasNext ? content.get(content.size() - 1).getId() : null;

        return DiaryPostPageResponse.builder()
                .items(items)
                .nextCursor(nextCursor)
                .hasNext(hasNext)
                .build();
    }

    // ── 내 게시글 (작성자 기반 커서 페이징) ─────────────────────────

    public DiaryPostPageResponse getByAuthor(Long authorId, Long cursor, int size) {
        List<DiaryPost> posts;
        if (cursor == null) {
            posts = diaryPostRepository.findByAuthorIdLatest(authorId, PageRequest.of(0, size + 1));
        } else {
            posts = diaryPostRepository.findByAuthorIdAndCursor(authorId, cursor, PageRequest.of(0, size + 1));
        }

        boolean hasNext = posts.size() > size;
        List<DiaryPost> content = hasNext ? posts.subList(0, size) : posts;

        List<DiaryPostResponse> items = content.stream()
                .map(p -> DiaryPostResponse.from(p, mediaUrlResolver, authorId))
                .toList();

        Long nextCursor = hasNext ? content.get(content.size() - 1).getId() : null;

        return DiaryPostPageResponse.builder()
                .items(items)
                .nextCursor(nextCursor)
                .hasNext(hasNext)
                .build();
    }

    // ── 페이지 번호 기반 ─────────────────────────────────────────────

    public DiaryPostPaginatedResponse getByBabyPaged(
            Long babyId, int page, int size,
            DiaryPostSortType sort, LocalDate startDate, LocalDate endDate, Long userId, String keyword, Long currentUserId) {

        Specification<DiaryPost> spec = Specification.where(DiaryPostSpec.forBaby(babyId));
        if (userId != null) spec = spec.and(DiaryPostSpec.forAuthor(userId));
        if (startDate != null) spec = spec.and(DiaryPostSpec.fromDate(startDate));
        if (endDate != null) spec = spec.and(DiaryPostSpec.toDate(endDate));
        if (keyword != null && !keyword.isBlank()) spec = spec.and(DiaryPostSpec.containsKeyword(keyword));

        Sort sortOrder = (sort == DiaryPostSortType.OLDEST)
                ? Sort.by(Sort.Direction.ASC, "createdAt")
                : Sort.by(Sort.Direction.DESC, "createdAt");

        Page<DiaryPost> postPage = diaryPostRepository.findAll(spec, PageRequest.of(page, size, sortOrder));

        List<DiaryPostResponse> content = postPage.getContent().stream()
                .map(p -> DiaryPostResponse.from(p, mediaUrlResolver, currentUserId))
                .toList();

        int totalPages = postPage.getTotalPages() == 0 ? 1 : postPage.getTotalPages();

        return DiaryPostPaginatedResponse.builder()
                .content(content)
                .totalElements(postPage.getTotalElements())
                .totalPages(totalPages)
                .currentPage(page + 1)
                .build();
    }

    @Transactional
    public DiaryPostResponse update(Long id, Long authorId, DiaryPostRequest request) {
        DiaryPost post = diaryPostRepository.findByIdWithMedia(id)
                .orElseThrow(() -> new EntityNotFoundException("일기를 찾을 수 없습니다. id=" + id));

        validateAuthor(post, authorId);

        // 새 요청에 포함되지 않은 기존 미디어 URL → 저장소에서 삭제
        List<String> newUrls = request.getMediaUrls() != null ? request.getMediaUrls() : List.of();
        List<String> urlsToDelete = post.getMediaList().stream()
                .map(Media::getUrl)
                .filter(url -> !newUrls.contains(url))
                .toList();

        post.update(request.getContent(), request.getMilestoneTag());
        post.clearMedia();
        addMedia(post, request.getMediaUrls(), request.getMediaThumbnailUrls());

        // DB 트랜잭션과 무관하게 저장소 파일 삭제 (실패해도 수정은 유지)
        urlsToDelete.forEach(url -> {
            try {
                imageStorageService.deleteByUrl(url);
            } catch (Exception e) {
                log.warn("미디어 파일 삭제 실패: {}", url, e);
            }
        });

        return DiaryPostResponse.from(post, mediaUrlResolver);
    }

    @Transactional
    public void delete(Long id, Long requesterId) {
        DiaryPost post = diaryPostRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("일기를 찾을 수 없습니다. id=" + id));

        User requester = userRepository.findById(requesterId)
                .orElseThrow(() -> new EntityNotFoundException("사용자를 찾을 수 없습니다. id=" + requesterId));

        if (!requester.isAdmin()) {
            validateAuthor(post, requesterId);
        }

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
