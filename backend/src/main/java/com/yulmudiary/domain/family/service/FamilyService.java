package com.yulmudiary.domain.family.service;

import com.yulmudiary.domain.family.dto.FamilyJoinRequest;
import com.yulmudiary.domain.family.dto.FamilyJoinResponse;
import com.yulmudiary.domain.family.entity.FamilyGroup;
import com.yulmudiary.domain.family.entity.FamilyMembership;
import com.yulmudiary.domain.family.entity.FamilyRole;
import com.yulmudiary.domain.family.repository.FamilyGroupRepository;
import com.yulmudiary.domain.family.repository.FamilyMembershipRepository;
import com.yulmudiary.domain.user.entity.User;
import com.yulmudiary.domain.user.repository.UserRepository;
import com.yulmudiary.global.exception.AlreadyMemberException;
import jakarta.persistence.EntityNotFoundException;
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
    private final FamilyMembershipRepository membershipRepository;
    private final UserRepository userRepository;

    @Transactional
    public FamilyJoinResponse join(Long userId, FamilyJoinRequest request) {
        // 1. 입력값 null 체크
        if (request.inviteCode() == null) {
            throw new IllegalArgumentException("초대 코드가 누락되었습니다.");
        }

        // 2. 공백 제거 + 대문자 정규화
        String normalizedInput = request.inviteCode().trim().toUpperCase();
        if (normalizedInput.isEmpty()) {
            throw new IllegalArgumentException("초대 코드가 비어 있습니다.");
        }

        // 3. 정규화된 값으로 DB 조회
        FamilyGroup group = familyGroupRepository.findByInviteCode(normalizedInput)
                .orElseThrow(() -> {
                    log.warn("초대 코드 조회 실패. 입력된 코드(정규화): [{}]", normalizedInput);
                    return new EntityNotFoundException("유효하지 않은 초대 코드입니다.");
                });

        // 4. DB 저장 값도 정규화하여 비교 (DB에 대소문자 혼재 가능성 방어)
        String dbCode = group.getInviteCode() != null
                ? group.getInviteCode().trim().toUpperCase()
                : null;
        log.info("입력된 코드: [{}], DB 코드: [{}]", normalizedInput, dbCode);

        if (dbCode == null || !normalizedInput.equals(dbCode)) {
            log.warn("초대 코드 불일치. 입력: [{}], DB: [{}]", normalizedInput, dbCode);
            throw new EntityNotFoundException("유효하지 않은 초대 코드입니다.");
        }

        // 특정 그룹이 아닌 '모든 가족 그룹' 소속 여부 확인 (유저당 하나의 가족 그룹 정책)
        if (membershipRepository.findByUserId(userId).isPresent()) {
            throw new AlreadyMemberException("이미 가족 그룹에 참여한 상태입니다.");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("사용자를 찾을 수 없습니다."));

        FamilyMembership membership = FamilyMembership.builder()
                .user(user)
                .familyGroup(group)
                .role(FamilyRole.RELATIVE)
                .build();
        membershipRepository.save(membership);

        return new FamilyJoinResponse(group.getId(), group.getName(), FamilyRole.RELATIVE.name());
    }
}
