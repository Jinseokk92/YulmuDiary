package com.yulmudiary.domain.milestone.service;

import com.yulmudiary.domain.family.entity.FamilyGroup;
import com.yulmudiary.domain.family.entity.FamilyMembership;
import com.yulmudiary.domain.family.repository.FamilyMembershipRepository;
import com.yulmudiary.domain.media.dto.ImagePaths;
import com.yulmudiary.domain.media.service.ImageStorageService;
import com.yulmudiary.domain.media.service.MediaUrlResolver;
import com.yulmudiary.domain.milestone.dto.MilestoneAchieveRequest;
import com.yulmudiary.domain.milestone.dto.MilestoneResponse;
import com.yulmudiary.domain.milestone.entity.Milestone;
import com.yulmudiary.domain.milestone.entity.MilestonePhoto;
import com.yulmudiary.domain.milestone.repository.MilestoneRepository;
import com.yulmudiary.global.exception.ForbiddenException;
import com.yulmudiary.global.exception.NotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MilestoneService {

    private static final int MAX_PHOTOS = 10;

    private final MilestoneRepository milestoneRepository;
    private final FamilyMembershipRepository membershipRepository;
    private final ImageStorageService imageStorageService;
    private final MediaUrlResolver mediaUrlResolver;

    private record MilestoneTemplate(String key, String title, String description,
                                     String expectedMonth, int order) {}

    private static final List<MilestoneTemplate> DEFAULT_MILESTONES = List.of(
            new MilestoneTemplate("BORN", "세상에 태어난 날", "우리 가족이 된 첫 순간", "0개월", 1),
            new MilestoneTemplate("FIRST_HOME", "처음 집에 온 날", "드디어 우리 집에 온 날", "0개월", 2),
            new MilestoneTemplate("SOCIAL_SMILE", "사회적 미소", "엄마, 아빠를 보며 방긋 웃는 순간", "2개월", 3),
            new MilestoneTemplate("BABBLING", "옹알이", "처음 소리를 내기 시작한 날", "3개월", 4),
            new MilestoneTemplate("HEAD_CONTROL", "목 가누기", "안았을 때 머리를 안정적으로 드는 순간", "4개월", 5),
            new MilestoneTemplate("ROLLING", "뒤집기", "스스로 뒤집은 감동의 순간", "5~6개월", 6),
            new MilestoneTemplate("SITTING", "혼자 앉기", "혼자 앉아 있는 모습에 감동한 날", "6~7개월", 7),
            new MilestoneTemplate("COMMANDO_CRAWL", "배밀이", "세상을 향해 움직이기 시작한 날", "7~9개월", 8),
            new MilestoneTemplate("CRAWLING", "기어다니기", "활동 반경이 넓어진 순간", "7~9개월", 9),
            new MilestoneTemplate("PULLING_UP", "붙잡고 서기", "걸음마 직전 두 다리로 선 날", "9~11개월", 10),
            new MilestoneTemplate("FIRST_TOOTH", "첫니", "작은 이가 반짝 나타난 변화의 순간", "10~12개월", 11),
            new MilestoneTemplate("CLAPPING", "짝짜꿍/빠이빠이", "가족 모두가 환호한 순간", "10~12개월", 12),
            new MilestoneTemplate("FIRST_STEPS", "첫 걸음마", "두세 걸음이라도 떼면 대형 이벤트", "12개월", 13),
            new MilestoneTemplate("FIRST_WORD", "첫말", "엄마, 아빠 같은 첫 의미 있는 말", "12개월", 14)
    );

    @Transactional
    public List<MilestoneResponse> getOrInitialize(Long userId) {
        FamilyGroup familyGroup = getFamilyGroup(userId);

        if (!milestoneRepository.existsByFamilyGroupId(familyGroup.getId())) {
            initializeDefaults(familyGroup);
        }

        return milestoneRepository.findByFamilyGroupIdOrderByDisplayOrderWithPhotos(familyGroup.getId())
                .stream()
                .map(milestone -> MilestoneResponse.from(milestone, mediaUrlResolver))
                .toList();
    }

    @Transactional
    public MilestoneResponse achieve(Long id, Long userId, MilestoneAchieveRequest request) {
        Milestone milestone = getAndValidate(id, userId);

        List<String> keepImageUrls = request.getNormalizedKeepImageUrls();
        List<MultipartFile> newPhotos = request.getNormalizedNewPhotos();

        Map<String, MilestonePhoto> existingPhotoByUrl = milestone.getPhotos().stream()
                .collect(Collectors.toMap(
                        MilestonePhoto::getUrl,
                        Function.identity(),
                        (left, right) -> left,
                        LinkedHashMap::new
                ));

        validateKeepImageUrls(existingPhotoByUrl, keepImageUrls);
        validateFinalPhotoCount(keepImageUrls.size() + newPhotos.size());

        List<MilestonePhoto> removedPhotos = existingPhotoByUrl.values().stream()
                .filter(photo -> !keepImageUrls.contains(photo.getUrl()))
                .toList();
        List<ImagePaths> uploadedImages = uploadPhotos(newPhotos);
        registerRollbackCleanup(uploadedImages);

        List<String> finalUrls = new ArrayList<>();
        List<String> finalThumbnailUrls = new ArrayList<>();

        for (String keepImageUrl : keepImageUrls) {
            MilestonePhoto existingPhoto = existingPhotoByUrl.get(keepImageUrl);
            finalUrls.add(existingPhoto.getUrl());
            finalThumbnailUrls.add(existingPhoto.getThumbnailUrl());
        }

        for (ImagePaths uploadedImage : uploadedImages) {
            finalUrls.add(uploadedImage.imageUrl());
            finalThumbnailUrls.add(uploadedImage.thumbnailUrl());
        }

        milestone.clearPhotos();
        milestone.achieve(request.getAchievedDate(), request.getNormalizedMemo());
        addPhotos(milestone, finalUrls, finalThumbnailUrls);
        scheduleStorageDeletionAfterCommit(removedPhotos);

        return MilestoneResponse.from(milestone, mediaUrlResolver);
    }

    @Transactional
    public void cancelAchieve(Long id, Long userId) {
        Milestone milestone = getAndValidate(id, userId);
        List<MilestonePhoto> removedPhotos = List.copyOf(milestone.getPhotos());

        milestone.cancelAchieve();
        scheduleStorageDeletionAfterCommit(removedPhotos);
    }

    private FamilyGroup getFamilyGroup(Long userId) {
        return membershipRepository.findByUserIdWithFamilyGroup(userId)
                .map(FamilyMembership::getFamilyGroup)
                .orElseThrow(() -> new ForbiddenException("가족 그룹에 속해 있지 않은 사용자입니다."));
    }

    private Milestone getAndValidate(Long id, Long userId) {
        FamilyGroup familyGroup = getFamilyGroup(userId);

        Milestone milestone = milestoneRepository.findByIdWithPhotos(id)
                .orElseThrow(() -> new NotFoundException("이정표를 찾을 수 없습니다. id=" + id));

        if (!milestone.getFamilyGroup().getId().equals(familyGroup.getId())) {
            throw new ForbiddenException("접근 권한이 없는 이정표입니다.");
        }

        return milestone;
    }

    private void initializeDefaults(FamilyGroup familyGroup) {
        List<Milestone> milestones = DEFAULT_MILESTONES.stream()
                .map(t -> Milestone.builder()
                        .familyGroup(familyGroup)
                        .milestoneKey(t.key())
                        .title(t.title())
                        .description(t.description())
                        .expectedMonth(t.expectedMonth())
                        .displayOrder(t.order())
                        .build())
                .toList();
        milestoneRepository.saveAll(milestones);
    }

    private void validateKeepImageUrls(Map<String, MilestonePhoto> existingPhotoByUrl, List<String> keepImageUrls) {
        for (String keepImageUrl : keepImageUrls) {
            if (!existingPhotoByUrl.containsKey(keepImageUrl)) {
                throw new IllegalArgumentException("유지할 사진 정보가 올바르지 않습니다.");
            }
        }
    }

    private void validateFinalPhotoCount(int photoCount) {
        if (photoCount < 1) {
            throw new IllegalArgumentException("사진은 최소 1장 이상 등록해야 합니다.");
        }
        if (photoCount > MAX_PHOTOS) {
            throw new IllegalArgumentException("사진은 최대 10장까지 등록할 수 있습니다.");
        }
    }

    private List<ImagePaths> uploadPhotos(List<MultipartFile> newPhotos) {
        List<ImagePaths> uploadedImages = new ArrayList<>();

        try {
            for (MultipartFile newPhoto : newPhotos) {
                uploadedImages.add(imageStorageService.store(newPhoto));
            }
            return uploadedImages;
        } catch (RuntimeException e) {
            deleteImagePaths(uploadedImages);
            throw e;
        }
    }

    private void registerRollbackCleanup(List<ImagePaths> uploadedImages) {
        if (uploadedImages.isEmpty() || !TransactionSynchronizationManager.isSynchronizationActive()) {
            return;
        }

        List<ImagePaths> rollbackTargets = List.copyOf(uploadedImages);
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCompletion(int status) {
                if (status != STATUS_COMMITTED) {
                    deleteImagePaths(rollbackTargets);
                }
            }
        });
    }

    private void scheduleStorageDeletionAfterCommit(List<MilestonePhoto> removedPhotos) {
        if (removedPhotos.isEmpty()) {
            return;
        }

        List<MilestonePhoto> deletionTargets = List.copyOf(removedPhotos);
        if (!TransactionSynchronizationManager.isSynchronizationActive()) {
            deletePhotosFromStorage(deletionTargets);
            return;
        }

        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                deletePhotosFromStorage(deletionTargets);
            }
        });
    }

    private void deletePhotosFromStorage(List<MilestonePhoto> photos) {
        for (MilestonePhoto photo : photos) {
            deleteStorageUrls(List.of(photo.getUrl(), photo.getThumbnailUrl()));
        }
    }

    private void deleteImagePaths(List<ImagePaths> imagePaths) {
        for (ImagePaths imagePath : imagePaths) {
            deleteStorageUrls(List.of(imagePath.imageUrl(), imagePath.thumbnailUrl()));
        }
    }

    private void deleteStorageUrls(List<String> urls) {
        Set<String> uniqueUrls = urls.stream()
                .filter(url -> url != null && !url.isBlank())
                .collect(Collectors.toCollection(LinkedHashSet::new));

        for (String url : uniqueUrls) {
            try {
                imageStorageService.deleteByUrl(url);
            } catch (Exception e) {
                log.warn("이정표 이미지 삭제 실패: {}", url, e);
            }
        }
    }

    private void addPhotos(Milestone milestone, List<String> photoUrls, List<String> photoThumbnailUrls) {
        if (photoUrls == null || photoUrls.isEmpty()) {
            return;
        }

        for (int i = 0; i < photoUrls.size(); i++) {
            String url = photoUrls.get(i);
            if (url == null || url.trim().isEmpty()) {
                continue;
            }

            String thumbnailUrl = (photoThumbnailUrls != null && i < photoThumbnailUrls.size())
                    ? photoThumbnailUrls.get(i)
                    : null;

            milestone.addPhoto(MilestonePhoto.builder()
                    .milestone(milestone)
                    .url(url)
                    .thumbnailUrl(thumbnailUrl)
                    .displayOrder(i)
                    .build());
        }
    }
}
