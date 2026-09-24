package portal.dto;

import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.Instant;
import java.time.LocalDate;

public class EmployeeAssignmentDto {

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Request {
        @NotNull(message = "ID сотрудника обязателен")
        private Long employeeId;

        @NotNull(message = "ID филиала обязателен")
        private Long branchId;

        @NotNull(message = "ID должности обязателен")
        private Long positionId;

        private LocalDate startedAt;

        private LocalDate endedAt;

        private Boolean isPrimary;
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
        private Long branchId;
        private String branchName;
        private Long positionId;
        private String positionTitle;
        private LocalDate startedAt;
        private LocalDate endedAt;
        private Boolean isPrimary;
        private Instant createdAt;
    }
}
