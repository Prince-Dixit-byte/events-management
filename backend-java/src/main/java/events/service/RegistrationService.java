package events.service;

import events.dto.RegistrationAttendanceDtos.RegistrationSummaryResponse;
import events.entity.*;
import events.exception.ApiException;
import events.repository.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class RegistrationService {

    private final RegistrationRepository registrationRepository;
    private final EventRepository eventRepository;
    private final UserRepository userRepository;
    private final AttendanceRepository attendanceRepository;
    private final EventService eventService;

    public RegistrationService(
        RegistrationRepository registrationRepository,
        EventRepository eventRepository,
        UserRepository userRepository,
        AttendanceRepository attendanceRepository,
        EventService eventService
    ) {
        this.registrationRepository = registrationRepository;
        this.eventRepository = eventRepository;
        this.userRepository = userRepository;
        this.attendanceRepository = attendanceRepository;
        this.eventService = eventService;
    }

    @Transactional
    public Registration registerStudent(Long studentId, Long eventId) {
        User student = userRepository.findById(studentId)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "NOT_FOUND", "Student account not found."));

        Event event = eventRepository.findById(eventId)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "NOT_FOUND", "Event not found."));

        if (eventService.isEventCompleted(event)) {
            throw new ApiException(
                HttpStatus.BAD_REQUEST,
                "EVENT_COMPLETED",
                "Registration is closed because this event has already completed."
            );
        }

        if (registrationRepository.existsByStudentIdAndEventIdAndRegistrationStatus(
            studentId, eventId, RegistrationStatus.REGISTERED
        )) {
            throw new ApiException(
                HttpStatus.CONFLICT,
                "DUPLICATE_REGISTRATION",
                "You already have an active registration for this event."
            );
        }

        long activeCount = registrationRepository.countByEventIdAndRegistrationStatus(
            eventId, RegistrationStatus.REGISTERED
        );
        if (activeCount >= event.getCapacity()) {
            throw new ApiException(
                HttpStatus.CONFLICT,
                "EVENT_FULL",
                "This event has reached full capacity."
            );
        }

        Registration registration = new Registration();
        registration.setStudent(student);
        registration.setEvent(event);
        registration.setRegistrationStatus(RegistrationStatus.REGISTERED);
        return registrationRepository.save(registration);
    }

    @Transactional
    public void cancelRegistration(Long studentId, Long eventId) {
        Registration registration = registrationRepository
            .findByStudentIdAndEventIdAndRegistrationStatus(studentId, eventId, RegistrationStatus.REGISTERED)
            .orElseThrow(() -> new ApiException(
                HttpStatus.NOT_FOUND,
                "REGISTRATION_NOT_FOUND",
                "No active registration found for this student and event."
            ));

        if (eventService.isEventCompleted(registration.getEvent())) {
            throw new ApiException(
                HttpStatus.BAD_REQUEST,
                "EVENT_COMPLETED",
                "Cannot cancel registration after an event has completed."
            );
        }

        registration.setRegistrationStatus(RegistrationStatus.CANCELLED);
        registrationRepository.save(registration);
    }

    @Transactional(readOnly = true)
    public List<RegistrationSummaryResponse> getMyRegistrations(Long studentId) {
        return registrationRepository.findByStudentIdOrderByRegistrationDateDesc(studentId).stream()
            .map(reg -> {
                Event event = reg.getEvent();
                var attendanceOpt = attendanceRepository.findByRegistrationId(reg.getId());
                return new RegistrationSummaryResponse(
                    reg.getId(),
                    event.getId(),
                    reg.getRegistrationDate(),
                    reg.getRegistrationStatus(),
                    event.getTitle(),
                    event.getDescription(),
                    event.getLocation(),
                    event.getEventDate(),
                    event.getStartTime(),
                    event.getEndTime(),
                    event.getCapacity(),
                    event.getCategory(),
                    attendanceOpt.map(a -> a.getAttendanceStatus().name()).orElse("UNMARKED"),
                    attendanceOpt.map(Attendance::getMarkedAt).orElse(null),
                    eventService.isEventCompleted(event)
                );
            })
            .toList();
    }
}
