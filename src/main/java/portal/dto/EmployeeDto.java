package portal.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.*;
import portal.entity.EmployeeStatus;

import java.time.Instant;
import java.time.LocalDate;

public class EmployeeDto {

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Request {
        @NotBlank(message = "ФИО сотрудника обязательно")
        @Size(max = 255, message = "ФИО не может быть длиннее 255 символов")
        private String name;

        @NotBlank(message = "Номер телефона обязателен")
        @Pattern(regexp = "^\\+?[0-9]{10,15}$", message = "Номер телефона желательно должен быть в формате +7XXXXXXXXXX")
        private String phone;

        private LocalDate birthDate;

        private LocalDate hireDate;

        private EmployeeStatus status;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Response {
        private Long id;
        private String name;
        private String phone;
        private LocalDate birthDate;
        private LocalDate hireDate;
        private LocalDate dismissalDate;
        private EmployeeStatus status;
        private Instant createdAt;
        private Instant updatedAt;
    }
}
