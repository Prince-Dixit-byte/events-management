package events.service;

import events.dto.EventDtos.EventRequest;
import events.dto.EventDtos.EventResponse;
import events.entity.Event;
import events.entity.RegistrationStatus;
import events.exception.ApiException;
import events.repository.EventRepository;
import events.repository.RegistrationRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class EventService {

    private final EventRepository eventRepository;
    private final RegistrationRepository registrationRepository;

    public EventService(EventRepository eventRepository, RegistrationRepository registrationRepository) {
        this.eventRepository = eventRepository;
        this.registrationRepository = registrationRepository;
    }

    @Transactional(readOnly = true)
    public List<EventResponse> listEvents(String search, String category, String status, Long studentId) {
        return eventRepository.findAllByOrderByEventDateAscStartTimeAsc().stream()
            .map(event -> mapToResponse(event, studentId))
            .filter(ev -> search == null || search.isBlank() ||
                ev.title().toLowerCase().contains(search.toLowerCase()) ||
                ev.description().toLowerCase().contains(search.toLowerCase()) ||
                ev.location().toLowerCase().contains(search.toLowerCase()))
            .filter(ev -> category == null || category.isBlank() || category.equalsIgnoreCase("ALL") ||
                ev.category().equalsIgnoreCase(category))
            .filter(ev -> status == null || status.isBlank() || status.equalsIgnoreCase("ALL") ||
                ev.lifecycleStatus().equalsIgnoreCase(status))
            .toList();
    }

    @Transactional(readOnly = true)
    public EventResponse getEvent(Long eventId, Long studentId) {
        Event event = eventRepository.findById(eventId)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "NOT_FOUND", "Event not found."));
        return mapToResponse(event, studentId);
    }

    @Transactional
    public EventResponse createEvent(EventRequest request) {
        validateSchedule(request);
        Event event = new Event();
        applyRequest(event, request);
        Event saved = eventRepository.save(event);
        return mapToResponse(saved, null);
    }

    @Transactional
    public EventResponse updateEvent(Long eventId, EventRequest request) {
        validateSchedule(request);
        Event event = eventRepository.findById(eventId)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "NOT_FOUND", "Event not found."));

        long activeRegistrations = registrationRepository.countByEventIdAndRegistrationStatus(
            eventId, RegistrationStatus.REGISTERED
        );
        if (request.capacity() < activeRegistrations) {
            throw new ApiException(
                HttpStatus.BAD_REQUEST,
                "CAPACITY_CONFLICT",
                "Capacity cannot be reduced below active registrations (" + activeRegistrations + ")."
            );
        }

        applyRequest(event, request);
        Event saved = eventRepository.save(event);
        return mapToResponse(saved, null);
    }

    @Transactional
    public void deleteEvent(Long eventId) {
        if (!eventRepository.existsById(eventId)) {
            throw new ApiException(HttpStatus.NOT_FOUND, "NOT_FOUND", "Event not found.");
        }
        eventRepository.deleteById(eventId);
    }

    public boolean isEventCompleted(Event event) {
        return LocalDateTime.of(event.getEventDate(), event.getEndTime()).isBefore(LocalDateTime.now());
    }

    public EventResponse mapToResponse(Event event, Long studentId) {
        long activeCount = registrationRepository.countByEventIdAndRegistrationStatus(
            event.getId(), RegistrationStatus.REGISTERED
        );
        long availableSeats = Math.max(0, event.getCapacity() - activeCount);
        String lifecycle = isEventCompleted(event)
            ? "COMPLETED"
            : (activeCount >= event.getCapacity() ? "FULL" : "OPEN");

        String myStatus = null;
        if (studentId != null) {
            myStatus = registrationRepository.findTopByStudentIdAndEventIdOrderByIdDesc(studentId, event.getId())
                .map(reg -> reg.getRegistrationStatus().name())
                .orElse(null);
        }

        return new EventResponse(
            event.getId(),
            event.getTitle(),
            event.getDescription(),
            event.getLocation(),
            event.getEventDate(),
            event.getStartTime(),
            event.getEndTime(),
            event.getCapacity(),
            event.getCategory(),
            event.getCreatedAt(),
            activeCount,
            availableSeats,
            lifecycle,
            myStatus
        );
    }

    private void validateSchedule(EventRequest request) {
        if (!request.endTime().isAfter(request.startTime())) {
            throw new ApiException(
                HttpStatus.BAD_REQUEST,
                "VALIDATION_ERROR",
                "End time must be strictly after start time."
            );
        }
    }

    private void applyRequest(Event event, EventRequest request) {
        event.setTitle(request.title().trim());
        event.setDescription(request.description().trim());
        event.setLocation(request.location().trim());
        event.setEventDate(request.eventDate());
        event.setStartTime(request.startTime());
        event.setEndTime(request.endTime());
        event.setCapacity(request.capacity());
        event.setCategory(request.category().trim());
    }
}
