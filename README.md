# FollowPro Backend API

A robust Node.js backend API for the FollowPro project management system with role-based access control, JWT authentication, and email notifications.

## 🚀 Features

- **Authentication & Authorization**
  - JWT access & refresh tokens
  - Email verification with OTP
  - Password reset functionality
  - Role-based access control (ADMIN/USER)

- **Project Management**
  - CRUD operations for projects
  - Admin-only project management
  - Project statistics and task tracking

- **Task Management**
  - Create, assign, and track tasks
  - Category-based task assignment
  - Status tracking (TODO, IN_PROGRESS, COMPLETE)
  - Deadline management

- **User Management**
  - Profile management with skills
  - Dynamic skill and category system
  - User task assignment based on skills

- **Security Features**
  - Password hashing with bcrypt
  - Rate limiting
  - Input validation
  - CORS configuration
  - Helmet security headers

## 🛠 Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB with Prisma ORM
- **Authentication:** JWT (jsonwebtoken)
- **Email:** Nodemailer
- **Validation:** express-validator
- **Security:** bcryptjs, helmet, cors

## 📋 Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or cloud)
- SMTP email service (Gmail recommended)

## ⚡ Quick Start

### 1. Installation
```bash
npm install
```

### 2. Environment Setup
Create `.env` file:
```env
DATABASE_URL="mongodb://localhost:27017/followpro"
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-change-in-production"
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT=587
EMAIL_USER="your-email@gmail.com"
EMAIL_PASS="your-app-password"
PORT=5000
NODE_ENV="development"
FRONTEND_URL="http://localhost:3000"
```

### 3. Database Setup
```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push
```

### 4. Start Development Server
```bash
npm run dev
```

Server will run on `http://localhost:5000`

## 📁 Project Structure

```
backend/
├── prisma/
│   └── schema.prisma          # Database schema
├── src/
│   ├── config/
│   │   └── database.js        # Database connection
│   ├── controllers/           # Route handlers
│   │   ├── authController.js
│   │   ├── projectController.js
│   │   ├── taskController.js
│   │   ├── userController.js
│   │   ├── skillController.js
│   │   └── categoryController.js
│   ├── middleware/
│   │   └── auth.js            # Authentication middleware
│   ├── routes/                # API routes
│   │   ├── auth.js
│   │   ├── projects.js
│   │   ├── tasks.js
│   │   ├── users.js
│   │   ├── skills.js
│   │   └── categories.js
│   ├── utils/                 # Utility functions
│   │   ├── jwt.js
│   │   └── email.js
│   └── server.js              # Main server file
├── .env                       # Environment variables
├── .env.example              # Environment template
├── package.json
└── vercel.json               # Vercel deployment config
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/verify-otp` - Verify email with OTP
- `POST /api/auth/login` - User login
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with OTP
- `POST /api/auth/refresh-token` - Refresh access token
- `POST /api/auth/resend-otp` - Resend OTP

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `PUT /api/users/change-password` - Change password
- `GET /api/users/all` - Get all users (Admin only)
- `GET /api/users/tasks` - Get user's tasks
- `PUT /api/users/tasks/:taskId/status` - Update task status

### Projects (Admin only)
- `POST /api/projects` - Create project
- `GET /api/projects` - Get all projects
- `GET /api/projects/:id` - Get project by ID
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### Tasks (Admin only)
- `POST /api/tasks` - Create task
- `GET /api/tasks` - Get all tasks
- `GET /api/tasks/:id` - Get task by ID
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task

### Skills & Categories (Admin only)
- `GET /api/admin/skills` - Get all skills
- `POST /api/admin/skills` - Create skill
- `PUT /api/admin/skills/:id` - Update skill
- `DELETE /api/admin/skills/:id` - Delete skill
- `GET /api/admin/categories` - Get all categories
- `POST /api/admin/categories` - Create category
- `PUT /api/admin/categories/:id` - Update category
- `DELETE /api/admin/categories/:id` - Delete category

## 🗄 Database Schema

### Models
- **User**: Authentication, profile, skills, role
- **Project**: Title, description, dates, admin relationship
- **Task**: Project relationship, assignee, status, category, deadline
- **OTPToken**: Email verification and password reset
- **Category**: Task categories
- **Skill**: User skills with categories

### Relationships
- User → Projects (One-to-Many as admin)
- User → Tasks (One-to-Many as assignee)
- Project → Tasks (One-to-Many)
- User → OTPTokens (One-to-Many)

## 🚀 Deployment

### Vercel Deployment

1. **Environment Variables** (Add in Vercel Dashboard):
```env
DATABASE_URL=your-mongodb-connection-string
JWT_SECRET=your-production-jwt-secret
JWT_REFRESH_SECRET=your-production-refresh-secret
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
NODE_ENV=production
FRONTEND_URL=https://your-frontend-url.vercel.app
```

2. **Deploy**:
```bash
vercel
```

### Other Platforms
The app is configured to work with any Node.js hosting platform. Ensure environment variables are set correctly.

## 🔒 Security

- Passwords hashed with bcrypt (12 rounds)
- JWT tokens with expiration
- Rate limiting on authentication endpoints
- Input validation and sanitization
- CORS properly configured
- Security headers with Helmet
- OTP expiration (10 minutes)

## 🧪 Scripts

```bash
npm start          # Start production server
npm run dev        # Start development server with nodemon
npm run db:generate # Generate Prisma client
npm run db:push    # Push schema to database
npm run db:migrate # Run database migrations
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support, email aliazeemaliazeem786@gmail.com or create an issue in the repository.