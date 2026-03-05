package com.yulmudiary.global.auth.aspect;

import com.yulmudiary.domain.family.entity.FamilyMembership;
import com.yulmudiary.domain.family.entity.FamilyRole;
import com.yulmudiary.domain.family.repository.FamilyMembershipRepository;
import com.yulmudiary.global.auth.annotation.RequireRole;
import com.yulmudiary.global.exception.ForbiddenException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Before;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Slf4j
@Aspect
@Component
@RequiredArgsConstructor
public class RequireRoleAspect {

    private final FamilyMembershipRepository familyMembershipRepository;

    @Before("@annotation(requireRole)")
    public void checkRole(RequireRole requireRole) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()) {
            throw new ForbiddenException("인증이 필요합니다.");
        }

        Long userId = (Long) authentication.getPrincipal();

        FamilyMembership membership = familyMembershipRepository.findByUserId(userId)
                .orElseThrow(() -> new ForbiddenException("가족 그룹에 속하지 않은 사용자입니다."));

        FamilyRole requiredRole = requireRole.value();
        FamilyRole userRole = membership.getRole();

        if (!hasRequiredRole(userRole, requiredRole)) {
            log.warn("권한 부족: userId={}, userRole={}, requiredRole={}", userId, userRole, requiredRole);
            throw new ForbiddenException(
                    String.format("이 작업은 %s 권한이 필요합니다. 현재 권한: %s", requiredRole, userRole));
        }
    }

    /**
     * PARENT > RELATIVE 순서로 권한을 비교합니다.
     * requiredRole이 PARENT인 경우 userRole도 PARENT여야 합니다.
     */
    private boolean hasRequiredRole(FamilyRole userRole, FamilyRole requiredRole) {
        if (requiredRole == FamilyRole.RELATIVE) {
            return true; // PARENT, RELATIVE 모두 허용
        }
        return userRole == FamilyRole.PARENT; // PARENT만 허용
    }
}
