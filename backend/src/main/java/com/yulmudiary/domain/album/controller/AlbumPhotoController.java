package com.yulmudiary.domain.album.controller;

import com.yulmudiary.domain.album.dto.AlbumPhotoPageResponse;
import com.yulmudiary.domain.album.dto.AlbumPhotoFavoriteResponse;
import com.yulmudiary.domain.album.dto.AlbumPhotoRequest;
import com.yulmudiary.domain.album.dto.AlbumPhotoResponse;
import com.yulmudiary.domain.album.entity.GrowthPhaseType;
import com.yulmudiary.domain.album.service.AlbumPhotoService;
import com.yulmudiary.domain.family.entity.FamilyRole;
import com.yulmudiary.global.auth.AuthTarget;
import com.yulmudiary.global.auth.CheckFamilyAuth;
import com.yulmudiary.global.auth.annotation.RequireRole;
import com.yulmudiary.global.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

/**
 * Album authorization policy
 * - Read/list/favorite: all family members
 * - Create/delete photo: parent only
 */
@Tag(name = "Album", description = "Album API")
@RestController
@RequestMapping("/api/album-photos")
@RequiredArgsConstructor
public class AlbumPhotoController {

    private final AlbumPhotoService albumPhotoService;

    @Operation(summary = "Create album photo (parent only)")
    @CheckFamilyAuth(AuthTarget.BABY_ID)
    @RequireRole(FamilyRole.PARENT)
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<AlbumPhotoResponse> save(
            Authentication authentication,
            @Valid @RequestBody AlbumPhotoRequest request) {
        Long userId = (Long) authentication.getPrincipal();
        return ApiResponse.success(albumPhotoService.save(userId, request));
    }

    @Operation(summary = "Get album photo by id")
    @CheckFamilyAuth(AuthTarget.ALBUM_PHOTO_ID)
    @GetMapping("/{id}")
    public ApiResponse<AlbumPhotoResponse> getById(@PathVariable Long id) {
        return ApiResponse.success(albumPhotoService.getById(id));
    }

    @Operation(summary = "Get album photo favorite status for current user")
    @CheckFamilyAuth(AuthTarget.ALBUM_PHOTO_ID)
    @GetMapping("/{id}/favorite")
    public ApiResponse<AlbumPhotoFavoriteResponse> getFavoriteStatus(
            @PathVariable Long id,
            Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();
        return ApiResponse.success(albumPhotoService.getFavoriteStatus(id, userId));
    }

    @Operation(summary = "Toggle album photo favorite for current user")
    @CheckFamilyAuth(AuthTarget.ALBUM_PHOTO_ID)
    @PostMapping("/{id}/favorite")
    public ApiResponse<AlbumPhotoFavoriteResponse> toggleFavorite(
            @PathVariable Long id,
            Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();
        return ApiResponse.success(albumPhotoService.toggleFavorite(id, userId));
    }

    @Operation(summary = "Get my favorite album photos (cursor pagination)")
    @GetMapping("/me/favorites")
    public ApiResponse<AlbumPhotoPageResponse> getMyFavorites(
            Authentication authentication,
            @Parameter(description = "Cursor (last favorite id from previous page)")
            @RequestParam(required = false) Long cursor,
            @Parameter(description = "Page size")
            @RequestParam(defaultValue = "30") int size) {
        Long userId = (Long) authentication.getPrincipal();
        return ApiResponse.success(albumPhotoService.getFavoriteListByUser(userId, cursor, size));
    }

    @Operation(summary = "Get album list (cursor + filters)")
    @CheckFamilyAuth(AuthTarget.BABY_ID)
    @GetMapping
    public ApiResponse<AlbumPhotoPageResponse> getList(
            @Parameter(description = "Baby id", required = true)
            @RequestParam Long babyId,
            @Parameter(description = "Cursor (last id from previous page)")
            @RequestParam(required = false) Long cursor,
            @Parameter(description = "Page size")
            @RequestParam(defaultValue = "20") int size,
            @Parameter(description = "Growth phase filter (PREGNANCY / BABY)")
            @RequestParam(required = false) GrowthPhaseType growthPhaseType,
            @Parameter(description = "Exact growth index")
            @RequestParam(required = false) Integer growthIndex,
            @Parameter(description = "Range filter start")
            @RequestParam(required = false) Integer fromIndex,
            @Parameter(description = "Range filter end")
            @RequestParam(required = false) Integer toIndex) {
        return ApiResponse.success(
                albumPhotoService.getList(babyId, cursor, size,
                        growthPhaseType, growthIndex, fromIndex, toIndex));
    }

    @Operation(summary = "Delete album photo (parent only)")
    @CheckFamilyAuth(AuthTarget.ALBUM_PHOTO_ID)
    @RequireRole(FamilyRole.PARENT)
    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        albumPhotoService.delete(id);
        return ApiResponse.success(null);
    }

    // @Operation(summary = "Update album photo (parent only)")
    // @CheckFamilyAuth(AuthTarget.ALBUM_PHOTO_ID)
    // @RequireRole(FamilyRole.PARENT)
    // @PutMapping("/{id}")
    // public ApiResponse<AlbumPhotoResponse> update(
    //         @PathVariable Long id,
    //         Authentication authentication,
    //         @Valid @RequestBody AlbumPhotoRequest request) {
    //     Long userId = (Long) authentication.getPrincipal();
    //     return ApiResponse.success(albumPhotoService.update(id, userId, request));
    // }
}
