package com.yulmudiary.domain.user.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class UserStatsResponse {

    private long postCount;
    private long photoCount;
    private long reactionCount;
}
