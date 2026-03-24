package com.yulmudiary.domain.bestphoto.entity;

import com.yulmudiary.global.entity.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "best_photo_round")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class BestPhotoRound extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private RoundStatus status;

    @Column
    private LocalDateTime startedAt;

    @Column
    private LocalDateTime votingStartedAt;

    @Column
    private LocalDateTime endedAt;

    @Column
    private Long winnerAlbumPhotoId;

    @Column
    private Integer winnerVoteCount;

    @Builder
    public BestPhotoRound(RoundStatus status, LocalDateTime startedAt) {
        this.status = status;
        this.startedAt = startedAt;
    }

    public void startVoting(LocalDateTime now) {
        this.status = RoundStatus.VOTING;
        this.votingStartedAt = now;
    }

    public void endVoting(LocalDateTime now, Long winnerAlbumPhotoId, int voteCount) {
        this.status = RoundStatus.RESULT;
        this.endedAt = now;
        this.winnerAlbumPhotoId = winnerAlbumPhotoId;
        this.winnerVoteCount = voteCount;
    }
}
