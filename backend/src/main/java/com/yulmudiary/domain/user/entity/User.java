package com.yulmudiary.domain.user.entity;

import com.yulmudiary.global.entity.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "users", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"provider", "provider_id"})
})
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class User extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false, length = 30)
    private String name;

    @Column(nullable = false, length = 20)
    private String provider;

    @Column(nullable = false)
    private String providerId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private Role role;

    private String profileImageUrl;

    @Column(length = 100)
    private String bio;

    @Column(nullable = false, columnDefinition = "boolean default false")
    private boolean isAdmin = false;

    @Column(nullable = false, columnDefinition = "boolean default true")
    private boolean commentNotificationEnabled = true;

    @Column(nullable = false, columnDefinition = "boolean default true")
    private boolean reactionNotificationEnabled = true;

    @Builder
    public User(String email, String name, String provider, String providerId,
                Role role, String profileImageUrl) {
        this.email = email;
        this.name = name;
        this.provider = provider;
        this.providerId = providerId;
        this.role = role != null ? role : Role.USER;
        this.profileImageUrl = profileImageUrl;
        this.commentNotificationEnabled = true;
        this.reactionNotificationEnabled = true;
    }

    /** OAuth 로그인 시 소셜 프로필 동기화 (기존 흐름 유지) */
    public void updateProfile(String name, String profileImageUrl) {
        this.name = name;
        this.profileImageUrl = profileImageUrl;
    }

    /** 사용자가 직접 닉네임·한 줄 소개 수정 */
    public void updateNameAndBio(String name, String bio) {
        this.name = name;
        this.bio = bio;
    }

    /** 사용자가 직접 프로필 사진 변경 */
    public void updateProfileImageUrl(String profileImageUrl) {
        this.profileImageUrl = profileImageUrl;
    }

    /** 알림 설정 변경 */
    public void updateNotificationSettings(boolean commentNotificationEnabled,
                                           boolean reactionNotificationEnabled) {
        this.commentNotificationEnabled = commentNotificationEnabled;
        this.reactionNotificationEnabled = reactionNotificationEnabled;
    }
}
