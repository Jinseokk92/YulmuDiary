package com.yulmudiary.domain.diary.entity;

import com.yulmudiary.domain.baby.entity.Baby;
import com.yulmudiary.domain.user.entity.User;
import com.yulmudiary.global.entity.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "diary_post")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class DiaryPost extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "baby_id", nullable = false)
    private Baby baby;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id", nullable = false)
    private User author;

    @Column(columnDefinition = "TEXT")
    private String content;

    @Column(length = 50)
    private String milestoneTag;

    @Column(name = "is_pinned", nullable = false, columnDefinition = "boolean default false")
    private boolean pinned = false;

    @Column(name = "pinned_at")
    private LocalDateTime pinnedAt;

    @OneToMany(mappedBy = "diaryPost", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Media> mediaList = new ArrayList<>();

    @OneToMany(mappedBy = "diaryPost", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Comment> comments = new ArrayList<>();

    @OneToMany(mappedBy = "diaryPost", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Reaction> reactions = new ArrayList<>();

    @Builder
    public DiaryPost(Baby baby, User author, String content, String milestoneTag) {
        this.baby = baby;
        this.author = author;
        this.content = content;
        this.milestoneTag = milestoneTag;
    }

    public void update(String content, String milestoneTag) {
        this.content = content;
        this.milestoneTag = milestoneTag;
    }

    public void addMedia(Media media) {
        this.mediaList.add(media);
    }

    public void clearMedia() {
        this.mediaList.clear();
    }

    public void pin() {
        this.pinned = true;
        this.pinnedAt = LocalDateTime.now();
    }

    public void unpin() {
        this.pinned = false;
        this.pinnedAt = null;
    }
}
