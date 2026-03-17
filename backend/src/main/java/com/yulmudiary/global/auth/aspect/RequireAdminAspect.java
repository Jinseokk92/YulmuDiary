package com.yulmudiary.global.auth.aspect;

import com.yulmudiary.domain.user.entity.User;
import com.yulmudiary.domain.user.repository.UserRepository;
import com.yulmudiary.global.auth.annotation.RequireAdmin;
import com.yulmudiary.global.exception.ForbiddenException;
import jakarta.persistence.EntityNotFoundException;
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
public class RequireAdminAspect {

    private final UserRepository userRepository;

    @Before("@annotation(requireAdmin)")
    public void checkAdmin(RequireAdmin requireAdmin) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()) {
            throw new ForbiddenException("인증이 필요합니다.");
        }

        Long userId = (Long) authentication.getPrincipal();

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("사용자를 찾을 수 없습니다. id=" + userId));

        if (!user.isAdmin()) {
            log.warn("관리자 권한 없음: userId={}", userId);
            throw new ForbiddenException("관리자 권한이 필요합니다.");
        }
    }
}
