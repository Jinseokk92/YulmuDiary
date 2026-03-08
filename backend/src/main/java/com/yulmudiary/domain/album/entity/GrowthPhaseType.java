package com.yulmudiary.domain.album.entity;

public enum GrowthPhaseType {
    PREGNANCY,  // 임신 기간 — growthIndex = 주차 (1 ~ 41)
    BABY        // 출생 후 성장 — growthIndex = 개월 수 (0 ~ 72)
}
