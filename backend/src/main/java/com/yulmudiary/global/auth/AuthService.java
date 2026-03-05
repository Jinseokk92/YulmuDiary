package com.yulmudiary.global.auth;

import com.yulmudiary.domain.family.entity.FamilyMembership;
import com.yulmudiary.domain.family.entity.FamilyRole;
import com.yulmudiary.domain.family.repository.FamilyMembershipRepository;
import com.yulmudiary.domain.user.entity.User;
import com.yulmudiary.domain.user.repository.UserRepository;
import com.yulmudiary.global.auth.dto.AuthMeResponse;
import com.yulmudiary.global.auth.dto.TokenRefreshResponse;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AuthService {

    private final UserRepository userRepository;
    private final FamilyMembershipRepository familyMembershipRepository;
    private final JwtProvider jwtProvider;

    public AuthMeResponse getMyInfo(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("사용자를 찾을 수 없습니다. id=" + userId));

        Optional<FamilyMembership> membership = familyMembershipRepository.findByUserIdWithFamilyGroup(userId);
        Long familyGroupId = membership.map(m -> m.getFamilyGroup().getId()).orElse(null);
        FamilyRole familyRole = membership.map(FamilyMembership::getRole).orElse(null);

        return AuthMeResponse.of(user, familyGroupId, familyRole);
    }

    public TokenRefreshResponse refreshAccessToken(String refreshToken) {
        if (!jwtProvider.validateToken(refreshToken)) {
            throw new InvalidTokenException("유효하지 않은 Refresh Token입니다.");
        }

        String tokenType = jwtProvider.getTokenType(refreshToken);
        if (!"refresh".equals(tokenType)) {
            throw new InvalidTokenException("Refresh Token이 아닙니다.");
        }

        Long userId = jwtProvider.getUserId(refreshToken);
        String email = jwtProvider.getEmail(refreshToken);

        // 유저 존재 여부 검증
        if (!userRepository.existsById(userId)) {
            throw new EntityNotFoundException("사용자를 찾을 수 없습니다. id=" + userId);
        }

        String newAccessToken = jwtProvider.createAccessToken(userId, email);
        return new TokenRefreshResponse(newAccessToken);
    }
}
