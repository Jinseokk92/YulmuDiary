package com.yulmudiary;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.util.TimeZone;

@SpringBootApplication
public class YulmuDiaryApplication {

    public static void main(String[] args) {
        // JVM 타임존을 KST로 고정.
        // Cloud Run 인스턴스 기본 TZ=UTC이므로, TZ 환경변수 설정보다 먼저 강제로 지정.
        // @CreatedDate(LocalDateTime.now())·Jackson 직렬화·Hibernate JDBC 모두 이 타임존을 따른다.
        TimeZone.setDefault(TimeZone.getTimeZone("Asia/Seoul"));
        SpringApplication.run(YulmuDiaryApplication.class, args);
    }
}
