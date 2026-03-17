package com.yulmudiary.domain.milestone.dto;

import com.yulmudiary.domain.media.service.MediaUrlResolver;
import com.yulmudiary.domain.milestone.entity.Milestone;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.util.List;

@Getter
@Builder
public class MilestoneResponse {

    private Long id;
    private String milestoneKey;
    private String title;
    private String description;
    private String expectedMonth;
    private List<String> photoUrls;
    private LocalDate achievedDate;
    private String memo;
    private int displayOrder;
    private boolean achieved;

    public static MilestoneResponse from(Milestone milestone, MediaUrlResolver resolver) {
        List<String> photoUrls = milestone.getPhotos().stream()
                .map(photo -> resolver.resolve(photo.getUrl()))
                .toList();

        return MilestoneResponse.builder()
                .id(milestone.getId())
                .milestoneKey(milestone.getMilestoneKey())
                .title(milestone.getTitle())
                .description(milestone.getDescription())
                .expectedMonth(milestone.getExpectedMonth())
                .photoUrls(photoUrls)
                .achievedDate(milestone.getAchievedDate())
                .memo(milestone.getMemo())
                .displayOrder(milestone.getDisplayOrder())
                .achieved(milestone.getAchievedDate() != null)
                .build();
    }
}
