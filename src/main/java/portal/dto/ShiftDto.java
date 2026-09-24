package portal.dto;

import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

public class ShiftDto {

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Request {
        @NotNull(message = "ID расписания обязателен")
        private Long scheduleId;

        @NotNull(message = "Дата смены обязательна")
        private LocalDate date;

        @NotNull(message = "Время начала обязательно")
        private LocalTime timeFrom;

        @NotNull(message = "Время окончания обязательно")
        private LocalTime timeTo;

        private Integer breakMinutes;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Response {
        private Long id;
        private Long scheduleId;
        private LocalDate date;
        private LocalTime timeFrom;
        private LocalTime timeTo;
        private Integer breakMinutes;
        private List<EmployeeDto.Response> assignedEmployees;
        private Instant createdAt;
        private Instant updatedAt;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AssignEmployeeRequest {
        @NotNull(message = "ID сотрудника обязателен")
        private Long employeeId;

        private Long assignedById;
    }
}
