package com.yulmudiary.domain.bestphoto.repository;

import com.yulmudiary.domain.bestphoto.entity.BestPhotoRound;
import com.yulmudiary.domain.bestphoto.entity.PhotoNomination;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PhotoNominationRepository extends JpaRepository<PhotoNomination, Long> {

    List<PhotoNomination> findByRoundOrderByCreatedAtAsc(BestPhotoRound round);

    long countByRound(BestPhotoRound round);

    long countByRoundAndNominatorUserId(BestPhotoRound round, Long nominatorUserId);

    List<PhotoNomination> findByRoundAndNominatorUserId(BestPhotoRound round, Long nominatorUserId);

    boolean existsByRoundAndAlbumPhotoIdAndNominatorUserId(BestPhotoRound round, Long albumPhotoId, Long nominatorUserId);
}
