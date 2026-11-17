package events.config;

import events.entity.Event;
import events.entity.Role;
import events.entity.User;
import events.repository.EventRepository;
import events.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDate;
import java.time.LocalTime;

@Configuration
public class DataInitializer {

    @Bean
    public CommandLineRunner initializeDatabase(
        UserRepository userRepository,
        EventRepository eventRepository,
        PasswordEncoder passwordEncoder,
        JdbcTemplate jdbcTemplate
    ) {
        return args -> {
            jdbcTemplate.execute(
                "CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_registration " +
                "ON registrations(student_id, event_id) WHERE registration_status = 'REGISTERED'"
            );

            if (userRepository.count() == 0) {
                User admin = new User();
                admin.setName("Dr. Kavita Rao");
                admin.setEmail("admin@college.edu");
                admin.setPasswordHash(passwordEncoder.encode("Admin@123"));
                admin.setRole(Role.ADMIN);
                admin.setDepartment("Office of Student Affairs");
                userRepository.save(admin);

                User faculty = new User();
                faculty.setName("Prof. Rajesh Menon");
                faculty.setEmail("faculty@college.edu");
                faculty.setPasswordHash(passwordEncoder.encode("Faculty@123"));
                faculty.setRole(Role.FACULTY);
                faculty.setDepartment("Computer Science & Engineering");
                userRepository.save(faculty);

                User student = new User();
                student.setName("Arjun Sharma");
                student.setEmail("arjun.sharma@college.edu");
                student.setPasswordHash(passwordEncoder.encode("Student@123"));
                student.setRole(Role.STUDENT);
                student.setDepartment("Computer Science & Engineering");
                userRepository.save(student);
            }

            if (eventRepository.count() == 0) {
                Event symposium = new Event();
                symposium.setTitle("Annual Cloud & Distributed Systems Symposium");
                symposium.setDescription("Keynote and paper presentations on fault-tolerant architectures.");
                symposium.setLocation("Main Auditorium A1, Innovation Hub");
                symposium.setEventDate(LocalDate.now().plusDays(7));
                symposium.setStartTime(LocalTime.of(10, 0));
                symposium.setEndTime(LocalTime.of(13, 0));
                symposium.setCapacity(120);
                symposium.setCategory("Technical");
                eventRepository.save(symposium);
            }
        };
    }
}
