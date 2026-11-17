package events.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;

public class EventDtos {

    public record EventRequest(
        @NotBlank(message = "Event title cannot be empty.")
        String title,

        @NotBlank(message = "Description cannot be empty.")
        String description,

        @NotBlank(message = "Location cannot be empty.")
        String location,

        @NotNull(message = "Event date is required.")
        LocalDate eventDate,

        @NotNull(message = "Start time is required.")
        LocalTime startTime,

        @NotNull(message = "End time is required.")
        LocalTime endTime,

        @NotNull(message = "Capacity is required.")
        @Min(value = 1, message = "Capacity must be a positive integer.")
        Integer capacity,

        @NotBlank(message = "Category is required.")
        String category
    ) {}

    public record EventResponse(
        Long id,
        String title,
        String description,
        String location,
        LocalDate eventDate,
        LocalTime startTime,
        LocalTime endTime,
        Integer capacity,
        String category,
        Instant createdAt,
        long activeRegistrations,
        long availableSeats,
        String lifecycleStatus,
        String myRegistrationStatus
    ) {}
}
