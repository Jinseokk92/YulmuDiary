package com.yulmudiary.domain.milestone.dto;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
public class MilestoneAchieveRequest {

    private static final int MAX_PHOTOS = 10;

    @NotNull(message = "달성 날짜는 필수입니다.")
    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    private LocalDate achievedDate;

    @Size(max = 200, message = "메모는 200자 이하여야 합니다.")
    private String memo;

    private List<String> keepImageUrls = new ArrayList<>();

    private List<MultipartFile> newPhotos = new ArrayList<>();

    private List<MultipartFile> photos = new ArrayList<>();

    public List<String> getNormalizedKeepImageUrls() {
        if (keepImageUrls == null) {
            return List.of();
        }

        return keepImageUrls.stream()
                .filter(url -> url != null && !url.isBlank())
                .distinct()
                .toList();
    }

    public List<MultipartFile> getNormalizedNewPhotos() {
        List<MultipartFile> merged = new ArrayList<>();
        if (newPhotos != null) {
            merged.addAll(newPhotos);
        }
        if (photos != null) {
            merged.addAll(photos);
        }

        return merged.stream()
                .filter(file -> file != null && !file.isEmpty())
                .toList();
    }

    public String getNormalizedMemo() {
        if (memo == null) {
            return null;
        }

        String trimmed = memo.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    @AssertTrue(message = "사진은 최소 1장 이상 등록해야 합니다.")
    public boolean isPhotoCountAtLeastOne() {
        return getRequestedPhotoCount() >= 1;
    }

    @AssertTrue(message = "사진은 최대 10장까지 등록할 수 있습니다.")
    public boolean isPhotoCountAtMostTen() {
        return getRequestedPhotoCount() <= MAX_PHOTOS;
    }

    private int getRequestedPhotoCount() {
        return getNormalizedKeepImageUrls().size() + getNormalizedNewPhotos().size();
    }
}
