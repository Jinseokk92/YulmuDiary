package com.yulmudiary.domain.family.repository;

import com.yulmudiary.domain.family.entity.FamilyGroup;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface FamilyGroupRepository extends JpaRepository<FamilyGroup, Long> {

    Optional<FamilyGroup> findByInviteCode(String inviteCode);
}
