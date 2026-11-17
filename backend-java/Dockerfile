FROM maven:3.9.9-eclipse-temurin-21 AS build
WORKDIR /workspace
COPY pom.xml .
COPY src ./src
RUN mvn -B -DskipTests clean package

FROM eclipse-temurin:21-jre
WORKDIR /app
ENV TZ=Asia/Kolkata
COPY --from=build /workspace/target/college-event-management-1.0.0.jar /app/app.jar
EXPOSE 5001
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
