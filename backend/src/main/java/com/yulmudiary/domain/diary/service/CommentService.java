package com.yulmudiary.domain.diary.service;

import com.yulmudiary.domain.diary.dto.CommentRequest;
import com.yulmudiary.domain.diary.dto.CommentResponse;
import com.yulmudiary.domain.diary.entity.Comment;
import com.yulmudiary.domain.diary.entity.DiaryPost;
import com.yulmudiary.domain.diary.repository.CommentRepository;
import com.yulmudiary.domain.diary.repository.DiaryPostRepository;
import com.yulmudiary.domain.user.entity.User;
import com.yulmudiary.domain.user.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CommentService {

    private final CommentRepository commentRepository;
    private final DiaryPostRepository diaryPostRepository;
    private final UserRepository userRepository;

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
