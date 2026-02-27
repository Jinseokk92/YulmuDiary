package com.yulmudiary.domain.family.entity;

import com.yulmudiary.domain.user.entity.User;
import com.yulmudiary.global.entity.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "family_membership",
        uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "family_group_id"}))
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class FamilyMembership extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "family_group_id", nullable = false)
    private FamilyGroup familyGroup;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private FamilyRole role;

    @Builder
    public FamilyMembership(User user, FamilyGroup familyGroup, FamilyRole role) {
        this.user = user;
        this.familyGroup = familyGroup;
        this.role = role;
    }
}
