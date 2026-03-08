package com.yulmudiary.domain.album.entity;

import com.yulmudiary.domain.user.entity.User;
import com.yulmudiary.global.entity.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(
        name = "album_photo_favorite",
        uniqueConstraints = @UniqueConstraint(columnNames = {"album_photo_id", "user_id"}),
        indexes = {
                @Index(name = "idx_album_photo_favorite_photo_id", columnList = "album_photo_id"),
                @Index(name = "idx_album_photo_favorite_user_id", columnList = "user_id")
        }
)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class AlbumPhotoFavorite extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "album_photo_id", nullable = false)
    private AlbumPhoto albumPhoto;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Builder
    public AlbumPhotoFavorite(AlbumPhoto albumPhoto, User user) {
        this.albumPhoto = albumPhoto;
        this.user = user;
    }
}
