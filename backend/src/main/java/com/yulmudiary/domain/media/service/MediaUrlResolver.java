package com.yulmudiary.domain.media.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * 이미지 URL을 환경에 따라 절대 경로로 변환하는 컴포넌트.
 *
 * <p>DB에 저장된 URL이 다음 세 가지 형태일 수 있다:
 * <ol>
 *   <li>이미 절대 URL (https://storage.googleapis.com/...) → 그대로 반환</li>
 *   <li>로컬 절대 URL (http://localhost:8080/api/media/files/...) → 그대로 반환</li>
 *   <li>상대 경로 (/api/media/files/originals/{filename}) → baseUrl + 파일명으로 변환</li>
 * </ol>
 *
 * <p>로컬 환경: app.media.base-url = http://localhost:8080/api/media/files/originals/
 * <p>운영 환경: app.media.base-url = https://storage.googleapis.com/{bucket}/originals/
 */
@Component
public class MediaUrlResolver {

    private final String baseUrl;

    public MediaUrlResolver(@Value("${app.media.base-url}") String baseUrl) {
        this.baseUrl = baseUrl;
    }

    /**
     * rawUrl을 환경에 맞는 절대 URL로 변환한다.
     * null 또는 빈 값이면 null을 반환한다.
     */
    public String resolve(String rawUrl) {
        if (rawUrl == null || rawUrl.isBlank()) {
            return null;
        }
        // 이미 절대 URL (http/https)이면 그대로 반환
        if (rawUrl.startsWith("http://") || rawUrl.startsWith("https://")) {
            return rawUrl;
        }
        // 상대 경로: 파일명만 추출 후 baseUrl 앞에 붙이기
        // 예: /api/media/files/originals/uuid.png → uuid.png
        String filename = rawUrl.substring(rawUrl.lastIndexOf('/') + 1);
        return baseUrl + filename;
    }
}
