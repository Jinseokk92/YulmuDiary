package com.yulmudiary.domain.bestphoto.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class NominationResponse {

    private Long id;
    private Long albumPhotoId;
    private String albumPhotoUrl;
    private String albumPhotoThumbnailUrl;
    private Long nominatorUserId;
    private String nominatorName;
    private int voteCount;
    private boolean myNomination;
}
