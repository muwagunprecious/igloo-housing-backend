# Running Backend Locally

The backend has been configured to run **locally only** (removed from Vercel deployment).

## Prerequisites

1. **Node.js** installed (v16 or higher)
2. **Database** configured (Supabase/PostgreSQL)
3. **Environment variables** set in `.env` file

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Database

```bash
# Generate Prisma Client
npm run db:generate

# Push schema to database (for development)
npm run db:push

# OR run migrations (for production)
npm run db:migrate
```

### 3. Seed Database (Optional)

```bash
# Seed admin user
npm run db:seed

# Seed all data (universities, properties, etc.)
npm run seed:all
```

### 4. Start the Server

**Development mode (with auto-reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

The server will start on `http://localhost:5000` (or the PORT specified in your `.env` file).

## Environment Variables

Ensure your `.env` file contains the following variables:

```env
# Database
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# Server
PORT=5000
NODE_ENV=development

# JWT Secret
JWT_SECRET="your-secret-key"

# Client URL (for CORS)
CLIENT_URL="http://localhost:3000"
```

## Verifying the Server

Once the server is running, you can verify it's working by visiting:
- **Health check:** http://localhost:5000/health

You should see a JSON response like:
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2026-01-12T12:00:00.000Z"
}
```

## Available Scripts

- `npm run dev` - Start development server with nodemon (auto-reload)
- `npm start` - Start production server
- `npm run db:generate` - Generate Prisma Client
- `npm run db:migrate` - Run database migrations
- `npm run db:push` - Push schema to database (development)
- `npm run db:studio` - Open Prisma Studio (database GUI)
- `npm run db:seed` - Seed admin user
- `npm run seed:all` - Seed all data

## API Endpoints

The backend provides the following API routes:

- `/api/auth` - Authentication (login, register)
- `/api/user` - User management
- `/api/admin` - Admin operations
- `/api/properties` - Property listings
- `/api/chat` - Real-time chat
- `/api/roommate` - Roommate matching
- `/api/university` - University data
- `/api/agents` - Agent management
- `/api/notifications` - Notifications

## WebSocket (Socket.io)

Real-time features are enabled via Socket.io on the same port as the HTTP server.

- **Chat messages**
- **Typing indicators**
- **Read receipts**
- **Notifications**

## Troubleshooting

### Port already in use
If you get an error that the port is already in use:
```bash
# Find process using port 5000
netstat -ano | findstr :5000

# Kill the process (replace PID with the actual process ID)
taskkill /PID <PID> /F
```

### Database connection errors
1. Verify your `DATABASE_URL` in `.env` is correct
2. Ensure your database is running and accessible
3. Try running `npm run db:push` to sync the schema

### Module not found errors
```bash
# Clear node_modules and reinstall
Remove-Item -Recurse -Force node_modules
npm install
```

## Notes

- The backend is configured to run **locally only** and will **not** be deployed to Vercel
- The `vercel.json` and `api/` directory have been removed
- These files are now in `.gitignore` to prevent accidental re-upload
- Make sure your frontend is configured to connect to `http://localhost:5000` (or your local backend URL)
