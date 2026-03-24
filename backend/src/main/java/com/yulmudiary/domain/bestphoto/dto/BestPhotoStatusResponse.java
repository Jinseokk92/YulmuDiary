package com.yulmudiary.domain.bestphoto.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class BestPhotoStatusResponse {

    private String status;
    private Long roundId;
    private int myNominationCount;
    private int totalNominations;
    private boolean hasVoted;
    private Long votedNominationId;
    private List<NominationResponse> myNominations;
    private List<NominationResponse> nominations;
    private ResultDto result;

    @Getter
    @Builder
    public static class ResultDto {
        private Long winnerAlbumPhotoId;
        private String winnerAlbumPhotoUrl;
        private String winnerAlbumPhotoThumbnailUrl;
        private int winnerVoteCount;
        private List<NominationResponse> topNominations;
    }
}
