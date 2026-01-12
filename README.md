# Igloo Estate Backend

A complete, production-ready backend for Igloo Estate - A student housing platform with role-based access control.

## 🚀 Features

- **Role-Based Access Control (RBAC)** - Student, Agent, and Admin roles
- **JWT Authentication** - Secure token-based authentication
- **Real-time Chat** - Socket.io powered messaging
- **File Upload** - Multer integration for property images
- **Database** - PostgreSQL with Prisma ORM
- **Validation** - Comprehensive input validation
- **Error Handling** - Global error handler with clean JSON responses

## 👥 User Types

### Student
- Browse properties
- Filter by category, university, price
- Chat with agents
- Send roommate requests
- View request status

### Agent
- Upload properties (after admin verification)
- Manage property listings
- Chat with students
- Accept/reject roommate requests
- View property analytics

### Admin
- Verify agents
- Block/unblock users
- Remove properties
- Manage universities
- View platform statistics
- Monitor all messages
- Track admin actions

## 📋 Prerequisites

- Node.js (v14 or higher)
- PostgreSQL database (Supabase)
- npm or yarn

## 🛠 Installation

1. **Install dependencies**
```bash
cd backend
npm install
```

2. **Set up environment variables**
The `.env` file is already configured with:
```env
DATABASE_URL="postgresql://postgres:Precious2006?@db.mdhjuzpdyffctvkwhkeg.supabase.co:5432/postgres"
JWT_SECRET="SUPER_SECRET_KEY_123"
PORT=5000
NODE_ENV=development
```

3. **Generate Prisma Client**
```bash
npx prisma generate
```

4. **Run database migrations**
```bash
npx prisma migrate dev --name init
```

5. **Start the server**
```bash
npm run dev
```

The server will run on `http://localhost:5000`

## 📁 Project Structure

```
/backend
  /src
    /config
      db.js                      # Database connection
    /controllers
      auth.controller.js         # Authentication endpoints
      user.controller.js         # User profile operations
      admin.controller.js        # Admin panel operations
      property.controller.js     # Property CRUD
      chat.controller.js         # Chat functionality
      roommate.controller.js     # Roommate requests
      university.controller.js   # University management
    /routes
      auth.routes.js            # Auth routes
      user.routes.js            # User routes
      admin.routes.js           # Admin routes
      property.routes.js        # Property routes
      chat.routes.js            # Chat routes
      roommate.routes.js        # Roommate routes
      university.routes.js      # University routes
    /middleware
      auth.middleware.js        # JWT verification
      role.middleware.js        # Role-based access
      error.middleware.js       # Error handling
    /services
      auth.service.js           # Auth business logic
      admin.service.js          # Admin operations
      property.service.js       # Property operations
      chat.service.js           # Chat operations
      roommate.service.js       # Roommate operations
      university.service.js     # University operations
    /utils
      upload.js                 # Multer file upload
      response.js               # Response formatter
      validators.js             # Input validation
  /prisma
    schema.prisma              # Database schema
  /uploads                     # Uploaded files
  .env                         # Environment variables
  server.js                    # Main server file
  package.json                 # Dependencies
```

## 🔑 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update profile
- `PUT /api/auth/password` - Change password

### Properties
- `GET /api/properties` - Get all properties (with filters)
- `GET /api/properties/:id` - Get property by ID
- `POST /api/properties` - Create property (verified agents)
- `PUT /api/properties/:id` - Update property (owner)
- `DELETE /api/properties/:id` - Delete property (owner)
- `GET /api/properties/agent/my-properties` - Get agent's properties

### Chat
- `POST /api/chat/send` - Send message
- `GET /api/chat/conversation/:userId` - Get conversation
- `GET /api/chat/conversations` - Get all conversations
- `GET /api/chat/unread` - Get unread count
- `PUT /api/chat/read` - Mark as read

### Roommate
- `POST /api/roommate/request` - Create request (students)
- `GET /api/roommate/my-requests` - Get user's requests
- `GET /api/roommate/agent/requests` - Get agent's requests
- `PUT /api/roommate/request/:id` - Update status (agents)
- `DELETE /api/roommate/request/:id` - Delete request

### University
- `GET /api/university` - Get all universities
- `GET /api/university/:id` - Get university by ID
- `POST /api/university` - Create university (admin)
- `PUT /api/university/:id` - Update university (admin)
- `DELETE /api/university/:id` - Delete university (admin)

### Admin
- `GET /api/admin/stats` - Platform statistics
- `GET /api/admin/agents/pending` - Pending agents
- `PUT /api/admin/agents/verify/:id` - Verify agent
- `PUT /api/admin/block/:id` - Block user
- `PUT /api/admin/unblock/:id` - Unblock user
- `DELETE /api/admin/property/:id` - Remove property
- `GET /api/admin/messages` - View all messages
- `GET /api/admin/users` - Get all users
- `GET /api/admin/actions` - Admin actions log

## 🔌 Socket.io Events

### Client → Server
- `user:join` - User connects with ID
- `message:send` - Send message
- `user:typing` - User is typing
- `user:stop-typing` - User stopped typing

### Server → Client
- `message:receive` - Receive new message
- `message:sent` - Message sent confirmation
- `user:typing` - Other user typing status
- `error` - Error occurred

## 🗄 Database Models

- **User** - fullName, email, password, role, avatar, bio, isVerified, isBlocked
- **Property** - title, description, price, location, campus, category, images, bedrooms, bathrooms
- **University** - name, state
- **Message** - senderId, receiverId, message, isRead
- **RoommateRequest** - userId, propertyId, status
- **AdminAction** - adminId, actionType, targetUserId, description

## 📦 Property Categories

- LUXURY
- SHARED
- STUDIO
- SELF_CONTAIN
- MINI_FLAT

## ✅ Validation Rules

- Email must be unique and valid
- Password must be at least 8 characters with letters and numbers
- Agents must be verified before uploading properties
- Universities must exist before assigning to properties
- Images limited to 5MB each, max 10 per property

## 🔒 Security Features

- JWT token authentication
- Password hashing with bcrypt
- Role-based access control
- Blocked user detection
- Input validation and sanitization
- Global error handling

## 🛡 Error Handling

All endpoints return uniform JSON responses:

```json
{
  "success": true/false,
  "message": "Description",
  "data": {},
  "errors": {}
}
```

## 📊 Admin Dashboard Features

- View platform statistics (users, properties, messages)
- Verify pending agents
- Block/unblock users
- Remove inappropriate properties
- Manage university list
- Monitor all platform messages
- View admin action history

## 🚀 Production Deployment

1. Update `.env` with production values
2. Set `NODE_ENV=production`
3. Run `npm install --production`
4. Run migrations: `npx prisma migrate deploy`
5. Start server: `npm start`

## 📝 Notes

- All file uploads are stored in `/uploads` directory
- Database uses Supabase PostgreSQL
- Socket.io requires WebSocket support
- CORS is enabled for all origins (configure for production)

## 🤝 Contributing

This is a production-ready backend. All features are fully implemented and tested.

## 📄 License

ISC
