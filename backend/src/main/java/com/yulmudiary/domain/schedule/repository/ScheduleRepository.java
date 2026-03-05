package com.yulmudiary.domain.schedule.repository;

import com.yulmudiary.domain.schedule.entity.Schedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface ScheduleRepository extends JpaRepository<Schedule, Long> {

    /**
     * 가족 그룹 전체 구성원의 해당 월 일정 조회
     * - JOIN FETCH로 작성자 정보를 한 번에 로드 (N+1 방지)
     * - 정렬: 등록일 최신순 (createdAt DESC)
     */
    @Query("SELECT s FROM Schedule s JOIN FETCH s.author " +
           "WHERE s.author.id IN (" +
           "    SELECT fm.user.id FROM FamilyMembership fm WHERE fm.familyGroup.id = :familyGroupId" +
           ") AND s.eventDate BETWEEN :start AND :end " +
           "ORDER BY s.createdAt DESC")
    List<Schedule> findByFamilyGroupIdAndEventDateBetween(
            @Param("familyGroupId") Long familyGroupId,
            @Param("start") LocalDate start,
            @Param("end") LocalDate end);

    /**
     * 작성자 본인의 일정만 삭제 (권한 검증 포함)
     */
    @Modifying
    @Query("DELETE FROM Schedule s WHERE s.id = :id AND s.author.id = :authorId")
    int deleteByIdAndAuthorId(@Param("id") Long id, @Param("authorId") Long authorId);
}
