# ==========================================
# 1. Этап сборки (Build Stage)
# ==========================================
FROM eclipse-temurin:21-jdk-alpine AS builder

WORKDIR /build

# Копируем конфигурацию сборщика и зависимости для кеширования слоев
COPY pom.xml mvnw ./
COPY .mvn .mvn

RUN chmod +x ./mvnw

# Копируем исходный код и собираем JAR с сохранением кэша зависимостей Maven
COPY src ./src
RUN --mount=type=cache,target=/root/.m2 ./mvnw clean package -DskipTests

# ==========================================
# 2. Этап запуска (Runtime Stage)
# ==========================================
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

# Создаем непривилегированного пользователя для безопасности
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

COPY --from=builder /build/target/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
