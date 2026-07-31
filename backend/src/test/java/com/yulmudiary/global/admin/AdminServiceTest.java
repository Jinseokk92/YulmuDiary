package com.yulmudiary.global.admin;

import com.yulmudiary.domain.baby.entity.Baby;
import com.yulmudiary.domain.baby.entity.Gender;
import com.yulmudiary.domain.baby.repository.BabyRepository;
import com.yulmudiary.domain.family.repository.FamilyGroupRepository;
import com.yulmudiary.domain.family.repository.FamilyMembershipRepository;
import com.yulmudiary.domain.media.service.ImageStorageService;
import com.yulmudiary.global.admin.dto.AppSettingsResponse;
import com.yulmudiary.global.admin.dto.AppSettingsUpdateRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

/**
 * AdminService의 앱 설정(bornAt 초기화) 로직 검증.
 */
@ExtendWith(MockitoExtension.class)
class AdminServiceTest {

    @Mock
    private FamilyGroupRepository familyGroupRepository;
    @Mock
    private FamilyMembershipRepository familyMembershipRepository;
    @Mock
    private BabyRepository babyRepository;
    @Mock
    private ImageStorageService imageStorageService;

    @InjectMocks
    private AdminService adminService;

    private Baby baby;

    @BeforeEach
    void setUp() {
        baby = Baby.builder()
                .name("율무")
                .birthDate(LocalDate.of(2026, 6, 27))
                .gender(Gender.MALE)
                .profileImageUrl("/media/baby.jpg")
                .build();
        baby.updateBornAt(LocalDateTime.of(2026, 6, 12, 9, 12));

        when(babyRepository.findById(anyLong())).thenReturn(Optional.of(baby));
    }

    @Test
    @DisplayName("clearBornAt=true면 bornAt이 null로 초기화되고 이름/예정일/사진은 유지된다")
    void clearBornAtResetsBornAtOnly() {
        AppSettingsUpdateRequest request = new AppSettingsUpdateRequest(
                "율무", LocalDate.of(2026, 6, 27), null, true);

        AppSettingsResponse response = adminService.updateAppSettings(request);

        assertThat(response.bornAt()).isNull();
        assertThat(response.babyName()).isEqualTo("율무");
        assertThat(response.dueDate()).isEqualTo(LocalDate.of(2026, 6, 27));
        assertThat(response.profileImageUrl()).isEqualTo("/media/baby.jpg");
    }

    @Test
    @DisplayName("clearBornAt과 bornAt이 동시에 오면 400에 해당하는 IllegalArgumentException을 던진다")
    void rejectsClearBornAtWithBornAtTogether() {
        AppSettingsUpdateRequest request = new AppSettingsUpdateRequest(
                "율무", LocalDate.of(2026, 6, 27), LocalDateTime.of(2026, 6, 1, 0, 0), true);

        assertThatThrownBy(() -> adminService.updateAppSettings(request))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("clearBornAt이 없고 bornAt도 없으면 기존 bornAt이 유지된다")
    void keepsExistingBornAtWhenNeitherProvided() {
        AppSettingsUpdateRequest request = new AppSettingsUpdateRequest(
                "율무", LocalDate.of(2026, 6, 27), null, null);

        AppSettingsResponse response = adminService.updateAppSettings(request);

        assertThat(response.bornAt()).isEqualTo(LocalDateTime.of(2026, 6, 12, 9, 12));
    }

    @Test
    @DisplayName("clearBornAt이 false이고 bornAt이 오면 새 값으로 갱신된다")
    void updatesBornAtWhenProvidedWithoutClear() {
        LocalDateTime newBornAt = LocalDateTime.of(2026, 6, 13, 10, 0);
        AppSettingsUpdateRequest request = new AppSettingsUpdateRequest(
                "율무", LocalDate.of(2026, 6, 27), newBornAt, false);

        AppSettingsResponse response = adminService.updateAppSettings(request);

        assertThat(response.bornAt()).isEqualTo(newBornAt);
    }

    @Test
    @DisplayName("resetBabyPhoto는 profileImageUrl만 null로 바꾸고 이름/예정일/출생일시는 유지한다")
    void resetBabyPhotoClearsUrlOnly() {
        AppSettingsResponse response = adminService.resetBabyPhoto();

        assertThat(response.profileImageUrl()).isNull();
        assertThat(response.babyName()).isEqualTo("율무");
        assertThat(response.dueDate()).isEqualTo(LocalDate.of(2026, 6, 27));
        assertThat(response.bornAt()).isEqualTo(LocalDateTime.of(2026, 6, 12, 9, 12));
    }

    @Test
    @DisplayName("resetBabyPhoto는 활성 트랜잭션이 없는 테스트 환경에서는 파일 삭제를 시도하지 않는다 " +
            "(afterCommit 콜백 등록 자체가 스킵되므로, 실제로는 커밋 후에만 삭제된다)")
    void resetBabyPhotoDoesNotDeleteFileWithoutActiveTransaction() {
        adminService.resetBabyPhoto();

        verifyNoInteractions(imageStorageService);
    }
}
