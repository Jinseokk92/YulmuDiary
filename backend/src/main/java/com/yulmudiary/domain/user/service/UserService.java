package com.yulmudiary.domain.user.service;

import com.yulmudiary.domain.diary.repository.DiaryPostRepository;
import com.yulmudiary.domain.diary.repository.ReactionRepository;
import com.yulmudiary.domain.media.dto.ImagePaths;
import com.yulmudiary.domain.media.service.ImageStorageService;
import com.yulmudiary.domain.user.dto.UserResponse;
import com.yulmudiary.domain.user.dto.UserStatsResponse;
import com.yulmudiary.domain.user.dto.UserUpdateRequest;
import com.yulmudiary.domain.user.entity.User;
import com.yulmudiary.domain.user.repository.UserRepository;
import com.yulmudiary.global.exception.NotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
public class UserService {

    private static final long MAX_PROFILE_IMAGE_SIZE = 5 * 1024 * 1024L; // 5MB
    private static final String ALLOWED_CONTENT_TYPE_PREFIX = "image/";

    private final UserRepository userRepository;
    private final ImageStorageService imageStorageService;
    private final DiaryPostRepository diaryPostRepository;
    private final ReactionRepository reactionRepository;

    @Transactional
    public UserResponse updateProfile(Long userId, UserUpdateRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("사용자를 찾을 수 없습니다."));
        user.updateNameAndBio(request.getName(), request.getBio());
        return UserResponse.from(user);
    }

    @Transactional
    public UserResponse updateProfileImage(Long userId, MultipartFile file) {
        validateImageFile(file);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("사용자를 찾을 수 없습니다."));

        ImagePaths paths = imageStorageService.store(file);
        user.updateProfileImageUrl(paths.imageUrl());

        return UserResponse.from(user);
    }

    @Transactional(readOnly = true)
    public UserStatsResponse getUserStats(Long userId) {
        long postCount     = diaryPostRepository.countByAuthorId(userId);
        long photoCount    = diaryPostRepository.countMediaByAuthorId(userId);
        long reactionCount = reactionRepository.countDistinctPostByUserId(userId);
        return UserStatsResponse.builder()
                .postCount(postCount)
                .photoCount(photoCount)
                .reactionCount(reactionCount)
                .build();
    }

    private void validateImageFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("파일이 비어 있습니다.");
        }
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith(ALLOWED_CONTENT_TYPE_PREFIX)) {
            throw new IllegalArgumentException("이미지 파일만 업로드할 수 있습니다. (jpg, png, webp 등)");
        }
        if (file.getSize() > MAX_PROFILE_IMAGE_SIZE) {
            throw new IllegalArgumentException("파일 크기는 5MB 이하여야 합니다.");
        }
    }
}
