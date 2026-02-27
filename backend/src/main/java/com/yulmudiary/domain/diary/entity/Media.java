package com.yulmudiary.domain.diary.entity;

import com.yulmudiary.global.entity.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "media")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Media extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "diary_post_id", nullable = false)
    private DiaryPost diaryPost;

    @Column(nullable = false)
    private String url;

    @Column
    private String thumbnailUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private MediaType type;

    @Column(nullable = false)
    private Integer displayOrder;

    @Builder
    public Media(DiaryPost diaryPost, String url, String thumbnailUrl, MediaType type, Integer displayOrder) {
        this.diaryPost = diaryPost;
        this.url = url;
        this.thumbnailUrl = thumbnailUrl;
        this.type = type;
        this.displayOrder = displayOrder;
    }
}
