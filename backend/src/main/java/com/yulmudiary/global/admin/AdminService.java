package com.yulmudiary.global.admin;

import com.yulmudiary.domain.baby.entity.Baby;
import com.yulmudiary.domain.baby.repository.BabyRepository;
import com.yulmudiary.domain.family.entity.FamilyGroup;
import com.yulmudiary.domain.family.entity.FamilyMembership;
import com.yulmudiary.domain.family.repository.FamilyGroupRepository;
import com.yulmudiary.domain.family.repository.FamilyMembershipRepository;
import com.yulmudiary.global.admin.dto.*;
import com.yulmudiary.global.exception.ForbiddenException;
import com.yulmudiary.global.exception.NotFoundException;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminService {

    private static final long BABY_ID = 1L;

    private final FamilyGroupRepository familyGroupRepository;
    private final FamilyMembershipRepository familyMembershipRepository;
    private final BabyRepository babyRepository;

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
        return AppSettingsResponse.from(baby);
    }

    // ── private helpers ─────────────────────────────────────────────────

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
