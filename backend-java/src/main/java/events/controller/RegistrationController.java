package events.controller;

import events.dto.RegistrationAttendanceDtos.RegistrationSummaryResponse;
import events.entity.Registration;
import events.entity.User;
import events.exception.ApiException;
import events.repository.UserRepository;
import events.service.RegistrationService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/registrations")
@PreAuthorize("hasRole('STUDENT')")
public class RegistrationController {

    private final RegistrationService registrationService;
    private final UserRepository userRepository;

    public RegistrationController(RegistrationService registrationService, UserRepository userRepository) {
        this.registrationService = registrationService;
        this.userRepository = userRepository;
    }

    @PostMapping("/{eventId}")
    public ResponseEntity<Map<String, Object>> register(
        @PathVariable Long eventId,
        Authentication authentication
    ) {
        User student = getAuthenticatedUser(authentication);
        Registration reg = registrationService.registerStudent(student.getId(), eventId);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
            "registrationId", reg.getId(),
            "eventId", eventId,
            "registrationStatus", reg.getRegistrationStatus().name(),
            "message", "Successfully registered for the event."
        ));
    }

    @DeleteMapping("/{eventId}")
    public ResponseEntity<Map<String, String>> cancel(
        @PathVariable Long eventId,
        Authentication authentication
    ) {
        User student = getAuthenticatedUser(authentication);
        registrationService.cancelRegistration(student.getId(), eventId);
        return ResponseEntity.ok(Map.of("message", "Registration cancelled successfully."));
    }

    @GetMapping("/my")
    public ResponseEntity<Map<String, List<RegistrationSummaryResponse>>> myRegistrations(
        Authentication authentication
    ) {
        User student = getAuthenticatedUser(authentication);
        return ResponseEntity.ok(Map.of("registrations", registrationService.getMyRegistrations(student.getId())));
    }

    private User getAuthenticatedUser(Authentication authentication) {
        return userRepository.findByEmail(authentication.getName())
            .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "User not found."));
    }
}
