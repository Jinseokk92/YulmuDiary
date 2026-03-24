package com.yulmudiary.domain.bestphoto.entity;

import com.yulmudiary.global.entity.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "photo_nomination")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class PhotoNomination extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "round_id", nullable = false)
    private BestPhotoRound round;

    @Column(nullable = false)
    private Long albumPhotoId;

    @Column(nullable = false)
    private Long nominatorUserId;

    @Builder
    public PhotoNomination(BestPhotoRound round, Long albumPhotoId, Long nominatorUserId) {
        this.round = round;
        this.albumPhotoId = albumPhotoId;
        this.nominatorUserId = nominatorUserId;
    }
}
