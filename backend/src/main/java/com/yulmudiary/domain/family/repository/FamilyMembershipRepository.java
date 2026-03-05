package com.yulmudiary.domain.family.repository;

import com.yulmudiary.domain.family.entity.FamilyMembership;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface FamilyMembershipRepository extends JpaRepository<FamilyMembership, Long> {

    Optional<FamilyMembership> findByUserId(Long userId);

    /**
     * userId로 멤버십 조회 (familyGroup fetch join으로 N+1 방지)
     */
    @Query("SELECT fm FROM FamilyMembership fm JOIN FETCH fm.familyGroup WHERE fm.user.id = :userId")
    Optional<FamilyMembership> findByUserIdWithFamilyGroup(@Param("userId") Long userId);
}
