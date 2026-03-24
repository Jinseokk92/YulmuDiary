package com.yulmudiary.domain.bestphoto.repository;

import com.yulmudiary.domain.bestphoto.entity.BestPhotoRound;
import com.yulmudiary.domain.bestphoto.entity.RoundStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface BestPhotoRoundRepository extends JpaRepository<BestPhotoRound, Long> {

    Optional<BestPhotoRound> findFirstByStatusInOrderByStartedAtDesc(List<RoundStatus> statuses);

    Optional<BestPhotoRound> findFirstByStatusOrderByEndedAtDesc(RoundStatus status);
}
