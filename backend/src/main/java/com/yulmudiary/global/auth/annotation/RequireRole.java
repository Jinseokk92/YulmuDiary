package com.yulmudiary.global.auth.annotation;

import com.yulmudiary.domain.family.entity.FamilyRole;

import java.lang.annotation.*;

/**
 * 지정한 FamilyRole 이상의 권한이 있는 경우에만 메서드 실행을 허용합니다.
 * AOP {@code RequireRoleAspect}에 의해 처리됩니다.
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface RequireRole {
    FamilyRole value();
}
