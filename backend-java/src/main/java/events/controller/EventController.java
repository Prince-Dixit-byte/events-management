package events.controller;

import events.dto.EventDtos.EventRequest;
import events.dto.EventDtos.EventResponse;
import events.entity.Role;
import events.entity.User;
import events.repository.UserRepository;
import events.service.EventService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/events")
public class EventController {

    private final EventService eventService;
    private final UserRepository userRepository;

    public EventController(EventService eventService, UserRepository userRepository) {
        this.eventService = eventService;
        this.userRepository = userRepository;
    }

    @GetMapping
    public ResponseEntity<Map<String, List<EventResponse>>> listEvents(
        @RequestParam(required = false) String search,
        @RequestParam(required = false) String category,
        @RequestParam(required = false) String status,
        Authentication authentication
    ) {
        Long studentId = resolveStudentId(authentication);
        List<EventResponse> events = eventService.listEvents(search, category, status, studentId);
        return ResponseEntity.ok(Map.of("events", events));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, EventResponse>> getEvent(
        @PathVariable Long id,
        Authentication authentication
    ) {
        Long studentId = resolveStudentId(authentication);
        return ResponseEntity.ok(Map.of("event", eventService.getEvent(id, studentId)));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> createEvent(@Valid @RequestBody EventRequest request) {
        EventResponse created = eventService.createEvent(request);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(Map.of("event", created, "message", "Event created successfully."));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> updateEvent(
        @PathVariable Long id,
        @Valid @RequestBody EventRequest request
    ) {
        EventResponse updated = eventService.updateEvent(id, request);
        return ResponseEntity.ok(Map.of("event", updated, "message", "Event updated successfully."));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> deleteEvent(@PathVariable Long id) {
        eventService.deleteEvent(id);
        return ResponseEntity.ok(Map.of("message", "Event deleted successfully."));
    }

    private Long resolveStudentId(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return null;
        }
        return userRepository.findByEmail(authentication.getName())
            .filter(u -> u.getRole() == Role.STUDENT)
            .map(User::getId)
            .orElse(null);
    }
}
