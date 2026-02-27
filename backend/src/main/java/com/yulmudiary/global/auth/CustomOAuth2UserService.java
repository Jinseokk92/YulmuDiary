package com.yulmudiary.global.auth;

import com.yulmudiary.domain.user.entity.User;
import com.yulmudiary.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final UserRepository userRepository;

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oAuth2User = super.loadUser(userRequest);

        String registrationId = userRequest.getClientRegistration().getRegistrationId();
        OAuth2Attributes attributes = OAuth2Attributes.of(registrationId, oAuth2User.getAttributes());

        User user = saveOrUpdate(attributes);

        return new CustomOAuth2User(
                user.getId(),
                user.getEmail(),
                user.getRole(),
                oAuth2User.getAttributes()
        );
    }

    private User saveOrUpdate(OAuth2Attributes attributes) {
        User user = userRepository.findByProviderAndProviderId(
                        attributes.getProvider(), attributes.getProviderId())
                .map(existing -> {
                    existing.updateProfile(attributes.getName(), attributes.getProfileImageUrl());
                    return existing;
                })
                .orElseGet(attributes::toEntity);

        return userRepository.save(user);
    }
}
