package portal.dto;

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
        private Long employeeId;

        @NotNull(message = "ID роли обязателен (0 - ADMIN, 1 - HR, 2 - MANAGER, 3 - EMPLOYEE)")
        private Short roleId;

        @NotBlank(message = "Логин обязателен")
        @Size(min = 3, max = 100, message = "Логин должен быть от 3 до 100 символов")
        private String login;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Response {
        private Long id;
        private Long employeeId;
        private String employeeName;
        private Short roleId;
        private RoleCode roleCode;
        private String roleName;
        private String login;
        private Boolean isActive;
        private Instant lastLoginAt;
        private Instant createdAt;
    }
}
