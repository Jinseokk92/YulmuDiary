package com.yulmudiary.global.auth.annotation;

import java.lang.annotation.*;

/**
 * 관리자(isAdmin = true)만 실행할 수 있는 메서드에 붙이는 어노테이션.
 * AOP {@code RequireAdminAspect}에 의해 처리됩니다.
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface RequireAdmin {
}
