package com.yulmudiary.domain.bestphoto.service;

import com.yulmudiary.domain.album.entity.AlbumPhoto;
import com.yulmudiary.domain.album.repository.AlbumPhotoRepository;
import com.yulmudiary.domain.bestphoto.dto.BestPhotoStatusResponse;
import com.yulmudiary.domain.bestphoto.dto.NominationResponse;
import com.yulmudiary.domain.bestphoto.entity.BestPhotoRound;
import com.yulmudiary.domain.bestphoto.entity.PhotoNomination;
import com.yulmudiary.domain.bestphoto.entity.PhotoVote;
import com.yulmudiary.domain.bestphoto.entity.RoundStatus;
import com.yulmudiary.domain.bestphoto.repository.BestPhotoRoundRepository;
import com.yulmudiary.domain.bestphoto.repository.PhotoNominationRepository;
import com.yulmudiary.domain.bestphoto.repository.PhotoVoteRepository;
import com.yulmudiary.domain.media.service.MediaUrlResolver;
import com.yulmudiary.domain.user.entity.User;
import com.yulmudiary.domain.user.repository.UserRepository;
import com.yulmudiary.global.exception.ForbiddenException;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BestPhotoService {

    private final BestPhotoRoundRepository roundRepository;
    private final PhotoNominationRepository nominationRepository;
    private final PhotoVoteRepository voteRepository;
    private final AlbumPhotoRepository albumPhotoRepository;
    private final MediaUrlResolver mediaUrlResolver;
    private final UserRepository userRepository;

    // ── Private helpers ────────────────────────────────────────────────────

    private Optional<BestPhotoRound> findActiveRound() {
        return roundRepository.findFirstByStatusInOrderByStartedAtDesc(
                List.of(RoundStatus.NOMINATING, RoundStatus.VOTING));
    }

    private Optional<BestPhotoRound> findLatestResultRound() {
        return roundRepository.findFirstByStatusOrderByEndedAtDesc(RoundStatus.RESULT);
    }

    private Map<Long, Long> buildVoteCountMap(BestPhotoRound round) {
        List<Object[]> rows = voteRepository.countVotesByNominationForRound(round);
        return rows.stream().collect(Collectors.toMap(
                row -> (Long) row[0],
                row -> (Long) row[1]
        ));
    }

    private NominationResponse toNominationResponse(PhotoNomination nomination,
                                                     Map<Long, Long> voteCountMap,
                                                     Long currentUserId) {
        AlbumPhoto photo = albumPhotoRepository.findById(nomination.getAlbumPhotoId())
                .orElseThrow(() -> new EntityNotFoundException(
                        "AlbumPhoto not found: " + nomination.getAlbumPhotoId()));
        User nominator = userRepository.findById(nomination.getNominatorUserId())
                .orElseThrow(() -> new EntityNotFoundException(
                        "User not found: " + nomination.getNominatorUserId()));

        long voteCount = voteCountMap.getOrDefault(nomination.getId(), 0L);

        return NominationResponse.builder()
                .id(nomination.getId())
                .albumPhotoId(photo.getId())
                .albumPhotoUrl(mediaUrlResolver.resolve(photo.getUrl()))
                .albumPhotoThumbnailUrl(mediaUrlResolver.resolve(photo.getThumbnailUrl()))
                .nominatorUserId(nominator.getId())
                .nominatorName(nominator.getName())
                .voteCount((int) voteCount)
                .myNomination(nomination.getNominatorUserId().equals(currentUserId))
                .build();
    }

    // ── Admin operations ───────────────────────────────────────────────────

    @Transactional
    public void startRound() {
        findActiveRound().ifPresent(r -> {
            throw new IllegalArgumentException("이미 진행 중인 라운드가 있습니다.");
        });
        roundRepository.save(BestPhotoRound.builder()
                .status(RoundStatus.NOMINATING)
                .startedAt(LocalDateTime.now())
                .build());
    }

    @Transactional
    public void startVoting() {
        BestPhotoRound round = findActiveRound()
                .filter(r -> r.getStatus() == RoundStatus.NOMINATING)
                .orElseThrow(() -> new IllegalArgumentException("추천 단계의 라운드가 없습니다."));
        if (nominationRepository.countByRound(round) == 0) {
            throw new IllegalArgumentException("추천된 사진이 없습니다.");
        }
        round.startVoting(LocalDateTime.now());
    }

    @Transactional
    public void endVoting() {
        BestPhotoRound round = findActiveRound()
                .filter(r -> r.getStatus() == RoundStatus.VOTING)
                .orElseThrow(() -> new IllegalArgumentException("투표 단계의 라운드가 없습니다."));

        List<PhotoNomination> nominations = nominationRepository.findByRoundOrderByCreatedAtAsc(round);
        Map<Long, Long> voteMap = buildVoteCountMap(round);

        // Winner: most votes; tie → earliest nominated (first in list)
        PhotoNomination winner = nominations.stream()
                .max(Comparator.comparingLong(n -> voteMap.getOrDefault(n.getId(), 0L)))
                .orElse(nominations.get(0));

        round.endVoting(
                LocalDateTime.now(),
                winner.getAlbumPhotoId(),
                voteMap.getOrDefault(winner.getId(), 0L).intValue()
        );
    }

    // ── User operations ────────────────────────────────────────────────────

    @Transactional
    public NominationResponse nominate(Long albumPhotoId, Long userId) {
        BestPhotoRound round = findActiveRound()
                .filter(r -> r.getStatus() == RoundStatus.NOMINATING)
                .orElseThrow(() -> new IllegalArgumentException("추천 단계가 아닙니다."));

        long myCount = nominationRepository.countByRoundAndNominatorUserId(round, userId);
        if (myCount >= 2) {
            throw new IllegalArgumentException("한 라운드에 최대 2장까지 추천할 수 있습니다.");
        }

        if (nominationRepository.existsByRoundAndAlbumPhotoIdAndNominatorUserId(round, albumPhotoId, userId)) {
            throw new IllegalArgumentException("이미 추천한 사진입니다.");
        }

        PhotoNomination nomination = nominationRepository.save(PhotoNomination.builder()
                .round(round)
                .albumPhotoId(albumPhotoId)
                .nominatorUserId(userId)
                .build());

        return toNominationResponse(nomination, Collections.emptyMap(), userId);
    }

    @Transactional
    public void cancelNomination(Long nominationId, Long userId) {
        PhotoNomination nomination = nominationRepository.findById(nominationId)
                .orElseThrow(() -> new EntityNotFoundException("추천을 찾을 수 없습니다."));

        if (!nomination.getNominatorUserId().equals(userId)) {
            throw new ForbiddenException("본인의 추천만 취소할 수 있습니다.");
        }

        if (nomination.getRound().getStatus() != RoundStatus.NOMINATING) {
            throw new IllegalArgumentException("추천 단계가 아니면 취소할 수 없습니다.");
        }

        nominationRepository.delete(nomination);
    }

    @Transactional
    public void vote(Long nominationId, Long userId) {
        BestPhotoRound round = findActiveRound()
                .filter(r -> r.getStatus() == RoundStatus.VOTING)
                .orElseThrow(() -> new IllegalArgumentException("투표 단계가 아닙니다."));

        if (voteRepository.existsByRoundAndVoterUserId(round, userId)) {
            throw new IllegalArgumentException("이미 투표했습니다.");
        }

        PhotoNomination nomination = nominationRepository.findById(nominationId)
                .orElseThrow(() -> new EntityNotFoundException("추천을 찾을 수 없습니다."));

        if (!nomination.getRound().getId().equals(round.getId())) {
            throw new IllegalArgumentException("현재 라운드의 추천이 아닙니다.");
        }

        voteRepository.save(PhotoVote.builder()
                .round(round)
                .nomination(nomination)
                .voterUserId(userId)
                .build());
    }

    public BestPhotoStatusResponse getStatus(Long userId) {
        Optional<BestPhotoRound> activeOpt = findActiveRound();
        Optional<BestPhotoRound> resultOpt = findLatestResultRound();

        if (activeOpt.isEmpty() && resultOpt.isEmpty()) {
            return BestPhotoStatusResponse.builder()
                    .status("NONE")
                    .myNominations(Collections.emptyList())
                    .nominations(Collections.emptyList())
                    .build();
        }

        if (activeOpt.isPresent()) {
            BestPhotoRound round = activeOpt.get();
            String status = round.getStatus().name();

            long myNomCount = nominationRepository.countByRoundAndNominatorUserId(round, userId);
            long totalNominations = nominationRepository.countByRound(round);
            boolean hasVoted = (round.getStatus() == RoundStatus.VOTING)
                    && voteRepository.existsByRoundAndVoterUserId(round, userId);

            Long votedNominationId = hasVoted
                    ? voteRepository.findByRoundAndVoterUserId(round, userId)
                            .map(v -> v.getNomination().getId())
                            .orElse(null)
                    : null;

            List<PhotoNomination> myNomEntities =
                    nominationRepository.findByRoundAndNominatorUserId(round, userId);

            Map<Long, Long> voteMap = (round.getStatus() == RoundStatus.VOTING)
                    ? buildVoteCountMap(round)
                    : Collections.emptyMap();

            List<NominationResponse> myNominations = myNomEntities.stream()
                    .map(n -> toNominationResponse(n, voteMap, userId))
                    .collect(Collectors.toList());

            List<NominationResponse> nominations;
            if (round.getStatus() == RoundStatus.VOTING) {
                nominations = nominationRepository.findByRoundOrderByCreatedAtAsc(round).stream()
                        .map(n -> toNominationResponse(n, voteMap, userId))
                        .collect(Collectors.toList());
            } else {
                nominations = Collections.emptyList();
            }

            return BestPhotoStatusResponse.builder()
                    .status(status)
                    .roundId(round.getId())
                    .myNominationCount((int) myNomCount)
                    .totalNominations((int) totalNominations)
                    .hasVoted(hasVoted)
                    .votedNominationId(votedNominationId)
                    .myNominations(myNominations)
                    .nominations(nominations)
                    .build();
        }

        // Only result round exists
        BestPhotoRound resultRound = resultOpt.get();
        Map<Long, Long> voteMap = buildVoteCountMap(resultRound);

        List<NominationResponse> topNominations = nominationRepository
                .findByRoundOrderByCreatedAtAsc(resultRound).stream()
                .map(n -> toNominationResponse(n, voteMap, userId))
                .sorted(Comparator.comparingInt(NominationResponse::getVoteCount).reversed())
                .limit(3)
                .collect(Collectors.toList());

        AlbumPhoto winnerPhoto = resultRound.getWinnerAlbumPhotoId() != null
                ? albumPhotoRepository.findById(resultRound.getWinnerAlbumPhotoId()).orElse(null)
                : null;

        BestPhotoStatusResponse.ResultDto resultDto = BestPhotoStatusResponse.ResultDto.builder()
                .winnerAlbumPhotoId(resultRound.getWinnerAlbumPhotoId())
                .winnerAlbumPhotoUrl(winnerPhoto != null ? mediaUrlResolver.resolve(winnerPhoto.getUrl()) : null)
                .winnerAlbumPhotoThumbnailUrl(winnerPhoto != null ? mediaUrlResolver.resolve(winnerPhoto.getThumbnailUrl()) : null)
                .winnerVoteCount(resultRound.getWinnerVoteCount() != null ? resultRound.getWinnerVoteCount() : 0)
                .topNominations(topNominations)
                .build();

        return BestPhotoStatusResponse.builder()
                .status("RESULT")
                .roundId(resultRound.getId())
                .myNominationCount(0)
                .totalNominations(0)
                .hasVoted(false)
                .myNominations(Collections.emptyList())
                .nominations(Collections.emptyList())
                .result(resultDto)
                .build();
    }
}
