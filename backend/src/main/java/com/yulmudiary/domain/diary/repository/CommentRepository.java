package com.yulmudiary.domain.diary.repository;

import com.yulmudiary.domain.diary.entity.Comment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface CommentRepository extends JpaRepository<Comment, Long> {

    @Query("SELECT c FROM Comment c JOIN FETCH c.author WHERE c.diaryPost.id = :postId ORDER BY c.createdAt ASC")
    List<Comment> findByDiaryPostIdWithAuthor(@Param("postId") Long postId);

    @Modifying
    @Query("DELETE FROM Comment c WHERE c.id = :commentId AND c.author.id = :authorId")
    int deleteByIdAndAuthorId(@Param("commentId") Long commentId, @Param("authorId") Long authorId);
}
