package com.yulmudiary.domain.baby.service;

import com.yulmudiary.domain.baby.dto.BabyResponse;
import com.yulmudiary.domain.baby.repository.BabyRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BabyService {

    private final BabyRepository babyRepository;

    public BabyResponse getBaby(Long id) {
        return babyRepository.findById(id)
                .map(BabyResponse::from)
                .orElseThrow(() -> new EntityNotFoundException("아기 정보를 찾을 수 없습니다."));
    }
}
