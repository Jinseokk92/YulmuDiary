package com.yulmudiary.domain.family.repository;

import com.yulmudiary.domain.family.entity.FamilyMembership;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface FamilyMembershipRepository extends JpaRepository<FamilyMembership, Long> {

    Optional<FamilyMembership> findByUserId(Long userId);
}
