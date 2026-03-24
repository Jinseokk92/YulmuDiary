package com.yulmudiary.domain.bestphoto.entity;

import com.yulmudiary.global.entity.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "photo_vote")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class PhotoVote extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "round_id", nullable = false)
    private BestPhotoRound round;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "nomination_id", nullable = false)
    private PhotoNomination nomination;

    @Column(nullable = false)
    private Long voterUserId;

    @Builder
    public PhotoVote(BestPhotoRound round, PhotoNomination nomination, Long voterUserId) {
        this.round = round;
        this.nomination = nomination;
        this.voterUserId = voterUserId;
    }
}
