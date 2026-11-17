package events.service;

import events.dto.RegistrationAttendanceDtos.EventParticipationReportResponse;
import events.entity.AttendanceStatus;
import events.entity.Event;
import events.entity.Registration;
import events.entity.RegistrationStatus;
import events.exception.ApiException;
import events.repository.AttendanceRepository;
import events.repository.EventRepository;
import events.repository.RegistrationRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ReportService {

    private final EventRepository eventRepository;
    private final RegistrationRepository registrationRepository;
    private final AttendanceRepository attendanceRepository;
    private final EventService eventService;

    public ReportService(
        EventRepository eventRepository,
        RegistrationRepository registrationRepository,
        AttendanceRepository attendanceRepository,
        EventService eventService
    ) {
        this.eventRepository = eventRepository;
        this.registrationRepository = registrationRepository;
        this.attendanceRepository = attendanceRepository;
        this.eventService = eventService;
    }

    @Transactional(readOnly = true)
    public List<EventParticipationReportResponse> getParticipationReports() {
        return eventRepository.findAllByOrderByEventDateAscStartTimeAsc().stream()
            .map(this::buildReportForEvent)
            .toList();
    }

    @Transactional(readOnly = true)
    public EventParticipationReportResponse getEventReport(Long eventId) {
        Event event = eventRepository.findById(eventId)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "NOT_FOUND", "Event not found."));
        return buildReportForEvent(event);
    }

    private EventParticipationReportResponse buildReportForEvent(Event event) {
        List<Registration> activeRegs = registrationRepository
            .findByEventIdAndRegistrationStatusOrderByStudentNameAsc(event.getId(), RegistrationStatus.REGISTERED);
        long activeCount = activeRegs.size();
        long cancelledCount = registrationRepository
            .countByEventIdAndRegistrationStatus(event.getId(), RegistrationStatus.CANCELLED);

        long presentCount = 0;
        long absentCount = 0;
        for (Registration reg : activeRegs) {
            var att = attendanceRepository.findByRegistrationId(reg.getId());
            if (att.isPresent()) {
                if (att.get().getAttendanceStatus() == AttendanceStatus.PRESENT) {
                    presentCount++;
                } else {
                    absentCount++;
                }
            }
        }

        long unmarkedCount = Math.max(0, activeCount - presentCount - absentCount);
        long availableSeats = Math.max(0, event.getCapacity() - activeCount);
        double capacityUtilization = event.getCapacity() > 0
            ? Math.round(((double) activeCount / event.getCapacity()) * 1000.0) / 10.0
            : 0.0;
        double attendancePercentage = activeCount > 0
            ? Math.round(((double) presentCount / activeCount) * 1000.0) / 10.0
            : 0.0;

        String lifecycle = eventService.isEventCompleted(event)
            ? "COMPLETED"
            : (activeCount >= event.getCapacity() ? "FULL" : "OPEN");

        return new EventParticipationReportResponse(
            event.getId(),
            event.getTitle(),
            event.getCategory(),
            event.getLocation(),
            event.getEventDate(),
            event.getStartTime(),
            event.getEndTime(),
            event.getCapacity(),
            activeCount,
            cancelledCount,
            availableSeats,
            presentCount,
            absentCount,
            unmarkedCount,
            capacityUtilization,
            attendancePercentage,
            lifecycle
        );
    }
}
