package events.repository;

import events.entity.Registration;
import events.entity.RegistrationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface RegistrationRepository extends JpaRepository<Registration, Long> {
    long countByEventIdAndRegistrationStatus(Long eventId, RegistrationStatus status);

    boolean existsByStudentIdAndEventIdAndRegistrationStatus(
        Long studentId,
        Long eventId,
        RegistrationStatus status
    );

    Optional<Registration> findByStudentIdAndEventIdAndRegistrationStatus(
        Long studentId,
        Long eventId,
        RegistrationStatus status
    );

    Optional<Registration> findTopByStudentIdAndEventIdOrderByIdDesc(Long studentId, Long eventId);

    List<Registration> findByStudentIdOrderByRegistrationDateDesc(Long studentId);

    List<Registration> findByEventIdAndRegistrationStatusOrderByStudentNameAsc(
        Long eventId,
        RegistrationStatus status
    );
}
