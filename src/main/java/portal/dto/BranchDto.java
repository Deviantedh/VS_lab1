package portal.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import io.swagger.v3.oas.annotations.media.Schema;
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
        @Schema(description = "ID компании", example = "1")
        private Long companyId;

        @NotBlank(message = "Название филиала не может быть пустым")
        @Size(max = 255, message = "Название филиала не может превышать 255 символов")
        @JsonAlias({"title"})
        @Schema(description = "Название филиала", example = "Филиал на Петроградской")
        private String name;

        @NotBlank(message = "Адрес филиала обязателен")
        @Size(max = 500, message = "Адрес филиала не может превышать 500 символов")
        @Schema(description = "Адрес филиала", example = "Каменноостровский пр., 12")
        private String address;

        @Size(max = 50, message = "Телефон не может превышать 50 символов")
        @Schema(description = "Телефон филиала", example = "+78121112233")
        private String phone;

        @Schema(description = "Активен ли филиал", example = "true")
        private Boolean isActive;
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
        private Long companyId;
        @Schema(example = "Сеть городских заведений")
        private String companyName;
        @Schema(example = "Филиал на Петроградской")
        private String name;
        @Schema(example = "Каменноостровский пр., 12")
        private String address;
        @Schema(example = "+78121112233")
        private String phone;
        @Schema(example = "true")
        private Boolean isActive;
        private Instant createdAt;
        private Instant updatedAt;
    }
}
