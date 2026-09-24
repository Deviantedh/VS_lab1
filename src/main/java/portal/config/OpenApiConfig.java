package portal.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("REST API Системы управления сотрудниками")
                        .version("1.0.0")
                        .description("REST API Системы управления сотрудниками и учета рабочего времени (Лабораторная работа №1)"));
    }
}
