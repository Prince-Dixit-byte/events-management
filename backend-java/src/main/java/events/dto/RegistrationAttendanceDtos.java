package events.dto;

import events.entity.AttendanceStatus;
import events.entity.RegistrationStatus;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;

public class RegistrationAttendanceDtos {

    public record RegistrationSummaryResponse(
        Long registrationId,
        Long eventId,
        Instant registrationDate,
        RegistrationStatus registrationStatus,
        String eventTitle,
        String eventDescription,
        String eventLocation,
        LocalDate eventDate,
        LocalTime startTime,
        LocalTime endTime,
        Integer capacity,
        String category,
        String attendanceStatus,
        Instant attendanceMarkedAt,
        boolean isCompleted
    ) {}

    public record AttendanceMarkRequest(
        @NotNull(message = "Attendance status is required.")
        AttendanceStatus attendanceStatus
    ) {}

    public record ParticipantRecordResponse(
        Long registrationId,
        Long studentId,
        String studentName,
        String studentEmail,
        String department,
        Instant registrationDate,
        RegistrationStatus registrationStatus,
        String attendanceStatus,
        Instant markedAt,
        String markedByName
    ) {}

    public record EventParticipationReportResponse(
        Long eventId,
        String title,
        String category,
        String location,
        LocalDate eventDate,
        LocalTime startTime,
        LocalTime endTime,
        Integer capacity,
        long activeRegistrations,
        long cancelledRegistrations,
        long availableSeats,
        long presentCount,
        long absentCount,
        long unmarkedCount,
        double capacityUtilization,
        double attendancePercentage,
        String lifecycleStatus
    ) {}
}
