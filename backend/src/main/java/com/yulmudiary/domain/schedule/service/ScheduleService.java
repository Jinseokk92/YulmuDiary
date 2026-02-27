package com.yulmudiary.domain.schedule.service;

import com.yulmudiary.domain.schedule.dto.ScheduleRequest;
import com.yulmudiary.domain.schedule.dto.ScheduleResponse;
import com.yulmudiary.domain.schedule.entity.Schedule;
import com.yulmudiary.domain.schedule.repository.ScheduleRepository;
import com.yulmudiary.domain.user.entity.User;
import com.yulmudiary.domain.user.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ScheduleService {

    private final ScheduleRepository scheduleRepository;
    private final UserRepository userRepository;

    /**
     * 특정 월 일정 목록 조회
     */
    public List<ScheduleResponse> getByMonth(Long userId, int year, int month) {
        LocalDate start = LocalDate.of(year, month, 1);
        LocalDate end = start.withDayOfMonth(start.lengthOfMonth());

        return scheduleRepository
                .findByAuthorIdAndEventDateBetweenOrderByEventDateAsc(userId, start, end)
                .stream()
                .map(ScheduleResponse::from)
                .toList();
    }

    /**
     * 일정 등록
     */
    @Transactional
    public ScheduleResponse create(Long userId, ScheduleRequest request) {
        User author = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("사용자를 찾을 수 없습니다. id=" + userId));

        Schedule schedule = Schedule.builder()
                .author(author)
                .title(request.getTitle())
                .memo(request.getMemo())
                .eventDate(request.getEventDate())
                .isAllDay(request.getIsAllDay())
                .build();

        scheduleRepository.save(schedule);
        return ScheduleResponse.from(schedule);
    }

    /**
     * 일정 수정 (작성자 검증 포함)
     */
    @Transactional
    public ScheduleResponse update(Long scheduleId, Long userId, ScheduleRequest request) {
        Schedule schedule = scheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new EntityNotFoundException("일정을 찾을 수 없습니다. id=" + scheduleId));

        validateAuthor(schedule, userId);

        schedule.update(request.getTitle(), request.getMemo(), request.getEventDate(), request.getIsAllDay());
        return ScheduleResponse.from(schedule);
    }

    /**
     * 일정 삭제 (작성자 검증 포함)
     */
    @Transactional
    public void delete(Long scheduleId, Long userId) {
        if (!scheduleRepository.existsById(scheduleId)) {
            throw new EntityNotFoundException("일정을 찾을 수 없습니다. id=" + scheduleId);
        }
        int deleted = scheduleRepository.deleteByIdAndAuthorId(scheduleId, userId);
        if (deleted == 0) {
            throw new IllegalArgumentException("작성자만 삭제할 수 있습니다.");
        }
    }

    private void validateAuthor(Schedule schedule, Long userId) {
        if (!schedule.getAuthor().getId().equals(userId)) {
            throw new IllegalArgumentException("작성자만 수정할 수 있습니다.");
        }
    }
}
