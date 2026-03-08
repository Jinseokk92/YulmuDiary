package com.yulmudiary.domain.album.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class AlbumPhotoPageResponse {

    private List<AlbumPhotoResponse> items;
    private Long nextCursor;
    private boolean hasNext;
}
