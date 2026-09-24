package portal.dto;

import lombok.*;
import portal.entity.ShiftAction;

import java.time.Instant;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ShiftEmployeeLogDto {
    private Long id;
    private Long shiftId;
    private Long employeeId;
    private String employeeName;
    private ShiftAction action;
    private Long createdById;
    private String createdByName;
    private Instant createdAt;
}
