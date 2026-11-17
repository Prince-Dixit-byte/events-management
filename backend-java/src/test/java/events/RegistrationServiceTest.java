package events;

import events.entity.*;
import events.exception.ApiException;
import events.repository.*;
import events.service.EventService;
import events.service.RegistrationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RegistrationServiceTest {

    @Mock private RegistrationRepository registrationRepository;
    @Mock private EventRepository eventRepository;
    @Mock private UserRepository userRepository;
    @Mock private AttendanceRepository attendanceRepository;
    @Mock private EventService eventService;

    @InjectMocks
    private RegistrationService registrationService;

    private User student;
    private Event event;

    @BeforeEach
    void setUp() {
        student = new User();
        student.setId(10L);
        student.setName("Arjun Sharma");
        student.setRole(Role.STUDENT);

        event = new Event();
        event.setId(5L);
        event.setTitle("Systems Lab");
        event.setCapacity(2);
        event.setEventDate(LocalDate.now().plusDays(5));
        event.setStartTime(LocalTime.of(10, 0));
        event.setEndTime(LocalTime.of(12, 0));
    }

    @Test
    void ut01_shouldAcceptValidRegistration() {
        when(userRepository.findById(10L)).thenReturn(Optional.of(student));
        when(eventRepository.findById(5L)).thenReturn(Optional.of(event));
        when(eventService.isEventCompleted(event)).thenReturn(false);
        when(registrationRepository.existsByStudentIdAndEventIdAndRegistrationStatus(10L, 5L, RegistrationStatus.REGISTERED))
            .thenReturn(false);
        when(registrationRepository.countByEventIdAndRegistrationStatus(5L, RegistrationStatus.REGISTERED))
            .thenReturn(1L);
        when(registrationRepository.save(any(Registration.class))).thenAnswer(inv -> {
            Registration reg = inv.getArgument(0);
            reg.setId(99L);
            return reg;
        });

        Registration result = registrationService.registerStudent(10L, 5L);
        assertEquals(99L, result.getId());
        assertEquals(RegistrationStatus.REGISTERED, result.getRegistrationStatus());
    }

    @Test
    void ut02_shouldRejectDuplicateRegistration() {
        when(userRepository.findById(10L)).thenReturn(Optional.of(student));
        when(eventRepository.findById(5L)).thenReturn(Optional.of(event));
        when(eventService.isEventCompleted(event)).thenReturn(false);
        when(registrationRepository.existsByStudentIdAndEventIdAndRegistrationStatus(10L, 5L, RegistrationStatus.REGISTERED))
            .thenReturn(true);

        ApiException ex = assertThrows(ApiException.class, () -> registrationService.registerStudent(10L, 5L));
        assertEquals("DUPLICATE_REGISTRATION", ex.getCode());
        verify(registrationRepository, never()).save(any());
    }

    @Test
    void ut03_shouldRejectFullCapacityEvent() {
        when(userRepository.findById(10L)).thenReturn(Optional.of(student));
        when(eventRepository.findById(5L)).thenReturn(Optional.of(event));
        when(eventService.isEventCompleted(event)).thenReturn(false);
        when(registrationRepository.existsByStudentIdAndEventIdAndRegistrationStatus(10L, 5L, RegistrationStatus.REGISTERED))
            .thenReturn(false);
        when(registrationRepository.countByEventIdAndRegistrationStatus(5L, RegistrationStatus.REGISTERED))
            .thenReturn(2L);

        ApiException ex = assertThrows(ApiException.class, () -> registrationService.registerStudent(10L, 5L));
        assertEquals("EVENT_FULL", ex.getCode());
        verify(registrationRepository, never()).save(any());
    }
}
