# Stage 1: Build
FROM gradle:8.12-jdk17 AS builder
WORKDIR /app

# Only copy dependency-related files first for better caching
COPY build.gradle settings.gradle ./
RUN gradle dependencies --no-daemon || true

# Copy source code and build
COPY src ./src
RUN gradle bootJar --no-daemon -x test

# Stage 2: Runtime
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Copy the built jar from the builder stage
COPY --from=builder /app/build/libs/*.jar app.jar

# Application configurations
ENV SPRING_PROFILES_ACTIVE=local
EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
