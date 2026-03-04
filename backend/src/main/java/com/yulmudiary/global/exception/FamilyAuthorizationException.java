package com.yulmudiary.global.exception;

public class FamilyAuthorizationException extends RuntimeException {

    public FamilyAuthorizationException() {
        super("해당 가족 그룹에 대한 접근 권한이 없습니다.");
    }
}
