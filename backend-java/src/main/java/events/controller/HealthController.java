package events.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.Map;

@RestController
@RequestMapping("/api/health")
public class HealthController {

    private final JdbcTemplate jdbcTemplate;
    private final String databaseType;

    public HealthController(
        JdbcTemplate jdbcTemplate,
        @Value("${app.database.type}") String databaseType
    ) {
        this.jdbcTemplate = jdbcTemplate;
        this.databaseType = databaseType;
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> health() {
        jdbcTemplate.queryForObject("SELECT 1", Integer.class);
        return ResponseEntity.ok(Map.of(
            "status", "UP",
            "service", "College Event Management System API",
            "database", databaseType,
            "timestamp", Instant.now().toString()
        ));
    }
}
