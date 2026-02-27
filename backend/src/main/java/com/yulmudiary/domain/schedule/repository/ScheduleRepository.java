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
     * 특정 월에 해당하는 일정 목록 조회 (날짜 오름차순)
     */
    List<Schedule> findByAuthorIdAndEventDateBetweenOrderByEventDateAsc(
            Long authorId, LocalDate start, LocalDate end);

    /**
     * 작성자 본인의 일정만 삭제 (권한 검증 포함)
     */
    @Modifying
    @Query("DELETE FROM Schedule s WHERE s.id = :id AND s.author.id = :authorId")
    int deleteByIdAndAuthorId(@Param("id") Long id, @Param("authorId") Long authorId);
}
