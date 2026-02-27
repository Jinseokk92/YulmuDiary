package com.yulmudiary.domain.baby.repository;

import com.yulmudiary.domain.baby.entity.Baby;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BabyRepository extends JpaRepository<Baby, Long> {
}
