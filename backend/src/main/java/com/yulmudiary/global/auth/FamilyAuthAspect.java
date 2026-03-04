package com.yulmudiary.global.auth;

import com.yulmudiary.domain.family.repository.FamilyMembershipRepository;
import com.yulmudiary.global.exception.FamilyAuthorizationException;
import lombok.RequiredArgsConstructor;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.lang.reflect.Method;
import java.lang.reflect.Parameter;

@Aspect
@Component
@RequiredArgsConstructor
public class FamilyAuthAspect {

    private final FamilyMembershipRepository membershipRepository;

    @Around("@annotation(checkFamilyAuth)")
    public Object checkAuth(ProceedingJoinPoint joinPoint, CheckFamilyAuth checkFamilyAuth) throws Throwable {
        Long userId = getCurrentUserId();

        switch (checkFamilyAuth.value()) {
            case BABY_ID -> {
                Long babyId = resolveBabyId(joinPoint);
                if (!membershipRepository.existsByUserIdAndBabyId(userId, babyId)) {
                    throw new FamilyAuthorizationException();
                }
            }
            case POST_ID -> {
                Long postId = resolvePostId(joinPoint);
                if (!membershipRepository.existsByUserIdAndPostId(userId, postId)) {
                    throw new FamilyAuthorizationException();
                }
            }
        }

        return joinPoint.proceed();
    }

    private Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getPrincipal() == null) {
            throw new FamilyAuthorizationException();
        }
        return (Long) authentication.getPrincipal();
    }

    private Long resolveBabyId(ProceedingJoinPoint joinPoint) {
        // 1. 메서드 파라미터에서 babyId 찾기
        Long babyId = getParameterValue(joinPoint, "babyId", Long.class);
        if (babyId != null) {
            return babyId;
        }

        // 2. RequestBody에서 getBabyId() 호출
        Object[] args = joinPoint.getArgs();
        for (Object arg : args) {
            if (arg == null) continue;
            try {
                Method getBabyId = arg.getClass().getMethod("getBabyId");
                Object result = getBabyId.invoke(arg);
                if (result instanceof Long) {
                    return (Long) result;
                }
            } catch (NoSuchMethodException ignored) {
                // getBabyId 메서드가 없는 객체는 스킵
            } catch (Exception e) {
                throw new IllegalStateException("babyId를 추출할 수 없습니다.", e);
            }
        }

        throw new IllegalArgumentException("babyId 파라미터를 찾을 수 없습니다.");
    }

    private Long resolvePostId(ProceedingJoinPoint joinPoint) {
        // postId 또는 id 파라미터 찾기
        Long postId = getParameterValue(joinPoint, "postId", Long.class);
        if (postId != null) {
            return postId;
        }

        Long id = getParameterValue(joinPoint, "id", Long.class);
        if (id != null) {
            return id;
        }

        throw new IllegalArgumentException("postId 또는 id 파라미터를 찾을 수 없습니다.");
    }

    @SuppressWarnings("unchecked")
    private <T> T getParameterValue(ProceedingJoinPoint joinPoint, String paramName, Class<T> type) {
        MethodSignature signature = (MethodSignature) joinPoint.getSignature();
        Parameter[] parameters = signature.getMethod().getParameters();
        Object[] args = joinPoint.getArgs();

        for (int i = 0; i < parameters.length; i++) {
            if (parameters[i].getName().equals(paramName) && type.isInstance(args[i])) {
                return (T) args[i];
            }
        }
        return null;
    }
}
