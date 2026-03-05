package com.yulmudiary.domain.schedule.service;

import com.yulmudiary.domain.family.entity.FamilyMembership;
import com.yulmudiary.domain.family.repository.FamilyMembershipRepository;
import com.yulmudiary.domain.schedule.dto.ScheduleRequest;
import com.yulmudiary.domain.schedule.dto.ScheduleResponse;
import com.yulmudiary.domain.schedule.entity.Schedule;
import com.yulmudiary.domain.schedule.repository.ScheduleRepository;
import com.yulmudiary.domain.user.entity.User;
import com.yulmudiary.domain.user.repository.UserRepository;
import com.yulmudiary.global.exception.ForbiddenException;
import com.yulmudiary.global.exception.NotFoundException;
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
    private final FamilyMembershipRepository familyMembershipRepository;

    /**
     * 가족 그룹 전체 구성원의 특정 월 일정 조회 (등록일 최신순)
     */
    public List<ScheduleResponse> getByMonth(Long userId, int year, int month) {
        Long familyGroupId = validateAndGetFamilyGroupId(userId);

        LocalDate start = LocalDate.of(year, month, 1);
        LocalDate end = start.withDayOfMonth(start.lengthOfMonth());

        return scheduleRepository
                .findByFamilyGroupIdAndEventDateBetween(familyGroupId, start, end)
                .stream()
                .map(ScheduleResponse::from)
                .toList();
    }

    /**
     * 일정 등록
     * - 1차 검증: 요청자가 가족 그룹 소속인지 확인
     */
    @Transactional
    public ScheduleResponse create(Long userId, ScheduleRequest request) {
        // 1차 검증: 가족 그룹 소속 여부
        validateAndGetFamilyGroupId(userId);

        User author = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("사용자를 찾을 수 없습니다. id=" + userId));

        Schedule schedule = Schedule.builder()
                .author(author)
                .title(request.getTitle())
                .memo(request.getMemo())
                .eventDate(request.getEventDate())
                .isAllDay(request.getIsAllDay())
                .placeName(request.getPlaceName())
                .placeAddress(request.getPlaceAddress())
                .build();

        scheduleRepository.save(schedule);
        return ScheduleResponse.from(schedule);
    }

    /**
     * 일정 수정
     * - 1차 검증: 일정 존재 여부 (없으면 404)
     * - 이중 검증: 요청자와 일정 작성자가 동일한 가족 그룹인지 확인
     */
    @Transactional
    public ScheduleResponse update(Long scheduleId, Long userId, ScheduleRequest request) {
        Schedule schedule = scheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new NotFoundException("일정을 찾을 수 없습니다. id=" + scheduleId));

        // 이중 검증: 요청자 familyGroupId == 일정 작성자 familyGroupId
        validateSameFamilyGroup(userId, schedule.getAuthor().getId());

        schedule.update(request.getTitle(), request.getMemo(), request.getEventDate(), request.getIsAllDay(),
                request.getPlaceName(), request.getPlaceAddress());
        return ScheduleResponse.from(schedule);
    }

    /**
     * 일정 삭제
     * - 1차 검증: 일정 존재 여부 (없으면 404)
     * - 이중 검증: 요청자와 일정 작성자가 동일한 가족 그룹인지 확인
     */
    @Transactional
    public void delete(Long scheduleId, Long userId) {
        Schedule schedule = scheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new NotFoundException("일정을 찾을 수 없습니다. id=" + scheduleId));

        // 이중 검증: 요청자 familyGroupId == 일정 작성자 familyGroupId
        validateSameFamilyGroup(userId, schedule.getAuthor().getId());

        scheduleRepository.delete(schedule);
    }

    /**
     * 이중 검증: 요청자와 대상 일정 작성자가 동일한 가족 그룹에 속하는지 확인.
     * - 요청자 familyGroupId 조회 (미소속이면 403)
     * - 작성자 familyGroupId 조회 (미소속이면 403)
     * - 두 familyGroupId 불일치 시 403
     */
    private void validateSameFamilyGroup(Long requestUserId, Long targetAuthorId) {
        Long requestFamilyGroupId = validateAndGetFamilyGroupId(requestUserId);

        FamilyMembership authorMembership = familyMembershipRepository
                .findByUserIdWithFamilyGroup(targetAuthorId)
                .orElseThrow(() -> new ForbiddenException("일정 작성자가 가족 그룹에 속하지 않습니다."));

        if (!requestFamilyGroupId.equals(authorMembership.getFamilyGroup().getId())) {
            throw new ForbiddenException("다른 가족 그룹의 일정에 접근할 수 없습니다.");
        }
    }

    /**
     * userId가 가족 그룹에 소속되어 있는지 검증 후 familyGroupId 반환.
     * 미소속이면 ForbiddenException (403) 발생.
     */
    private Long validateAndGetFamilyGroupId(Long userId) {
        FamilyMembership membership = familyMembershipRepository.findByUserIdWithFamilyGroup(userId)
                .orElseThrow(() -> new ForbiddenException("가족 그룹에 속하지 않은 사용자입니다."));
        return membership.getFamilyGroup().getId();
    }
}
