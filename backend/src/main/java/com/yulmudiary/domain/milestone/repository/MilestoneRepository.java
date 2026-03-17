package com.yulmudiary.domain.milestone.repository;

import com.yulmudiary.domain.milestone.entity.Milestone;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface MilestoneRepository extends JpaRepository<Milestone, Long> {

    @Query("SELECT DISTINCT m FROM Milestone m LEFT JOIN FETCH m.photos " +
            "WHERE m.familyGroup.id = :familyGroupId ORDER BY m.displayOrder ASC")
    List<Milestone> findByFamilyGroupIdOrderByDisplayOrderWithPhotos(@Param("familyGroupId") Long familyGroupId);

    @Query("SELECT m FROM Milestone m LEFT JOIN FETCH m.photos WHERE m.id = :id")
    Optional<Milestone> findByIdWithPhotos(@Param("id") Long id);

    boolean existsByFamilyGroupId(Long familyGroupId);
}
