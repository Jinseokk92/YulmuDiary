package com.yulmudiary.domain.album.service;

import com.yulmudiary.domain.album.dto.AlbumPhotoPageResponse;
import com.yulmudiary.domain.album.dto.AlbumPhotoFavoriteResponse;
import com.yulmudiary.domain.album.dto.AlbumPhotoRequest;
import com.yulmudiary.domain.album.dto.AlbumPhotoResponse;
import com.yulmudiary.domain.album.entity.AlbumPhoto;
import com.yulmudiary.domain.album.entity.AlbumPhotoFavorite;
import com.yulmudiary.domain.album.entity.GrowthPhaseType;
import com.yulmudiary.domain.album.repository.AlbumPhotoFavoriteRepository;
import com.yulmudiary.domain.album.repository.AlbumPhotoRepository;
import com.yulmudiary.domain.baby.entity.Baby;
import com.yulmudiary.domain.baby.repository.BabyRepository;
import com.yulmudiary.domain.media.service.MediaUrlResolver;
import com.yulmudiary.domain.user.entity.User;
import com.yulmudiary.domain.user.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AlbumPhotoService {

    private final AlbumPhotoRepository albumPhotoRepository;
    private final AlbumPhotoFavoriteRepository albumPhotoFavoriteRepository;
    private final UserRepository userRepository;
    private final BabyRepository babyRepository;
    private final MediaUrlResolver mediaUrlResolver;

    @Transactional
    public AlbumPhotoResponse save(Long uploaderId, AlbumPhotoRequest request) {
        User uploader = userRepository.findById(uploaderId)
                .orElseThrow(() -> new EntityNotFoundException("User not found. id=" + uploaderId));
        Baby baby = babyRepository.findById(request.getBabyId())
                .orElseThrow(() -> new EntityNotFoundException("Baby not found. id=" + request.getBabyId()));

        AlbumPhoto photo = AlbumPhoto.builder()
                .baby(baby)
                .uploader(uploader)
                .url(request.getUrl())
                .thumbnailUrl(request.getThumbnailUrl())
                .growthPhaseType(request.getGrowthPhaseType())
                .growthIndex(request.getGrowthIndex())
                .caption(request.getCaption())
                .takenAt(request.getTakenAt())
                .build();

        albumPhotoRepository.save(photo);
        return AlbumPhotoResponse.from(photo, mediaUrlResolver);
    }

    public AlbumPhotoResponse getById(Long id) {
        AlbumPhoto photo = albumPhotoRepository.findByIdWithUploader(id)
                .orElseThrow(() -> new EntityNotFoundException("Album photo not found. id=" + id));
        return AlbumPhotoResponse.from(photo, mediaUrlResolver);
    }

    public AlbumPhotoFavoriteResponse getFavoriteStatus(Long albumPhotoId, Long userId) {
        boolean favorited = albumPhotoFavoriteRepository.existsByAlbumPhotoIdAndUserId(albumPhotoId, userId);
        return new AlbumPhotoFavoriteResponse(favorited);
    }

    public AlbumPhotoPageResponse getFavoriteListByUser(Long userId, Long cursor, int size) {
        PageRequest pageable = PageRequest.of(0, size + 1);
        List<AlbumPhotoFavorite> favorites;

        if (cursor == null) {
            favorites = albumPhotoFavoriteRepository.findByUserIdLatest(userId, pageable);
        } else {
            favorites = albumPhotoFavoriteRepository.findByUserIdAndCursor(userId, cursor, pageable);
        }

        boolean hasNext = favorites.size() > size;
        List<AlbumPhotoFavorite> content = hasNext ? favorites.subList(0, size) : favorites;

        List<AlbumPhotoResponse> items = content.stream()
                .map(f -> AlbumPhotoResponse.from(f.getAlbumPhoto(), mediaUrlResolver))
                .toList();

        Long nextCursor = hasNext ? content.get(content.size() - 1).getId() : null;

        return AlbumPhotoPageResponse.builder()
                .items(items)
                .nextCursor(nextCursor)
                .hasNext(hasNext)
                .build();
    }

    @Transactional
    public AlbumPhotoFavoriteResponse toggleFavorite(Long albumPhotoId, Long userId) {
        return albumPhotoFavoriteRepository.findByAlbumPhotoIdAndUserId(albumPhotoId, userId)
                .map(existing -> {
                    albumPhotoFavoriteRepository.delete(existing);
                    return new AlbumPhotoFavoriteResponse(false);
                })
                .orElseGet(() -> {
                    AlbumPhoto photo = albumPhotoRepository.findById(albumPhotoId)
                            .orElseThrow(() -> new EntityNotFoundException("Album photo not found. id=" + albumPhotoId));
                    User user = userRepository.findById(userId)
                            .orElseThrow(() -> new EntityNotFoundException("User not found. id=" + userId));

                    AlbumPhotoFavorite favorite = AlbumPhotoFavorite.builder()
                            .albumPhoto(photo)
                            .user(user)
                            .build();
                    albumPhotoFavoriteRepository.save(favorite);

                    return new AlbumPhotoFavoriteResponse(true);
                });
    }

    @Transactional
    public void delete(Long id) {
        AlbumPhoto photo = albumPhotoRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Album photo not found. id=" + id));
        albumPhotoFavoriteRepository.deleteByAlbumPhotoId(id);
        albumPhotoRepository.delete(photo);
    }

    public AlbumPhotoPageResponse getList(Long babyId, Long cursor, int size,
                                          GrowthPhaseType phase,
                                          Integer growthIndex,
                                          Integer fromIndex, Integer toIndex) {
        PageRequest pageable = PageRequest.of(0, size + 1);
        List<AlbumPhoto> photos;

        if (phase != null && growthIndex != null) {
            photos = (cursor == null)
                    ? albumPhotoRepository.findByBabyIdAndPhaseAndIndexLatest(babyId, phase, growthIndex, pageable)
                    : albumPhotoRepository.findByBabyIdAndPhaseAndIndexAndCursor(babyId, cursor, phase, growthIndex, pageable);

        } else if (phase != null && fromIndex != null && toIndex != null) {
            photos = (cursor == null)
                    ? albumPhotoRepository.findByBabyIdAndPhaseAndRangeLatest(babyId, phase, fromIndex, toIndex, pageable)
                    : albumPhotoRepository.findByBabyIdAndPhaseAndRangeAndCursor(babyId, cursor, phase, fromIndex, toIndex, pageable);

        } else if (phase != null) {
            photos = (cursor == null)
                    ? albumPhotoRepository.findByBabyIdAndPhaseLatest(babyId, phase, pageable)
                    : albumPhotoRepository.findByBabyIdAndPhaseAndCursor(babyId, cursor, phase, pageable);

        } else {
            photos = (cursor == null)
                    ? albumPhotoRepository.findByBabyIdLatest(babyId, pageable)
                    : albumPhotoRepository.findByBabyIdAndCursor(babyId, cursor, pageable);
        }

        boolean hasNext = photos.size() > size;
        List<AlbumPhoto> content = hasNext ? photos.subList(0, size) : photos;

        List<AlbumPhotoResponse> items = content.stream()
                .map(p -> AlbumPhotoResponse.from(p, mediaUrlResolver))
                .toList();

        Long nextCursor = hasNext ? content.get(content.size() - 1).getId() : null;

        return AlbumPhotoPageResponse.builder()
                .items(items)
                .nextCursor(nextCursor)
                .hasNext(hasNext)
                .build();
    }
}
