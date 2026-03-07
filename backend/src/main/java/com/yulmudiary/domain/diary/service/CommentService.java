package com.yulmudiary.domain.diary.service;

import com.yulmudiary.domain.diary.dto.CommentRequest;
import com.yulmudiary.domain.diary.dto.CommentResponse;
import com.yulmudiary.domain.diary.dto.MyCommentPageResponse;
import com.yulmudiary.domain.diary.dto.MyCommentResponse;
import com.yulmudiary.domain.diary.entity.Comment;
import com.yulmudiary.domain.diary.entity.DiaryPost;
import com.yulmudiary.domain.diary.entity.Media;
import com.yulmudiary.domain.diary.repository.CommentRepository;
import com.yulmudiary.domain.diary.repository.DiaryPostRepository;
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

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CommentService {

    private final CommentRepository commentRepository;
    private final DiaryPostRepository diaryPostRepository;
    private final UserRepository userRepository;
    private final MediaUrlResolver mediaUrlResolver;

    @Transactional
    public CommentResponse create(Long diaryPostId, Long authorId, CommentRequest request) {
        DiaryPost post = diaryPostRepository.findById(diaryPostId)
                .orElseThrow(() -> new EntityNotFoundException("일기를 찾을 수 없습니다. id=" + diaryPostId));
        User author = userRepository.findById(authorId)
                .orElseThrow(() -> new EntityNotFoundException("사용자를 찾을 수 없습니다. id=" + authorId));

        Comment comment = Comment.builder()
                .diaryPost(post)
                .author(author)
                .content(request.content())
                .build();

        commentRepository.save(comment);
        return CommentResponse.from(comment);
    }

    public List<CommentResponse> getByPostId(Long postId) {
        return commentRepository.findByDiaryPostIdWithAuthor(postId).stream()
                .map(CommentResponse::from)
                .toList();
    }

    // ── 내 댓글 (작성자 기반 커서 페이징) ─────────────────────────

    public MyCommentPageResponse getByAuthor(Long authorId, Long cursor, int size) {
        List<Comment> comments;
        if (cursor == null) {
            comments = commentRepository.findByAuthorIdLatest(authorId, PageRequest.of(0, size + 1));
        } else {
            comments = commentRepository.findByAuthorIdAndCursor(authorId, cursor, PageRequest.of(0, size + 1));
        }

        boolean hasNext = comments.size() > size;
        List<Comment> content = hasNext ? comments.subList(0, size) : comments;

        List<MyCommentResponse> items = content.stream()
                .map(c -> {
                    DiaryPost post = c.getDiaryPost();
                    String rawThumbnail = post.getMediaList().stream()
                            .min(Comparator.comparingInt(Media::getDisplayOrder))
                            .map(m -> m.getThumbnailUrl() != null ? m.getThumbnailUrl() : m.getUrl())
                            .orElse(null);
                    String postText = post.getContent();
                    String snippet = postText != null && postText.length() > 80
                            ? postText.substring(0, 80)
                            : postText;
                    return MyCommentResponse.builder()
                            .id(c.getId())
                            .content(c.getContent())
                            .createdAt(c.getCreatedAt())
                            .postId(post.getId())
                            .postContent(snippet)
                            .postThumbnailUrl(mediaUrlResolver.resolve(rawThumbnail))
                            .build();
                })
                .toList();

        Long nextCursor = hasNext ? content.get(content.size() - 1).getId() : null;
        return MyCommentPageResponse.builder()
                .items(items)
                .nextCursor(nextCursor)
                .hasNext(hasNext)
                .build();
    }

    @Transactional
    public void delete(Long commentId, Long authorId) {
        if (!commentRepository.existsById(commentId)) {
            throw new EntityNotFoundException("댓글을 찾을 수 없습니다. id=" + commentId);
        }
        int deleted = commentRepository.deleteByIdAndAuthorId(commentId, authorId);
        if (deleted == 0) {
            throw new IllegalArgumentException("작성자만 삭제할 수 있습니다.");
        }
    }
}
