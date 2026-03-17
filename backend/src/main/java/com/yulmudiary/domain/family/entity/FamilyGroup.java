package com.yulmudiary.domain.family.entity;

import com.yulmudiary.global.entity.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Entity
@Table(name = "family_group")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class FamilyGroup extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 50)
    private String name;

    /** RELATIVE 초대 코드 (기존, 하위 호환 유지) */
    @Column(nullable = false, unique = true, length = 6)
    private String inviteCode;

    /** PARENT 초대 코드 (nullable = 비활성, unique) */
    @Column(unique = true, length = 6)
    private String parentInviteCode;

    @Builder
    public FamilyGroup(String name, String inviteCode, String parentInviteCode) {
        this.name = name;
        this.inviteCode = inviteCode;
        this.parentInviteCode = parentInviteCode;
    }

    /** parentInviteCode를 새로운 6자리 코드로 재발급한다. */
    public void regenerateParentInviteCode(String newCode) {
        this.parentInviteCode = newCode;
    }

    /** inviteCode(RELATIVE)를 새로운 6자리 코드로 재발급한다. */
    public void regenerateInviteCode(String newCode) {
        this.inviteCode = newCode;
    }

    /** UUID 앞 6자리 대문자 코드를 생성한다. */
    public static String generateCode() {
        return UUID.randomUUID()
                .toString()
                .replace("-", "")
                .substring(0, 6)
                .toUpperCase();
    }
}
