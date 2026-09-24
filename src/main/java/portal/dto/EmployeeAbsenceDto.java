package portal.dto;

import jakarta.validation.constraints.NotNull;
import lombok.*;
import portal.entity.AbsenceType;

import java.time.Instant;
import java.time.LocalDate;

public class EmployeeAbsenceDto {

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Request {
        @NotNull(message = "ID сотрудника обязателен")
        private Long employeeId;

        private Long requestId;

        @NotNull(message = "Тип отсутствия обязателен")
        private AbsenceType type;

        @NotNull(message = "Дата начала обязательна")
        private LocalDate dateFrom;

        @NotNull(message = "Дата окончания обязательна")
        private LocalDate dateTo;

        private String comment;
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
        private Long requestId;
        private AbsenceType type;
        private LocalDate dateFrom;
        private LocalDate dateTo;
        private String comment;
        private Instant createdAt;
    }
}
