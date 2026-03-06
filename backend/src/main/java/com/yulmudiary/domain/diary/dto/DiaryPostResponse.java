package com.yulmudiary.domain.diary.dto;

import com.yulmudiary.domain.diary.entity.DiaryPost;
import com.yulmudiary.domain.diary.entity.Media;
import com.yulmudiary.domain.media.service.MediaUrlResolver;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Builder
public class DiaryPostResponse {

    private Long id;
    private Long babyId;
    private Long authorId;
    private String authorNickname;
    private String authorProfileImageUrl;
    private String content;
    private String milestoneTag;
    private List<MediaDto> media;
    private int commentCount;
    private List<ReactionResponse> reactions;
    private LocalDateTime createdAt;

    @Getter
    @Builder
    public static class MediaDto {
        private Long id;
        private String url;
        private String thumbnailUrl;
        private String type;
        private Integer displayOrder;

        public static MediaDto from(Media media, MediaUrlResolver resolver) {
            return MediaDto.builder()
                    .id(media.getId())
                    .url(resolver.resolve(media.getUrl()))
                    .thumbnailUrl(resolver.resolve(media.getThumbnailUrl()))
                    .type(media.getType().name())
                    .displayOrder(media.getDisplayOrder())
                    .build();
        }
    }

    public static DiaryPostResponse from(DiaryPost post, MediaUrlResolver resolver) {
        return DiaryPostResponse.builder()
                .id(post.getId())
                .babyId(post.getBaby().getId())
                .authorId(post.getAuthor().getId())
                .authorNickname(post.getAuthor().getName())
                .authorProfileImageUrl(post.getAuthor().getProfileImageUrl())
                .content(post.getContent())
                .milestoneTag(post.getMilestoneTag())
                .media(post.getMediaList().stream()
                        .map(m -> MediaDto.from(m, resolver))
                        .toList())
                .commentCount(post.getComments().size())
                .reactions(post.getReactions().stream()
                        .map(ReactionResponse::from)
                        .toList())
                .createdAt(post.getCreatedAt())
                .build();
    }
}
