package com.yulmudiary.domain.diary.dto;

import com.yulmudiary.domain.diary.entity.Reaction;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ReactionUserResponse {

    private Long userId;
    private String nickname;
    private String profileImageUrl;
    private String emoji;

    public static ReactionUserResponse from(Reaction reaction) {
        return ReactionUserResponse.builder()
                .userId(reaction.getUser().getId())
                .nickname(reaction.getUser().getName())
                .profileImageUrl(reaction.getUser().getProfileImageUrl())
                .emoji(reaction.getEmoji())
                .build();
    }
}
