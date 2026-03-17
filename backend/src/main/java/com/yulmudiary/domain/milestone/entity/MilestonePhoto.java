package com.yulmudiary.domain.milestone.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "milestone_photo")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class MilestonePhoto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "milestone_id", nullable = false)
    private Milestone milestone;

    @Column(nullable = false)
    private String url;

    @Column
    private String thumbnailUrl;

    @Column(nullable = false)
    private int displayOrder;

    @Builder
    public MilestonePhoto(Milestone milestone, String url, String thumbnailUrl, int displayOrder) {
        this.milestone = milestone;
        this.url = url;
        this.thumbnailUrl = thumbnailUrl;
        this.displayOrder = displayOrder;
    }
}
