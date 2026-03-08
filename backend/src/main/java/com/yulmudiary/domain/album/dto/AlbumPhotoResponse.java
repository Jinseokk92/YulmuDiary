package com.yulmudiary.domain.album.dto;

import com.yulmudiary.domain.album.entity.AlbumPhoto;
import com.yulmudiary.domain.album.entity.GrowthPhaseType;
import com.yulmudiary.domain.media.service.MediaUrlResolver;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Builder
public class AlbumPhotoResponse {

    private Long id;
    private Long babyId;
    private Long uploaderId;
    private String uploaderNickname;
    private String uploaderProfileImageUrl;
    private String url;
    private String thumbnailUrl;
    private GrowthPhaseType growthPhaseType;
    private Integer growthIndex;
    private String caption;
    private LocalDate takenAt;
    private LocalDateTime createdAt;

    public static AlbumPhotoResponse from(AlbumPhoto photo, MediaUrlResolver resolver) {
        return AlbumPhotoResponse.builder()
                .id(photo.getId())
                .babyId(photo.getBaby().getId())
                .uploaderId(photo.getUploader().getId())
                .uploaderNickname(photo.getUploader().getName())
                .uploaderProfileImageUrl(photo.getUploader().getProfileImageUrl())
                .url(resolver.resolve(photo.getUrl()))
                .thumbnailUrl(resolver.resolve(photo.getThumbnailUrl()))
                .growthPhaseType(photo.getGrowthPhaseType())
                .growthIndex(photo.getGrowthIndex())
                .caption(photo.getCaption())
                .takenAt(photo.getTakenAt())
                .createdAt(photo.getCreatedAt())
                .build();
    }
}
