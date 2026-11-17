package events;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.time.LocalDate;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class CollegeEventApiIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private String loginAndGetToken(String email, String password) throws Exception {
        String payload = objectMapper.writeValueAsString(
            java.util.Map.of("email", email, "password", password)
        );
        MvcResult result = mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(payload))
            .andExpect(status().isOk())
            .andReturn();
        JsonNode root = objectMapper.readTree(result.getResponse().getContentAsString());
        return root.get("token").asText();
    }

    @Test
    void fullWorkflowIntegrationTest() throws Exception {
        // 1. Student registration (must force STUDENT role)
        String regBody = """
            {
              "name": "Meera Krishnan",
              "email": "meera.test@college.edu",
              "password": "Password@123",
              "department": "CSE"
            }
            """;
        MvcResult regRes = mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(regBody))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.user.role").value("STUDENT"))
            .andReturn();
        String studentToken = objectMapper.readTree(regRes.getResponse().getContentAsString())
            .get("token").asText();

        // 2. Invalid login rejected
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"admin@college.edu\",\"password\":\"wrong\"}"))
            .andExpect(status().isUnauthorized());

        // 3. Admin and Faculty login
        String adminToken = loginAndGetToken("admin@college.edu", "Admin@123");
        String facultyToken = loginAndGetToken("faculty@college.edu", "Faculty@123");
        String secondStudentToken = loginAndGetToken("arjun.sharma@college.edu", "Student@123");

        // 4. Role-based authorization prevents Student from creating events
        String eventDate = LocalDate.now().plusDays(10).toString();
        String createEventPayload = String.format("""
            {
              "title": "Spring Security Lab",
              "description": "JWT and BCrypt workshop",
              "location": "Lab 301",
              "eventDate": "%s",
              "startTime": "10:00",
              "endTime": "12:00",
              "capacity": 1,
              "category": "Workshop"
            }
            """, eventDate);

        mockMvc.perform(post("/api/events")
                .header("Authorization", "Bearer " + studentToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(createEventPayload))
            .andExpect(status().isForbidden());

        // 5. Admin creates event
        MvcResult createRes = mockMvc.perform(post("/api/events")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(createEventPayload))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.event.capacity").value(1))
            .andReturn();
        long eventId = objectMapper.readTree(createRes.getResponse().getContentAsString())
            .get("event").get("id").asLong();

        // 6. Admin updates event
        String updatePayload = String.format("""
            {
              "title": "Spring Security Lab Updated",
              "description": "JWT and BCrypt workshop",
              "location": "Lab 302",
              "eventDate": "%s",
              "startTime": "10:00",
              "endTime": "13:00",
              "capacity": 1,
              "category": "Workshop"
            }
            """, eventDate);
        mockMvc.perform(put("/api/events/" + eventId)
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(updatePayload))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.event.title").value("Spring Security Lab Updated"));

        // 7. Student registers successfully
        MvcResult r1 = mockMvc.perform(post("/api/registrations/" + eventId)
                .header("Authorization", "Bearer " + studentToken))
            .andExpect(status().isCreated())
            .andReturn();
        long registrationId = objectMapper.readTree(r1.getResponse().getContentAsString())
            .get("registrationId").asLong();

        // 8. Duplicate registration rejected
        mockMvc.perform(post("/api/registrations/" + eventId)
                .header("Authorization", "Bearer " + studentToken))
            .andExpect(status().isConflict());

        // 9. Full capacity rejects second student
        mockMvc.perform(post("/api/registrations/" + eventId)
                .header("Authorization", "Bearer " + secondStudentToken))
            .andExpect(status().isConflict());

        // 10. Faculty marks attendance and checks participation report
        mockMvc.perform(put("/api/attendance/" + registrationId)
                .header("Authorization", "Bearer " + facultyToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"attendanceStatus\":\"PRESENT\"}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.record.attendanceStatus").value("PRESENT"));

        mockMvc.perform(get("/api/reports/event/" + eventId)
                .header("Authorization", "Bearer " + facultyToken))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.report.activeRegistrations").value(1))
            .andExpect(jsonPath("$.report.presentCount").value(1))
            .andExpect(jsonPath("$.report.capacityUtilization").value(100.0));

        // 11. Student cancels registration, freeing capacity for second student
        mockMvc.perform(delete("/api/registrations/" + eventId)
                .header("Authorization", "Bearer " + studentToken))
            .andExpect(status().isOk());

        mockMvc.perform(post("/api/registrations/" + eventId)
                .header("Authorization", "Bearer " + secondStudentToken))
            .andExpect(status().isCreated());

        // 12. Admin deletes event
        mockMvc.perform(delete("/api/events/" + eventId)
                .header("Authorization", "Bearer " + adminToken))
            .andExpect(status().isOk());

        assertTrue(eventId > 0);
    }
}
