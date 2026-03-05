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

    @Query("SELECT COUNT(fm) > 0 FROM FamilyMembership fm " +
            "JOIN Baby b ON fm.familyGroup = b.familyGroup " +
            "WHERE fm.user.id = :userId AND b.id = :babyId")
    boolean existsByUserIdAndBabyId(@Param("userId") Long userId, @Param("babyId") Long babyId);

    @Query("SELECT COUNT(fm) > 0 FROM FamilyMembership fm " +
            "JOIN Baby b ON fm.familyGroup = b.familyGroup " +
            "JOIN DiaryPost dp ON dp.baby = b " +
            "WHERE fm.user.id = :userId AND dp.id = :postId")
    boolean existsByUserIdAndPostId(@Param("userId") Long userId, @Param("postId") Long postId);
}
