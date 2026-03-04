package com.yulmudiary.domain.family.repository;

import com.yulmudiary.domain.family.entity.FamilyMembership;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface FamilyMembershipRepository extends JpaRepository<FamilyMembership, Long> {

    Optional<FamilyMembership> findByUserId(Long userId);

    boolean existsByUserIdAndFamilyGroupId(Long userId, Long familyGroupId);

    @Query("SELECT CASE WHEN COUNT(fm) > 0 THEN true ELSE false END FROM FamilyMembership fm " +
           "WHERE fm.user.id = :userId " +
           "AND fm.familyGroup.id = (SELECT b.familyGroup.id FROM Baby b WHERE b.id = :babyId)")
    boolean existsByUserIdAndBabyId(@Param("userId") Long userId, @Param("babyId") Long babyId);

    @Query("SELECT CASE WHEN COUNT(fm) > 0 THEN true ELSE false END FROM FamilyMembership fm " +
           "WHERE fm.user.id = :userId " +
           "AND fm.familyGroup.id = (SELECT dp.baby.familyGroup.id FROM DiaryPost dp WHERE dp.id = :postId)")
    boolean existsByUserIdAndPostId(@Param("userId") Long userId, @Param("postId") Long postId);
}
