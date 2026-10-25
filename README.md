# Smart Campus Complaint System

Students report campus problems (hostel, canteen, IT, infrastructure...) and track them from
submitted to resolved. Admins review every complaint, update its status and reply to the student.

- **Frontend:** HTML, CSS, vanilla JavaScript (`frontend/`)
- **Backend:** Java 17, Spring Boot 3.2, Spring Security + JWT (`backend/`)
- **Database:** MongoDB (collections: `users`, `complaints`)

## Requirements
- JDK 17+
- Maven 3.8+ (or open `backend/` in IntelliJ / Eclipse / VS Code)
- MongoDB running on `localhost:27017` (or a MongoDB Atlas URI)

## Run

1. Start MongoDB.
2. (Optional) Set `ADMIN_REGISTRATION_CODE` in your environment. Admin account creation requires this code; if unset, admin registration is disabled. On Windows PowerShell:
   ```
   $env:ADMIN_REGISTRATION_CODE = "choose-a-private-code"
   ```
3. Start the backend:
   ```
   cd backend
   mvn spring-boot:run
   ```
   API runs at http://localhost:8080. No demo admin account is created automatically.
4. Start the frontend (any static server):
   ```
   cd frontend
   python -m http.server 5500
   ```
   Open http://localhost:5500. (VS Code "Live Server" also works.)

### Run the backend with Docker

From the project root, build and run the backend image:

```
docker build -t smart-campus-backend ./backend
docker run --rm -p 8080:8080 -e SPRING_DATA_MONGODB_URI=mongodb://host.docker.internal:27017/smart_campus smart-campus-backend
```

This assumes MongoDB is running on the host at port 27017. The containerized backend is available at http://localhost:8080.

If the backend uses another host or port, edit `frontend/js/config.js`.

## Using it
- Click **Create account** to register as a student, or select **Admin** and enter the configured admin registration code.
- Log in with the account you created. Admins can review complaints, filter/search, and change status with a reply.

## API

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| POST | `/api/auth/register` | public | Create student account; admin registration requires the configured code |
| POST | `/api/auth/login` | public | Log in, returns JWT |
| POST | `/api/complaints` | logged in | Submit complaint |
| GET | `/api/complaints/my` | logged in | My complaints |
| GET | `/api/complaints/{id}` | owner or admin | One complaint |
| DELETE | `/api/complaints/{id}` | owner (pending only) or admin | Withdraw complaint |
| GET | `/api/admin/complaints?status=&category=` | admin | All complaints |
| PUT | `/api/admin/complaints/{id}/status` | admin | Update status and reply |
| GET | `/api/admin/stats` | admin | Counts by status and category |

Send the token as `Authorization: Bearer <token>`.

## Configuration (`backend/src/main/resources/application.properties`)
- `spring.data.mongodb.uri` — MongoDB connection string
- `app.jwt.secret` — JWT signing secret (32+ characters; change before deploying)
- `app.admin.registration-code` / `ADMIN_REGISTRATION_CODE` — optional code required for admin registration; unset means admin registrations are disabled

## Project layout
```
smart-campus-complaint-system/
├── backend/
│   ├── pom.xml
│   └── src/main/java/com/campus/complaint/
│       ├── config/ controller/ dto/ exception/ model/ repository/ security/ service/
└── frontend/
    ├── index.html  student.html  admin.html
    ├── css/style.css
    └── js/ config.js api.js auth.js student.js admin.js
```
