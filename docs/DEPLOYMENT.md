# Deployment Guide

This guide deploys the existing React application from `frontend/` to Vercel and the Spring Boot application from `backend-java/` to Render. Production uses PostgreSQL; local development keeps SQLite.

## Deployment Layout

- Vercel project root: `frontend`
- Build command: `npm run build`
- Output directory: `dist`
- Render service: Docker, rooted at `backend-java`
- Spring health check: `/api/health`
- Production API base URL: `https://<render-service>.onrender.com/api`
- Runtime timezone: `Asia/Kolkata`, matching existing event date/time data and lifecycle calculations

The repository also has a separate Node/Express preview runtime at its root. Do not select it for this deployment.

## 1. Create PostgreSQL

Create a PostgreSQL database with Neon or Render PostgreSQL. For Render, keep the database and web service in the same region; the deployed app should use the database's internal hostname. A migration run from your laptop must use the provider's external connection endpoint (and any required IP allowlisting), because Render's internal hostname is not publicly reachable. For Neon, use the pooled or direct connection information as appropriate for the account.

Record the host, port, database name, username, and password. Do not commit these values. Configure `DB_SSL_MODE=require` for Neon; Render's PostgreSQL connection mode can also use `require` unless its dashboard specifies otherwise.

The production Spring profile uses these environment variables:

- `DB_HOST`
- `DB_PORT` (defaults to `5432`)
- `DB_NAME`
- `DB_USERNAME`
- `DB_PASSWORD`
- `DB_SSL_MODE` (defaults to `disable` in Spring; set explicitly for the selected provider)
- `SPRING_PROFILES_ACTIVE=prod`
- `JWT_SECRET` (at least 32 random characters; the Render Blueprint generates one)
- `APP_CORS_ALLOWED_ORIGINS` (comma-separated exact origins, without a trailing slash)

## 2. Migrate the Existing SQLite Data

The inspected source file is `database/database.sqlite`. It currently contains 3 users, 1 event, 0 registrations, and 0 attendance records. The migration tool does not update that file. It copies BCrypt hashes as-is, preserves primary-key IDs, creates PostgreSQL foreign keys and the active-registration index, checks row counts/references, and advances generated-ID sequences.

The source stores `LocalDate` and `LocalTime` values as epoch milliseconds in `Asia/Kolkata`. The tool defaults to that timezone; override it only if the SQLite database was originally written in a different timezone.

Run the import from the repository root against a newly created, empty PostgreSQL database. The importer refuses to merge into populated application tables. For a Render database, use its external connection endpoint temporarily for the import, then configure the Render app with the internal hostname. Run the import before starting the Render service, because application startup seeds demo rows when the database has no users or events.

```sh
python3 -m venv .venv-migration
. .venv-migration/bin/activate
pip install -r scripts/requirements-migration.txt

# Set DB_HOST to the provider's externally reachable migration host, plus
# DB_PORT, DB_NAME, DB_USERNAME, DB_PASSWORD, and DB_SSL_MODE in this shell.
# Do not commit credentials or put them in a .env file.
python3 scripts/migrate_sqlite_to_postgres.py --dry-run
python3 scripts/migrate_sqlite_to_postgres.py
```

The dry run verifies and summarizes the SQLite source without contacting PostgreSQL. The import is one PostgreSQL transaction; a failure rolls it back. Re-running the exact same source snapshot is a no-op. The source database is opened read-only.

After import, verify the reported per-table counts and ensure the script reports successful foreign-key validation. Keep a backup of the PostgreSQL database before later data migrations.

**Production credential warning:** the existing project documents default demo account passwords in the README, and those account hashes are included in the SQLite database. The import intentionally preserves those hashes. Change or disable those demo credentials through a secure account-administration process before exposing the service publicly; the current app does not provide a password-change endpoint.

## 3. Deploy the Backend to Render

The repository includes `render.yaml` and `backend-java/Dockerfile`. The Docker image builds with Maven and Java 21. Render supplies `PORT`; locally the backend defaults to port `5001` and binds to `0.0.0.0`.

1. Push the repository to a Git provider connected to Render.
2. In Render, create a Blueprint from the repository and review `render.yaml`. The configured web service uses the `starter` plan; confirm the plan and its price before applying it.
3. Set `DB_HOST`, `DB_NAME`, `DB_USERNAME`, and `DB_PASSWORD` from the PostgreSQL provider. Keep `DB_PORT=5432` unless the provider specifies another port. Set `DB_SSL_MODE` as required.
4. Confirm `SPRING_PROFILES_ACTIVE=prod`, `APP_DATABASE_TYPE=PostgreSQL`, and a generated `JWT_SECRET` are present. Do not use the example local JWT secret in production.
5. Set `APP_CORS_ALLOWED_ORIGINS` to the final Vercel origin, for example `https://your-project.vercel.app`. Add a custom domain as another comma-separated exact origin if needed. Do not use `*` with credentials.
6. Deploy. Wait for `/api/health` to pass the Render health check. Confirm the response reports `"database":"PostgreSQL"`.

If the database has not been migrated, first create a clean PostgreSQL database and test its connection/schema initialization with the migration tool, or deliberately deploy to an empty database and confirm Hibernate initialization. Do not start the service against the target database before importing existing data.

## 4. Deploy the Frontend to Vercel

1. Import the same repository into Vercel.
2. Set **Root Directory** to `frontend`.
3. Select Vite (or allow framework detection), set **Build Command** to `npm run build`, and **Output Directory** to `dist`.
4. Add the production environment variable `VITE_API_BASE_URL` with the full Render API root, such as `https://your-render-service.onrender.com/api`. Vite variables are public; this value must contain no credentials or secrets.
5. Deploy and note the exact production origin (`https://...vercel.app` or your custom domain).
6. Add that origin to the Render `APP_CORS_ALLOWED_ORIGINS` value and redeploy/restart the backend if needed.

`frontend/vercel.json` sends nested frontend routes to `index.html`, so routes such as `/events/1` and `/student/dashboard` can be refreshed directly. In local development, leave `VITE_API_BASE_URL` unset: Axios uses `/api` and Vite proxies it to `http://localhost:5001` on port `5173`.

## 5. Verify the Live Deployment

Replace the hostnames with the deployed origins:

```sh
curl -i https://your-render-service.onrender.com/api/health
curl -i https://your-render-service.onrender.com/api/events
curl -i -X OPTIONS https://your-render-service.onrender.com/api/auth/login \
  -H 'Origin: https://your-project.vercel.app' \
  -H 'Access-Control-Request-Method: POST' \
  -H 'Access-Control-Request-Headers: authorization,content-type'
```

The health/events requests should return `200`; the preflight should return `200` or `204` and include the exact Vercel origin in `Access-Control-Allow-Origin`. Then use the deployed frontend to test registration/login, event listing, a student registration, and the admin/faculty workflows. Confirm requests carry `Authorization: Bearer ...`; verify an unauthenticated protected request is rejected and a student cannot create an event.

## 6. Logs and Troubleshooting

- Render: open the service, select **Logs**, and inspect startup output for profile, database connection, Hibernate DDL, and authentication errors. Do not paste credentials into logs or issue reports.
- Vercel: open the project deployment and inspect **Build Logs**. Confirm the configured root is `frontend` and `VITE_API_BASE_URL` is set for the Production environment.
- CORS failures: check the browser's exact `Origin` against `APP_CORS_ALLOWED_ORIGINS`; scheme, hostname, and port must match.
- PostgreSQL connection failures: verify host, port, database, user, password, SSL mode, network access, and that Render is using the `prod` profile.
- A `404` after refreshing a nested route: verify `frontend/vercel.json` is deployed and the Vercel root directory is `frontend`.
- A `401`/`403`: distinguish expected role restrictions from expired/invalid JWTs; do not make endpoints public to work around an authorization response.

## Local Commands

```sh
cd backend-java && mvn clean verify
cd ../frontend && npm install && npm run build
```

For local runtime, run `mvn spring-boot:run` from `backend-java/`, and `npm run dev` from `frontend/`. The backend defaults to `5001`; Vite uses `5173` and proxies `/api` to the backend.
