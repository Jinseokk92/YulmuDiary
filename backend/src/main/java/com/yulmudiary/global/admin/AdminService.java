package com.yulmudiary.global.admin;

import com.yulmudiary.domain.baby.entity.Baby;
import com.yulmudiary.domain.baby.repository.BabyRepository;
import com.yulmudiary.domain.family.entity.FamilyGroup;
import com.yulmudiary.domain.family.entity.FamilyMembership;
import com.yulmudiary.domain.family.repository.FamilyGroupRepository;
import com.yulmudiary.domain.family.repository.FamilyMembershipRepository;
import com.yulmudiary.domain.media.dto.ImagePaths;
import com.yulmudiary.domain.media.service.ImageStorageService;
import com.yulmudiary.global.admin.dto.*;
import com.yulmudiary.global.exception.ForbiddenException;
import com.yulmudiary.global.exception.NotFoundException;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminService {

    private static final long BABY_ID = 1L;

    /** 대표 사진 검증 정책 — UserService.updateProfileImage와 동일하게 유지한다. */
    private static final long MAX_BABY_PHOTO_SIZE = 5 * 1024 * 1024L; // 5MB
    private static final String ALLOWED_CONTENT_TYPE_PREFIX = "image/";

    private final FamilyGroupRepository familyGroupRepository;
    private final FamilyMembershipRepository familyMembershipRepository;
    private final BabyRepository babyRepository;
    private final ImageStorageService imageStorageService;

    // ── A. 초대 코드 관리 ──────────────────────────────────────────────

    public InviteCodesResponse getInviteCodes(Long adminUserId) {
        FamilyGroup group = getAdminFamilyGroup(adminUserId);
        return InviteCodesResponse.from(group);
    }

    @Transactional
    public InviteCodeRegenerateResponse regenerateInviteCode(Long adminUserId, String role) {
        FamilyGroup group = getAdminFamilyGroup(adminUserId);
        String newCode;

        if ("PARENT".equals(role)) {
            newCode = generateUniqueParentCode();
            group.regenerateParentInviteCode(newCode);
        } else {
            // RELATIVE
            newCode = generateUniqueRelativeCode();
            group.regenerateInviteCode(newCode);
        }

        log.info("초대 코드 재발급 (Admin): adminId={}, role={}, newCode={}", adminUserId, role, newCode);
        return new InviteCodeRegenerateResponse(role, newCode);
    }

    // ── B. 멤버 관리 ────────────────────────────────────────────────────

    public List<AdminMemberResponse> getMembers(Long adminUserId) {
        FamilyGroup group = getAdminFamilyGroup(adminUserId);
        return familyMembershipRepository.findAllByFamilyGroupIdWithUser(group.getId())
                .stream()
                .map(AdminMemberResponse::from)
                .toList();
    }

    @Transactional
    public void removeMember(Long adminUserId, Long targetUserId) {
        if (adminUserId.equals(targetUserId)) {
            throw new IllegalArgumentException("자기 자신을 퇴출할 수 없습니다.");
        }

        FamilyGroup adminGroup = getAdminFamilyGroup(adminUserId);

        FamilyMembership target = familyMembershipRepository.findByUserIdWithFamilyGroup(targetUserId)
                .orElseThrow(() -> new NotFoundException("해당 사용자가 가족 그룹에 속하지 않습니다. userId=" + targetUserId));

        if (!target.getFamilyGroup().getId().equals(adminGroup.getId())) {
            throw new ForbiddenException("같은 가족 그룹 내 멤버만 퇴출할 수 있습니다.");
        }

        familyMembershipRepository.delete(target);
        log.info("멤버 강제 퇴출 (Admin): adminId={}, targetUserId={}", adminUserId, targetUserId);
    }

    // ── D. 앱 설정 관리 ─────────────────────────────────────────────────

    public AppSettingsResponse getAppSettings() {
        Baby baby = babyRepository.findById(BABY_ID)
                .orElseThrow(() -> new EntityNotFoundException("아기 정보를 찾을 수 없습니다. id=" + BABY_ID));
        return AppSettingsResponse.from(baby);
    }

    @Transactional
    public AppSettingsResponse updateAppSettings(AppSettingsUpdateRequest request) {
        Baby baby = babyRepository.findById(BABY_ID)
                .orElseThrow(() -> new EntityNotFoundException("아기 정보를 찾을 수 없습니다. id=" + BABY_ID));
        baby.updateInfo(request.babyName(), request.dueDate());

        boolean clearBornAt = Boolean.TRUE.equals(request.clearBornAt());
        if (clearBornAt && request.bornAt() != null) {
            throw new IllegalArgumentException("clearBornAt과 bornAt을 동시에 전달할 수 없습니다.");
        }

        if (clearBornAt) {
            baby.updateBornAt(null);
            log.info("출생 일시 초기화 (Admin): babyId={}", BABY_ID);
        } else if (request.bornAt() != null) {
            // bornAt은 부분 수정 필드다. null이면 "변경 없음"으로 보고 기존 값을 유지한다.
            // (bornAt을 보내지 않는 기존 클라이언트가 저장할 때 등록된 출생일시를 지우는 것을 방지)
            baby.updateBornAt(request.bornAt());
            log.info("출생 일시 변경 (Admin): babyId={}, bornAt={}", BABY_ID, request.bornAt());
        }

        return AppSettingsResponse.from(baby);
    }

    // ── E. 아기 대표 사진 ────────────────────────────────────────────────

    /**
     * 아기 대표 사진을 교체한다.
     *
     * <p>처리 순서를 다음과 같이 두어 기존 사진이 유실되지 않게 한다.
     * <ol>
     *   <li>검증 → 새 파일 업로드 (실패 시 트랜잭션 롤백, 기존 URL 그대로)</li>
     *   <li>DB의 profileImageUrl 갱신</li>
     *   <li><b>커밋 성공 이후</b>에만 기존 파일 삭제 (afterCommit 콜백)</li>
     * </ol>
     */
    @Transactional
    public AppSettingsResponse updateBabyPhoto(MultipartFile file) {
        validateImageFile(file);

        Baby baby = babyRepository.findById(BABY_ID)
                .orElseThrow(() -> new EntityNotFoundException("아기 정보를 찾을 수 없습니다. id=" + BABY_ID));

        String previousUrl = baby.getProfileImageUrl();

        ImagePaths paths = imageStorageService.store(file);
        baby.updateProfileImageUrl(paths.imageUrl());

        registerPreviousPhotoCleanup(previousUrl, paths.imageUrl());

        log.info("아기 대표 사진 변경 (Admin): babyId={}, url={}", BABY_ID, paths.imageUrl());
        return AppSettingsResponse.from(baby);
    }

    /**
     * 아기 대표 사진을 초기화(삭제)한다. profileImageUrl만 null로 바꾸고
     * 이름·출산예정일·출생일시는 건드리지 않는다.
     *
     * <p>updateBabyPhoto와 동일하게, DB 갱신을 먼저 커밋하고 <b>커밋 성공 이후</b>에만
     * 기존 GCS 파일을 삭제한다. 커밋 전에 실패하면 DB의 URL도, 실제 파일도 그대로 남는다.
     */
    @Transactional
    public AppSettingsResponse resetBabyPhoto() {
        Baby baby = babyRepository.findById(BABY_ID)
                .orElseThrow(() -> new EntityNotFoundException("아기 정보를 찾을 수 없습니다. id=" + BABY_ID));

        String previousUrl = baby.getProfileImageUrl();
        baby.updateProfileImageUrl(null);

        registerPreviousPhotoCleanup(previousUrl, null);

        log.info("아기 대표 사진 초기화 (Admin): babyId={}", BABY_ID);
        return AppSettingsResponse.from(baby);
    }

    /** 커밋이 확정된 뒤에만 이전 사진 파일을 삭제하도록 예약한다. */
    private void registerPreviousPhotoCleanup(String previousUrl, String newUrl) {
        if (previousUrl == null || previousUrl.isBlank() || previousUrl.equals(newUrl)) {
            return;
        }
        if (!TransactionSynchronizationManager.isSynchronizationActive()) {
            // 트랜잭션 밖에서 호출된 경우(이론상 발생하지 않음)에는 정리를 건너뛴다.
            // 파일이 남는 것이 URL을 잃는 것보다 안전하다.
            return;
        }
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                // deleteByUrl은 실패해도 예외를 던지지 않는다.
                imageStorageService.deleteByUrl(previousUrl);
            }
        });
    }

    // ── private helpers ─────────────────────────────────────────────────

    /** UserService.updateProfileImage와 동일한 이미지 검증 정책. */
    private void validateImageFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("파일이 비어 있습니다.");
        }
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith(ALLOWED_CONTENT_TYPE_PREFIX)) {
            throw new IllegalArgumentException("이미지 파일만 업로드할 수 있습니다. (jpg, png, webp 등)");
        }
        if (file.getSize() > MAX_BABY_PHOTO_SIZE) {
            throw new IllegalArgumentException("파일 크기는 5MB 이하여야 합니다.");
        }
    }

    private FamilyGroup getAdminFamilyGroup(Long adminUserId) {
        return familyMembershipRepository.findByUserIdWithFamilyGroup(adminUserId)
                .map(FamilyMembership::getFamilyGroup)
                .orElseThrow(() -> new NotFoundException("소속된 가족 그룹이 없습니다."));
    }

    private String generateUniqueRelativeCode() {
        for (int attempt = 0; attempt < 5; attempt++) {
            String code = FamilyGroup.generateCode();
            if (!familyGroupRepository.existsByInviteCode(code)) {
                return code;
            }
        }
        throw new IllegalStateException("초대 코드 생성에 실패했습니다. 다시 시도해 주세요.");
    }

    private String generateUniqueParentCode() {
        for (int attempt = 0; attempt < 5; attempt++) {
            String code = FamilyGroup.generateCode();
            if (!familyGroupRepository.existsByParentInviteCode(code)
                    && !familyGroupRepository.existsByInviteCode(code)) {
                return code;
            }
        }
        throw new IllegalStateException("초대 코드 생성에 실패했습니다. 다시 시도해 주세요.");
    }
}
