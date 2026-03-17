package com.yulmudiary.domain.milestone.entity;

import com.yulmudiary.domain.family.entity.FamilyGroup;
import com.yulmudiary.global.entity.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "milestone")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Milestone extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "family_group_id", nullable = false)
    private FamilyGroup familyGroup;

    @Column(nullable = false, length = 50)
    private String milestoneKey;

    @Column(nullable = false, length = 100)
    private String title;

    @Column(length = 200)
    private String description;

    @Column(length = 20)
    private String expectedMonth;

    @OneToMany(mappedBy = "milestone", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("displayOrder ASC")
    private List<MilestonePhoto> photos = new ArrayList<>();

    @Column
    private LocalDate achievedDate;

    @Column(length = 200)
    private String memo;

    @Column(nullable = false)
    private int displayOrder;

    @Builder
    public Milestone(FamilyGroup familyGroup, String milestoneKey, String title,
                     String description, String expectedMonth, int displayOrder) {
        this.familyGroup = familyGroup;
        this.milestoneKey = milestoneKey;
        this.title = title;
        this.description = description;
        this.expectedMonth = expectedMonth;
        this.displayOrder = displayOrder;
    }

    public void achieve(LocalDate achievedDate, String memo) {
        this.achievedDate = achievedDate;
        this.memo = memo;
    }

    public void cancelAchieve() {
        this.achievedDate = null;
        this.memo = null;
        this.photos.clear();
    }

    public void addPhoto(MilestonePhoto photo) {
        this.photos.add(photo);
    }

    public void clearPhotos() {
        this.photos.clear();
    }
}
