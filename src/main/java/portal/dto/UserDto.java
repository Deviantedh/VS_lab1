package portal.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;
import portal.entity.RoleCode;

import java.time.Instant;

public class UserDto {

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Request {
        @Schema(description = "ID привязанного сотрудника (опционально)", example = "1")
        private Long employeeId;

        @NotNull(message = "ID роли обязателен (0 - ADMIN, 1 - HR, 2 - MANAGER, 3 - EMPLOYEE)")
        @Schema(description = "ID роли: 0 - ADMIN, 1 - HR, 2 - MANAGER, 3 - EMPLOYEE", example = "3")
        private Short roleId;

        @NotBlank(message = "Логин обязателен")
        @Size(min = 3, max = 100, message = "Логин должен быть от 3 до 100 символов")
        @Schema(description = "Логин пользователя", example = "ivan_smirnov")
        private String login;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Response {
        @Schema(example = "1")
        private Long id;
        @Schema(example = "1")
        private Long employeeId;
        @Schema(example = "Иван Смирнов")
        private String employeeName;
        @Schema(example = "3")
        private Short roleId;
        @Schema(example = "EMPLOYEE")
        private RoleCode roleCode;
        @Schema(example = "Сотрудник")
        private String roleName;
        @Schema(example = "ivan_smirnov")
        private String login;
        @Schema(example = "true")
        private Boolean isActive;
        private Instant lastLoginAt;
        private Instant createdAt;
    }
}
