package com.yulmudiary.global.auth;

import com.yulmudiary.domain.family.service.FamilyService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;

@Slf4j
@Component
@RequiredArgsConstructor
public class OAuth2AuthenticationSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final JwtProvider jwtProvider;
    private final FamilyService familyService;

    @Value("${app.oauth2.redirect-uri}")
    private String redirectUri;

    @Value("${app.jwt.refresh-token-expiry}")
    private long refreshTokenExpiry;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
                                        Authentication authentication) throws IOException {
        CustomOAuth2User oAuth2User = (CustomOAuth2User) authentication.getPrincipal();
        Long userId = oAuth2User.getUserId();

        String accessToken = jwtProvider.createAccessToken(userId, oAuth2User.getEmail());
        String refreshToken = jwtProvider.createRefreshToken(userId, oAuth2User.getEmail());

        addRefreshTokenCookie(response, refreshToken);

        boolean member = familyService.isMember(userId);
        log.info("OAuth2 로그인 성공: userId={}, isMember={}", userId, member);

        UriComponentsBuilder builder = UriComponentsBuilder.fromUriString(redirectUri)
                .queryParam("token", accessToken);
        if (!member) {
            builder.queryParam("onboarding", "true");
        }

        getRedirectStrategy().sendRedirect(request, response, builder.build().toUriString());
    }

    private void addRefreshTokenCookie(HttpServletResponse response, String refreshToken) {
        Cookie cookie = new Cookie("refresh_token", refreshToken);
        cookie.setHttpOnly(true);
        cookie.setSecure(false); // 개발환경: false, 운영환경: true
        cookie.setPath("/");
        cookie.setMaxAge((int) (refreshTokenExpiry / 1000));
        response.addCookie(cookie);
    }
}
