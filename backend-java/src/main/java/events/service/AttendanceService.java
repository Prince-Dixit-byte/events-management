package events.service;

import events.dto.RegistrationAttendanceDtos.ParticipantRecordResponse;
import events.entity.*;
import events.exception.ApiException;
import events.repository.AttendanceRepository;
import events.repository.EventRepository;
import events.repository.RegistrationRepository;
import events.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class AttendanceService {

    private final AttendanceRepository attendanceRepository;
    private final RegistrationRepository registrationRepository;
    private final EventRepository eventRepository;
    private final UserRepository userRepository;

    public AttendanceService(
        AttendanceRepository attendanceRepository,
        RegistrationRepository registrationRepository,
        EventRepository eventRepository,
        UserRepository userRepository
    ) {
        this.attendanceRepository = attendanceRepository;
        this.registrationRepository = registrationRepository;
        this.eventRepository = eventRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<ParticipantRecordResponse> getEventRoster(Long eventId) {
        if (!eventRepository.existsById(eventId)) {
            throw new ApiException(HttpStatus.NOT_FOUND, "NOT_FOUND", "Event not found.");
        }

        return registrationRepository
            .findByEventIdAndRegistrationStatusOrderByStudentNameAsc(eventId, RegistrationStatus.REGISTERED)
            .stream()
            .map(this::toParticipantResponse)
            .toList();
    }

    @Transactional
    public ParticipantRecordResponse markAttendance(Long registrationId, AttendanceStatus status, Long markerId) {
        Registration registration = registrationRepository.findById(registrationId)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "NOT_FOUND", "Registration not found."));

        if (registration.getRegistrationStatus() != RegistrationStatus.REGISTERED) {
            throw new ApiException(
                HttpStatus.BAD_REQUEST,
                "REGISTRATION_CANCELLED",
                "Attendance can only be marked for active registered participants."
            );
        }

        User marker = userRepository.findById(markerId)
            .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "Marker account not found."));

        Attendance attendance = attendanceRepository.findByRegistrationId(registrationId)
            .orElseGet(Attendance::new);
        attendance.setRegistration(registration);
        attendance.setAttendanceStatus(status);
        attendance.setMarkedBy(marker);
        Attendance saved = attendanceRepository.save(attendance);

        return new ParticipantRecordResponse(
            registration.getId(),
            registration.getStudent().getId(),
            registration.getStudent().getName(),
            registration.getStudent().getEmail(),
            registration.getStudent().getDepartment(),
            registration.getRegistrationDate(),
            registration.getRegistrationStatus(),
            saved.getAttendanceStatus().name(),
            saved.getMarkedAt(),
            marker.getName()
        );
    }

    private ParticipantRecordResponse toParticipantResponse(Registration reg) {
        var attendanceOpt = attendanceRepository.findByRegistrationId(reg.getId());
        return new ParticipantRecordResponse(
            reg.getId(),
            reg.getStudent().getId(),
            reg.getStudent().getName(),
            reg.getStudent().getEmail(),
            reg.getStudent().getDepartment(),
            reg.getRegistrationDate(),
            reg.getRegistrationStatus(),
            attendanceOpt.map(a -> a.getAttendanceStatus().name()).orElse("UNMARKED"),
            attendanceOpt.map(Attendance::getMarkedAt).orElse(null),
            attendanceOpt.map(a -> a.getMarkedBy().getName()).orElse(null)
        );
    }
}
