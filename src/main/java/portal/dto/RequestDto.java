package portal.dto;

import jakarta.validation.constraints.NotNull;
import lombok.*;
import portal.entity.RequestStatus;
import portal.entity.RequestType;

import java.time.Instant;

public class RequestDto {

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Create {
        @NotNull(message = "ID сотрудника обязателен")
        private Long employeeId;

        @NotNull(message = "Тип заявки обязателен")
        private RequestType type;

        private String requestData; // JSON строка с параметрами для всякого
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Process {
        @NotNull(message = "Статус решения обязателен (APPROVED или REJECTED)")
        private RequestStatus status;

        private Long processedById;
        private String resolutionComment;
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
        private RequestType type;
        private RequestStatus status;
        private String requestData;
        private Long processedById;
        private String processedByName;
        private Instant processedAt;
        private String resolutionComment;
        private Instant createdAt;
        private Instant updatedAt;
    }
}
