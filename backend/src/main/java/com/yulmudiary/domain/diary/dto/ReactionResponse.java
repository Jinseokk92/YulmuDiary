package com.yulmudiary.domain.diary.dto;

import com.yulmudiary.domain.diary.entity.Reaction;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class ReactionResponse {

    private Long id;
    private Long userId;
    private String emoji;
    private LocalDateTime createdAt;

    public static ReactionResponse from(Reaction reaction) {
        return ReactionResponse.builder()
                .id(reaction.getId())
                .userId(reaction.getUser().getId())
                .emoji(reaction.getEmoji())
                .createdAt(reaction.getCreatedAt())
                .build();
    }
}
