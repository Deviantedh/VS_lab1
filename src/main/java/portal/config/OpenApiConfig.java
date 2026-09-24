package portal.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Corporate Portal & Self-Service API")
                        .version("1.0.0")
                        .description("REST API корпоративного портала и системы самообслуживания сотрудников сети кофеен/пекарен (Лабораторная работа №1)")
                        .contact(new Contact()
                                .name("Dev Team")
                                .email("support@portal.local")));
    }
}
