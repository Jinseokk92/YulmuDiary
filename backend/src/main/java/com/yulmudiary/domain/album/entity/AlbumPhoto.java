package com.yulmudiary.domain.album.entity;

import com.yulmudiary.domain.baby.entity.Baby;
import com.yulmudiary.domain.user.entity.User;
import com.yulmudiary.global.entity.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Entity
@Table(name = "album_photo", indexes = {
        @Index(name = "idx_album_photo_baby_id", columnList = "baby_id"),
        @Index(name = "idx_album_photo_baby_phase_index", columnList = "baby_id, growth_phase_type, growth_index")
})
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class AlbumPhoto extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "baby_id", nullable = false)
    private Baby baby;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "uploader_id", nullable = false)
    private User uploader;

    @Column(nullable = false)
    private String url;

    @Column
    private String thumbnailUrl;

    @Enumerated(EnumType.STRING)
    @Column(name = "growth_phase_type", nullable = false, length = 20)
    private GrowthPhaseType growthPhaseType;

    // PREGNANCY: 1~41 (주차), BABY: 0~72 (개월)
    @Column(name = "growth_index", nullable = false)
    private Integer growthIndex;

    @Column(length = 100)
    private String caption;

    // 실제 촬영 날짜 (null이면 업로드 날짜로 간주)
    @Column
    private LocalDate takenAt;

    @Builder
    public AlbumPhoto(Baby baby, User uploader, String url, String thumbnailUrl,
                      GrowthPhaseType growthPhaseType, Integer growthIndex,
                      String caption, LocalDate takenAt) {
        this.baby = baby;
        this.uploader = uploader;
        this.url = url;
        this.thumbnailUrl = thumbnailUrl;
        this.growthPhaseType = growthPhaseType;
        this.growthIndex = growthIndex;
        this.caption = caption;
        this.takenAt = takenAt;
    }
}
