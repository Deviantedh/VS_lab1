# ==========================================
# 1. Этап сборки (Build Stage)
# ==========================================
FROM eclipse-temurin:21-jdk-alpine AS builder

WORKDIR /build

# Копируем конфигурацию сборщика и зависимости для кеширования слоев
COPY pom.xml mvnw ./
COPY .mvn .mvn

RUN chmod +x ./mvnw && ./mvnw dependency:go-offline -B

# Копируем исходный код и собираем JAR без прогона тестов в образе
COPY src ./src
RUN ./mvnw clean package -DskipTests

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
