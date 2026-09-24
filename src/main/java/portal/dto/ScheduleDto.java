package portal.dto;

import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

public class ScheduleDto {

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Request {
        @NotNull(message = "ID филиала обязателен")
        private Long branchId;

        @NotNull(message = "Дата начала обязательна")
        private LocalDate dateFrom;

        @NotNull(message = "Дата окончания обязательна")
        private LocalDate dateTo;

        private Long createdById;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Response {
        private Long id;
        private Long branchId;
        private String branchName;
        private LocalDate dateFrom;
        private LocalDate dateTo;
        private Long createdById;
        private String createdByName;
        private Instant createdAt;
        private Instant updatedAt;
    }
}
