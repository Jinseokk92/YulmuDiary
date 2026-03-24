package com.yulmudiary.domain.diary.repository;

import com.yulmudiary.domain.diary.entity.DiaryPost;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDate;

public class DiaryPostSpec {

    public static Specification<DiaryPost> forBaby(Long babyId) {
        return (root, query, cb) -> cb.equal(root.get("baby").get("id"), babyId);
    }

    public static Specification<DiaryPost> forAuthor(Long userId) {
        return (root, query, cb) -> cb.equal(root.get("author").get("id"), userId);
    }

    public static Specification<DiaryPost> fromDate(LocalDate startDate) {
        return (root, query, cb) ->
                cb.greaterThanOrEqualTo(root.get("createdAt"), startDate.atStartOfDay());
    }

    public static Specification<DiaryPost> toDate(LocalDate endDate) {
        return (root, query, cb) ->
                cb.lessThan(root.get("createdAt"), endDate.plusDays(1).atStartOfDay());
    }

    public static Specification<DiaryPost> containsKeyword(String keyword) {
        return (root, query, cb) -> {
            String pattern = "%" + keyword.toLowerCase() + "%";
            return cb.or(
                    cb.like(cb.lower(root.get("content")), pattern),
                    cb.like(cb.lower(root.get("milestoneTag")), pattern),
                    cb.like(cb.lower(root.get("author").get("name")), pattern)
            );
        };
    }
}
