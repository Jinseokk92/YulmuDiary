package com.yulmudiary.domain.bestphoto.repository;

import com.yulmudiary.domain.bestphoto.entity.BestPhotoRound;
import com.yulmudiary.domain.bestphoto.entity.PhotoVote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface PhotoVoteRepository extends JpaRepository<PhotoVote, Long> {

    boolean existsByRoundAndVoterUserId(BestPhotoRound round, Long voterUserId);

    Optional<PhotoVote> findByRoundAndVoterUserId(BestPhotoRound round, Long voterUserId);

    @Query("SELECT v.nomination.id, COUNT(v) FROM PhotoVote v WHERE v.round = :round GROUP BY v.nomination.id")
    List<Object[]> countVotesByNominationForRound(@Param("round") BestPhotoRound round);
}
