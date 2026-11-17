package events.controller;

import events.dto.RegistrationAttendanceDtos.EventParticipationReportResponse;
import events.entity.Role;
import events.entity.User;
import events.exception.ApiException;
import events.repository.UserRepository;
import events.service.AttendanceService;
import events.service.RegistrationService;
import events.service.ReportService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reports")
public class ReportController {

    private final ReportService reportService;
    private final AttendanceService attendanceService;
    private final RegistrationService registrationService;
    private final UserRepository userRepository;

    public ReportController(
        ReportService reportService,
        AttendanceService attendanceService,
        RegistrationService registrationService,
        UserRepository userRepository
    ) {
        this.reportService = reportService;
        this.attendanceService = attendanceService;
        this.registrationService = registrationService;
        this.userRepository = userRepository;
    }

    @GetMapping("/participation")
    @PreAuthorize("hasAnyRole('ADMIN', 'FACULTY')")
    public ResponseEntity<Map<String, Object>> participationSummary() {
        List<EventParticipationReportResponse> events = reportService.getParticipationReports();
        long totalCap = events.stream().mapToLong(EventParticipationReportResponse::capacity).sum();
        long totalActive = events.stream().mapToLong(EventParticipationReportResponse::activeRegistrations).sum();
        long totalCancelled = events.stream().mapToLong(EventParticipationReportResponse::cancelledRegistrations).sum();
        long totalPresent = events.stream().mapToLong(EventParticipationReportResponse::presentCount).sum();
        long totalAbsent = events.stream().mapToLong(EventParticipationReportResponse::absentCount).sum();
        long totalUnmarked = events.stream().mapToLong(EventParticipationReportResponse::unmarkedCount).sum();

        double util = totalCap > 0 ? Math.round(((double) totalActive / totalCap) * 1000.0) / 10.0 : 0.0;
        double att = totalActive > 0 ? Math.round(((double) totalPresent / totalActive) * 1000.0) / 10.0 : 0.0;

        Map<String, Object> summary = new HashMap<>();
        summary.put("totalEvents", events.size());
        summary.put("totalCapacity", totalCap);
        summary.put("totalActiveRegistrations", totalActive);
        summary.put("totalCancelledRegistrations", totalCancelled);
        summary.put("totalPresent", totalPresent);
        summary.put("totalAbsent", totalAbsent);
        summary.put("totalUnmarked", totalUnmarked);
        summary.put("overallCapacityUtilization", util);
        summary.put("overallAttendancePercentage", att);

        return ResponseEntity.ok(Map.of("summary", summary, "events", events));
    }

    @GetMapping("/event/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'FACULTY')")
    public ResponseEntity<Map<String, Object>> eventReport(@PathVariable Long id) {
        return ResponseEntity.ok(Map.of(
            "report", reportService.getEventReport(id),
            "roster", attendanceService.getEventRoster(id)
        ));
    }

    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, Object>> dashboard(Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName())
            .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "User not found."));

        if (user.getRole() == Role.STUDENT) {
            var myRegs = registrationService.getMyRegistrations(user.getId());
            var active = myRegs.stream().filter(r -> r.registrationStatus().name().equals("REGISTERED")).toList();
            var upcoming = active.stream().filter(r -> !r.isCompleted()).toList();
            long present = active.stream().filter(r -> r.attendanceStatus().equals("PRESENT")).count();
            long cancelled = myRegs.size() - active.size();

            Map<String, Object> stats = Map.of(
                "totalRegistrations", active.size(),
                "upcomingRegisteredCount", upcoming.size(),
                "completedEventsCount", active.size() - upcoming.size(),
                "cancelledCount", cancelled,
                "presentCount", present
            );
            return ResponseEntity.ok(Map.of(
                "role", "STUDENT",
                "stats", stats,
                "upcomingEvents", upcoming,
                "recentHistory", myRegs
            ));
        }

        List<EventParticipationReportResponse> events = reportService.getParticipationReports();
        long totalStudents = userRepository.countByRole(Role.STUDENT);
        long totalRegs = events.stream().mapToLong(EventParticipationReportResponse::activeRegistrations).sum();
        long totalCap = events.stream().mapToLong(EventParticipationReportResponse::capacity).sum();
        long totalPresent = events.stream().mapToLong(EventParticipationReportResponse::presentCount).sum();
        long totalAbsent = events.stream().mapToLong(EventParticipationReportResponse::absentCount).sum();
        long totalUnmarked = events.stream().mapToLong(EventParticipationReportResponse::unmarkedCount).sum();
        long upcoming = events.stream().filter(e -> !e.lifecycleStatus().equals("COMPLETED")).count();

        double avgUtil = totalCap > 0 ? Math.round(((double) totalRegs / totalCap) * 1000.0) / 10.0 : 0.0;
        double attRate = totalRegs > 0 ? Math.round(((double) totalPresent / totalRegs) * 1000.0) / 10.0 : 0.0;

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalEvents", events.size());
        stats.put("totalStudents", totalStudents);
        stats.put("totalRegistrations", totalRegs);
        stats.put("upcomingEventsCount", upcoming);
        stats.put("completedEventsCount", events.size() - upcoming);
        stats.put("totalPresent", totalPresent);
        stats.put("totalAbsent", totalAbsent);
        stats.put("totalUnmarked", totalUnmarked);
        stats.put("averageCapacityUtilization", avgUtil);
        stats.put("overallAttendanceRate", attRate);

        return ResponseEntity.ok(Map.of(
            "role", user.getRole().name(),
            "stats", stats,
            "eventBreakdown", events
        ));
    }
}
