ZyrexAi License Server

Backend API untuk sistem lisensi modul ZyrexAi, dibangun menggunakan Node.js dan Express, dengan Supabase PostgreSQL sebagai database.

Features

- Device serial number verification
- License activation and revocation
- Secure admin API using environment secrets
- Supabase PostgreSQL integration
- REST API for Android root modules
- Ready for deployment on Render

Tech Stack

- Node.js
- Express.js
- Supabase PostgreSQL
- Render

API Endpoints

Method| Endpoint| Description
GET| "/health"| Server health check
POST| "/api/license/verify"| Verify device license
POST| "/api/admin/licenses"| Add or activate a license
POST| "/api/admin/licenses/revoke"| Revoke a license

Environment Variables

Configure these variables in the Render dashboard:

- "PORT"
- "SUPABASE_URL"
- "SUPABASE_SERVICE_ROLE_KEY"
- "ADMIN_API_KEY"

Never expose secret keys in public repositories or Android module files.

Deployment

1. Push the server source code to GitHub.
2. Create a new Web Service on Render.
3. Connect this repository.
4. Set the build command to "npm install".
5. Set the start command to "npm start".
6. Configure the required environment variables.
7. Deploy the service and verify "/health".

Security

Device serial numbers should be hashed before storage where possible. Admin endpoints must require authentication. Database access must remain server-side.

License

Private project. All rights reserved.# zyrexai-license-server
