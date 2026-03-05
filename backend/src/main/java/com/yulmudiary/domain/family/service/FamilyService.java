package com.yulmudiary.domain.family.service;

import com.yulmudiary.domain.family.dto.FamilyCreateRequest;
import com.yulmudiary.domain.family.dto.FamilyGroupResponse;
import com.yulmudiary.domain.family.dto.FamilyMembershipResponse;
import com.yulmudiary.domain.family.entity.FamilyGroup;
import com.yulmudiary.domain.family.entity.FamilyMembership;
import com.yulmudiary.domain.family.entity.FamilyRole;
import com.yulmudiary.domain.family.repository.FamilyGroupRepository;
import com.yulmudiary.domain.family.repository.FamilyMembershipRepository;
import com.yulmudiary.domain.user.entity.User;
import com.yulmudiary.domain.user.repository.UserRepository;
import com.yulmudiary.global.exception.NotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FamilyService {

    private final FamilyGroupRepository familyGroupRepository;
    private final FamilyMembershipRepository familyMembershipRepository;
    private final UserRepository userRepository;

    /**
     * 가족 그룹 생성.
     * - RELATIVE 초대 코드와 PARENT 초대 코드를 각각 6자리로 자동 생성.
     * - UUID 충돌 시 최대 5회 재시도.
     */
    @Transactional
    public FamilyGroupResponse create(Long userId, FamilyCreateRequest request) {
        User creator = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("사용자를 찾을 수 없습니다. id=" + userId));

        // 이미 그룹에 소속되어 있으면 생성 불가
        if (familyMembershipRepository.findByUserId(userId).isPresent()) {
            throw new IllegalArgumentException("이미 가족 그룹에 속해 있습니다.");
        }

        String inviteCode = generateUniqueRelativeCode();
        String parentInviteCode = generateUniqueParentCode();

        FamilyGroup group = FamilyGroup.builder()
                .name(request.name())
                .inviteCode(inviteCode)
                .parentInviteCode(parentInviteCode)
                .build();
        familyGroupRepository.save(group);

        // 생성자는 자동으로 PARENT로 가입
        FamilyMembership membership = FamilyMembership.builder()
                .user(creator)
                .familyGroup(group)
                .role(FamilyRole.PARENT)
                .build();
        familyMembershipRepository.save(membership);

        log.info("가족 그룹 생성: groupId={}, name={}, creatorId={}", group.getId(), group.getName(), userId);
        return FamilyGroupResponse.from(group);
    }

    /**
     * 초대 코드로 가족 그룹 가입 (멱등).
     * - 이미 소속된 경우 → 기존 멤버십 반환 (400 아님)
     * - inviteCode 일치 → RELATIVE 역할로 신규 가입
     * - parentInviteCode 일치 → PARENT 역할로 신규 가입
     */
    @Transactional
    public FamilyMembershipResponse join(Long userId, String rawCode) {
        String code = rawCode.trim().toUpperCase();
        log.info("가족 그룹 가입 시도: userId={}, code={}", userId, code);

        // 이미 소속된 그룹이 있는지 먼저 확인 → 있으면 기존 멤버십 반환 (멱등)
        var existing = familyMembershipRepository.findByUserIdWithFamilyGroup(userId);
        if (existing.isPresent()) {
            log.info("이미 가족 그룹 소속 → 기존 멤버십 반환: userId={}, groupId={}",
                    userId, existing.get().getFamilyGroup().getId());
            return FamilyMembershipResponse.from(existing.get());
        }

        // 코드 판별: RELATIVE 코드 우선 확인, 없으면 PARENT 코드 확인
        FamilyGroup group;
        FamilyRole role;

        var byRelative = familyGroupRepository.findByInviteCode(code);
        if (byRelative.isPresent()) {
            group = byRelative.get();
            role = FamilyRole.RELATIVE;
        } else {
            var byParent = familyGroupRepository.findByParentInviteCode(code);
            if (byParent.isPresent()) {
                group = byParent.get();
                role = FamilyRole.PARENT;
            } else {
                log.warn("유효하지 않은 초대 코드: code={}", code);
                throw new IllegalArgumentException("유효하지 않은 초대 코드입니다.");
            }
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("사용자를 찾을 수 없습니다. id=" + userId));

        FamilyMembership membership = FamilyMembership.builder()
                .user(user)
                .familyGroup(group)
                .role(role)
                .build();
        familyMembershipRepository.save(membership);

        log.info("가족 그룹 가입 완료: userId={}, groupId={}, role={}", userId, group.getId(), role);
        return FamilyMembershipResponse.from(membership);
    }

    /**
     * 해당 유저의 가족 그룹 가입 여부 반환.
     */
    public boolean isMember(Long userId) {
        return familyMembershipRepository.findByUserId(userId).isPresent();
    }

    /**
     * 내 가족 그룹 정보 조회 (초대 코드 포함).
     * PARENT 권한이 있어야 초대 코드를 확인할 수 있으므로, 서비스 계층에서는 단순 조회만 수행.
     * 권한 체크는 컨트롤러의 @RequireRole(PARENT)가 담당.
     */
    public FamilyGroupResponse getMyGroup(Long userId) {
        FamilyMembership membership = familyMembershipRepository.findByUserIdWithFamilyGroup(userId)
                .orElseThrow(() -> new NotFoundException("소속된 가족 그룹이 없습니다."));
        return FamilyGroupResponse.from(membership.getFamilyGroup());
    }

    /**
     * PARENT 초대 코드 재발급.
     * 기존 코드를 무효화하고 새 6자리 코드를 발급한다.
     */
    @Transactional
    public FamilyGroupResponse regenerateParentCode(Long userId) {
        FamilyMembership membership = familyMembershipRepository.findByUserIdWithFamilyGroup(userId)
                .orElseThrow(() -> new NotFoundException("소속된 가족 그룹이 없습니다."));

        FamilyGroup group = membership.getFamilyGroup();
        String newCode = generateUniqueParentCode();
        group.regenerateParentInviteCode(newCode);

        log.info("PARENT 초대 코드 재발급: groupId={}, newCode={}", group.getId(), newCode);
        return FamilyGroupResponse.from(group);
    }

    // ── private 헬퍼 ──────────────────────────────────

    /** RELATIVE 초대 코드 중복 없는 6자리 생성 (최대 5회 재시도) */
    private String generateUniqueRelativeCode() {
        for (int attempt = 0; attempt < 5; attempt++) {
            String code = FamilyGroup.generateCode();
            if (!familyGroupRepository.existsByInviteCode(code)) {
                return code;
            }
        }
        throw new IllegalStateException("초대 코드 생성에 실패했습니다. 다시 시도해 주세요.");
    }

    /** PARENT 초대 코드 중복 없는 6자리 생성 (최대 5회 재시도) */
    private String generateUniqueParentCode() {
        for (int attempt = 0; attempt < 5; attempt++) {
            String code = FamilyGroup.generateCode();
            // RELATIVE 코드와도 충돌하지 않아야 함
            if (!familyGroupRepository.existsByParentInviteCode(code)
                    && !familyGroupRepository.existsByInviteCode(code)) {
                return code;
            }
        }
        throw new IllegalStateException("초대 코드 생성에 실패했습니다. 다시 시도해 주세요.");
    }
}
