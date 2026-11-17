package events.dto;

import events.entity.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.Instant;

public class AuthDtos {

    public record RegisterRequest(
        @NotBlank(message = "Full name is required.")
        @Size(min = 2, message = "Full name must be at least 2 characters.")
        String name,

        @NotBlank(message = "Email is required.")
        @Email(message = "Valid email address is required.")
        String email,

        @NotBlank(message = "Password is required.")
        @Size(min = 6, message = "Password must be at least 6 characters.")
        String password,

        String department
    ) {}

    public record LoginRequest(
        @NotBlank(message = "Email is required.")
        String email,

        @NotBlank(message = "Password is required.")
        String password
    ) {}

    public record UserResponse(
        Long id,
        String name,
        String email,
        Role role,
        String department,
        Instant createdAt
    ) {}

    public record AuthResponse(
        String token,
        UserResponse user,
        String message
    ) {}
}
