package com.yulmudiary.domain.schedule.entity;

import com.yulmudiary.domain.user.entity.User;
import com.yulmudiary.global.entity.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Entity
@Table(name = "schedule")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Schedule extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User author;

    @Column(nullable = false, length = 100)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String memo;

    @Column(nullable = false)
    private LocalDate eventDate;

    @Column(nullable = false)
    private Boolean isAllDay;

    @Column(length = 100)
    private String placeName;

    @Column(length = 200)
    private String address;

    @Column(length = 100)
    private String addressDetail;

    @Builder
    public Schedule(User author, String title, String memo, LocalDate eventDate, Boolean isAllDay, String placeName, String address, String addressDetail) {
        this.author = author;
        this.title = title;
        this.memo = memo;
        this.eventDate = eventDate;
        this.isAllDay = isAllDay != null ? isAllDay : true;
        this.placeName = placeName;
        this.address = address;
        this.addressDetail = addressDetail;
    }

    public void update(String title, String memo, LocalDate eventDate, Boolean isAllDay, String placeName, String address, String addressDetail) {
        this.title = title;
        this.memo = memo;
        this.eventDate = eventDate;
        this.isAllDay = isAllDay != null ? isAllDay : this.isAllDay;
        this.placeName = placeName;
        this.address = address;
        this.addressDetail = addressDetail;
    }
}
