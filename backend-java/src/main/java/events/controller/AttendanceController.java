package events.controller;

import events.dto.RegistrationAttendanceDtos.AttendanceMarkRequest;
import events.dto.RegistrationAttendanceDtos.ParticipantRecordResponse;
import events.entity.RegistrationStatus;
import events.entity.User;
import events.exception.ApiException;
import events.repository.RegistrationRepository;
import events.repository.UserRepository;
import events.service.AttendanceService;
import events.service.EventService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/attendance")
@PreAuthorize("hasAnyRole('ADMIN', 'FACULTY')")
public class AttendanceController {

    private final AttendanceService attendanceService;
    private final EventService eventService;
    private final RegistrationRepository registrationRepository;
    private final UserRepository userRepository;

    public AttendanceController(
        AttendanceService attendanceService,
        EventService eventService,
        RegistrationRepository registrationRepository,
        UserRepository userRepository
    ) {
        this.attendanceService = attendanceService;
        this.eventService = eventService;
        this.registrationRepository = registrationRepository;
        this.userRepository = userRepository;
    }

    @GetMapping("/event/{eventId}")
    public ResponseEntity<Map<String, Object>> getEventRoster(@PathVariable Long eventId) {
        var event = eventService.getEvent(eventId, null);
        var participants = attendanceService.getEventRoster(eventId);
        long cancelledCount = registrationRepository.countByEventIdAndRegistrationStatus(
            eventId, RegistrationStatus.CANCELLED
        );
        return ResponseEntity.ok(Map.of(
            "event", event,
            "participants", participants,
            "cancelledCount", cancelledCount
        ));
    }

    @PutMapping("/{registrationId}")
    public ResponseEntity<Map<String, Object>> markAttendance(
        @PathVariable Long registrationId,
        @Valid @RequestBody AttendanceMarkRequest request,
        Authentication authentication
    ) {
        User marker = userRepository.findByEmail(authentication.getName())
            .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "User not found."));

        ParticipantRecordResponse record = attendanceService.markAttendance(
            registrationId,
            request.attendanceStatus(),
            marker.getId()
        );
        return ResponseEntity.ok(Map.of(
            "record", record,
            "message", "Attendance updated to " + request.attendanceStatus().name() + "."
        ));
    }
}
