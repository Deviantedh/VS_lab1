package portal.dto;

import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.Instant;

public class AttendanceRecordDto {

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Request {
        @NotNull(message = "ID сотрудника обязателен")
        private Long employeeId;

        private Long shiftId;

        @NotNull(message = "Плановое время начала обязательно")
        private Instant plannedStart;

        @NotNull(message = "Плановое время окончания обязательно")
        private Instant plannedEnd;

        private Instant actualStart;
        private Instant actualEnd;
        private Integer breakMinutes;
        private String comment;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CheckInRequest {
        @NotNull(message = "ID сотрудника обязателен")
        private Long employeeId;

        private Long shiftId;
        private String comment;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CheckOutRequest {
        private Integer breakMinutes;
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
        private Long shiftId;
        private Instant plannedStart;
        private Instant plannedEnd;
        private Instant actualStart;
        private Instant actualEnd;
        private Integer breakMinutes;
        private String comment;
        private Long lateMinutes;
        private Long overtimeMinutes;
        private Instant createdAt;
        private Instant updatedAt;
    }
}
