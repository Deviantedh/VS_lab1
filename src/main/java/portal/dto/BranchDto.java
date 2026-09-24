package portal.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.time.Instant;

public class BranchDto {

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Request {
        @NotNull(message = "ID компании обязателен")
        private Long companyId;

        @NotBlank(message = "Название филиала не может быть пустым")
        @Size(max = 255, message = "Название филиала не может превышать 255 символов")
        private String name;

        @NotBlank(message = "Адрес филиала обязателен")
        @Size(max = 500, message = "Адрес филиала не может превышать 500 символов")
        private String address;

        @Size(max = 20, message = "Телефон не может превышать 20 символов")
        private String phone;

        private Boolean isActive;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Response {
        private Long id;
        private Long companyId;
        private String companyName;
        private String name;
        private String address;
        private String phone;
        private Boolean isActive;
        private Instant createdAt;
        private Instant updatedAt;
    }
}
