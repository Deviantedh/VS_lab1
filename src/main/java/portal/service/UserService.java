package portal.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import portal.dto.UserDto;
import portal.entity.Employee;
import portal.entity.Role;
import portal.entity.User;
import portal.exception.BusinessConflictException;
import portal.exception.ResourceNotFoundException;
import portal.repository.RoleRepository;
import portal.repository.UserRepository;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final EmployeeService employeeService;

    @Transactional(readOnly = true)
    public List<UserDto.Response> getAll() {
        return userRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public UserDto.Response getById(Long id) {
        return toResponse(userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Пользователь с ID " + id + " не найден")));
    }

    @Transactional(readOnly = true)
    public UserDto.Response getByLogin(String login) {
        return toResponse(userRepository.findByLogin(login)
                .orElseThrow(() -> new ResourceNotFoundException("Пользователь с логином '" + login + "' не найден")));
    }

    @Transactional
    public UserDto.Response create(UserDto.Request request) {
        String login = request.getLogin().trim();
        if (userRepository.existsByLogin(login)) {
            throw new BusinessConflictException("Логин '" + login + "' уже занят другим сотрудником");
        }

        Role role = roleRepository.findById(request.getRoleId())
                .orElseThrow(() -> new ResourceNotFoundException("Роль с ID " + request.getRoleId() + " не существует (допустимо: 0 - ADMIN, 1 - HR, 2 - MANAGER, 3 - EMPLOYEE)"));

        Employee employee = null;
        if (request.getEmployeeId() != null) {
            employee = employeeService.findEmployeeById(request.getEmployeeId());
        }

        User user = User.builder()
                .login(login)
                .role(role)
                .employee(employee)
                .isActive(true)
                .build();

        return toResponse(userRepository.save(user));
    }

    @Transactional
    public void delete(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Пользователь с ID " + id + " не найден"));
        userRepository.delete(user);
    }

    private UserDto.Response toResponse(User user) {
        return UserDto.Response.builder()
                .id(user.getId())
                .employeeId(user.getEmployee() != null ? user.getEmployee().getId() : null)
                .employeeName(user.getEmployee() != null ? user.getEmployee().getName() : null)
                .roleId(user.getRole().getId())
                .roleCode(user.getRole().getCode())
                .roleName(user.getRole().getName())
                .login(user.getLogin())
                .isActive(user.getIsActive())
                .lastLoginAt(user.getLastLoginAt())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
