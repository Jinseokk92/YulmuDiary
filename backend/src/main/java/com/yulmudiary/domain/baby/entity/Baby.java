package com.yulmudiary.domain.baby.entity;

import com.yulmudiary.domain.family.entity.FamilyGroup;
import com.yulmudiary.global.entity.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "baby")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Baby extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 30)
    private String name;

    /** 출산 예정일. (필드명은 birthDate지만 의미는 예정일이며 기존 사용처와 호환을 위해 유지) */
    @Column(nullable = false)
    private LocalDate birthDate;

    /**
     * 실제 출생 일시. 출산 전에는 null이다.
     * 생후 일수 계산은 시각을 제외한 날짜 차이로 하므로, 시각은 표시 용도로만 사용한다.
     */
    private LocalDateTime bornAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private Gender gender;

    private String profileImageUrl;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "family_group_id", nullable = false)
    private FamilyGroup familyGroup;

    /** 아기 이름·출생(예정)일 변경 */
    public void updateInfo(String name, LocalDate birthDate) {
        this.name = name;
        this.birthDate = birthDate;
    }

    /** 실제 출생 일시 등록·수정 */
    public void updateBornAt(LocalDateTime bornAt) {
        this.bornAt = bornAt;
    }

    /** 대표 사진 URL 변경 */
    public void updateProfileImageUrl(String profileImageUrl) {
        this.profileImageUrl = profileImageUrl;
    }

    @Builder
    public Baby(String name, LocalDate birthDate, Gender gender, String profileImageUrl,
                FamilyGroup familyGroup) {
        this.name = name;
        this.birthDate = birthDate;
        this.gender = gender;
        this.profileImageUrl = profileImageUrl;
        this.familyGroup = familyGroup;
    }
}
