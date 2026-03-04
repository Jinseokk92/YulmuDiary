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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FamilyService {

    private final FamilyGroupRepository familyGroupRepository;
    private final FamilyMembershipRepository membershipRepository;
    private final UserRepository userRepository;

    @Transactional
    public FamilyJoinResponse join(Long userId, FamilyJoinRequest request) {
        FamilyGroup group = familyGroupRepository.findByInviteCode(request.inviteCode())
                .orElseThrow(() -> new EntityNotFoundException("유효하지 않은 초대 코드입니다."));

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
