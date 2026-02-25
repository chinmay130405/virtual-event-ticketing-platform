# Windows Setup Guide

## Prerequisites Installation

### 1. Install Node.js
- Visit: https://nodejs.org
- Download LTS version
- Run installer and follow prompts
- Verify: Open PowerShell and run:
  ```powershell
  node --version
  npm --version
  ```

### 2. Install MongoDB
- Visit: https://www.mongodb.com/try/download/community
- Download Windows installer
- Run installer
- Choose "Install MongoDB as a Service"
- Verify: MongoDB should start automatically

Or use MongoDB Atlas (cloud):
- Visit: https://www.mongodb.com/cloud/atlas
- Create free account
- Create cluster
- Get connection string

### 3. Install Git (Optional)
- Visit: https://git-scm.com
- Download and install
- Useful for version control

---

## Step-by-Step Setup

### Step 1: Backend Setup

Open PowerShell in project root:

```powershell
cd backend
npm install
```

Create `.env` file:
```powershell
Copy-Item .env.example .env
```

Edit `backend\.env`:
```powershell
notepad .env
```

Update values:
```env
MONGO_URI=mongodb://localhost:27017/virtual-event-ticketing
JWT_SECRET=your_secret_key_here_change_in_production
JWT_EXPIRE=7d
PORT=5000
NODE_ENV=development
```

Save and close Notepad.

Start MongoDB (if running locally):
```powershell
# MongoDB should auto-start as service
# Or manually start:
mongod
```

Start Backend Server:
```powershell
npm run dev
```

Expected output:
```
✅ MongoDB Connected: localhost
🚀 Server running on http://localhost:5000
```

### Step 2: Frontend Setup

Open new PowerShell window (keep backend running):

```powershell
cd frontend
npm install
npm start
```

This will automatically open http://localhost:3000 in your browser.

---

## Verify Installation

### Check Endpoints

Open new PowerShell window and test:

```powershell
# Test backend health
curl http://localhost:5000/api/health

# Should return:
# {"success":true,"message":"Server is running",...}
```

Or use browser:
- Backend health: http://localhost:5000/api/health
- Frontend: http://localhost:3000

---

## Troubleshooting

### MongoDB Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```

**Solution:**
1. Check if MongoDB is running (Services or "mongod" in PowerShell)
2. Or update MONGO_URI to MongoDB Atlas connection string

### Port Already in Use
```
Error: listen EADDRINUSE :::5000
```

**Solution:**
```powershell
# Find process using port 5000
netstat -ano | findstr :5000

# Kill process (replace PID with actual number)
taskkill /PID <PID> /F
```

### npm install fails
```powershell
# Clear npm cache
npm cache clean --force

# Try install again
npm install
```

### Module not found errors
```powershell
# Delete node_modules and reinstall
rm -r node_modules
npm install
```

---

## File Structure After Setup

```
virtual-event-ticketing/
├── backend/
│   ├── node_modules/
│   ├── .env                 (CREATED - contains secrets)
│   ├── .env.example
│   ├── package.json
│   ├── server.js
│   ├── config/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   └── utils/
│
├── frontend/
│   ├── node_modules/
│   ├── public/
│   ├── src/
│   ├── package.json
│   └── README.md
│
└── README.md
```

---

## Running the Application

### Terminal 1: Backend
```powershell
cd backend
npm run dev
# Runs on http://localhost:5000
```

### Terminal 2: Frontend
```powershell
cd frontend
npm start
# Runs on http://localhost:3000
```

### Terminal 3: MongoDB (if running locally)
```powershell
mongod
```

---

## First Use

1. **Open Frontend**: http://localhost:3000
2. **Register**: Create new account
3. **Create Events** (Admin):
   - Make user an admin via MongoDB
   - Or create event through API
4. **Browse Events**: Home page shows events
5. **Add to Cart**: Click event and add tickets
6. **Checkout**: Complete purchase
7. **View Tickets**: Check "My Tickets"

---

## Database Operations (MongoDB)

### Open MongoDB Shell (if local)
```powershell
mongosh
```

### Common Commands
```javascript
// Use database
use virtual-event-ticketing

// View users
db.users.find()

// Make user admin
db.users.updateOne(
  { email: "user@example.com" },
  { $set: { isAdmin: true } }
)

// View events
db.events.find()

// View orders
db.orders.find()
```

---

## Environment Variables Reference

### Backend (.env)
```env
# MongoDB Connection
MONGO_URI=mongodb://localhost:27017/virtual-event-ticketing

# JWT Configuration
JWT_SECRET=your_super_secret_key_change_this
JWT_EXPIRE=7d

# Server
PORT=5000
NODE_ENV=development

# Email (Optional - currently mocked)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
```

### Frontend (.env - Optional)
```env
REACT_APP_API_URL=http://localhost:5000
```

---

## Useful Commands

```powershell
# Backend
cd backend
npm run dev          # Development mode with auto-reload
npm start            # Production mode
npm install          # Install dependencies

# Frontend
cd frontend
npm start            # Development server
npm run build        # Production build
npm test             # Run tests

# General
npm list             # List installed packages
npm outdated         # Check outdated packages
npm update           # Update packages
```

---

## Testing the API

### Using PowerShell (curl)

```powershell
# Register user
curl -Method POST `
  -Uri "http://localhost:5000/api/auth/register" `
  -ContentType "application/json" `
  -Body '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123",
    "confirmPassword": "password123"
  }'

# Login
curl -Method POST `
  -Uri "http://localhost:5000/api/auth/login" `
  -ContentType "application/json" `
  -Body '{
    "email": "test@example.com",
    "password": "password123"
  }'

# Get events
curl "http://localhost:5000/api/events"
```

---

## Next Steps

1. **Read Documentation**:
   - README.md - Full documentation
   - QUICKSTART.md - Quick reference
   - ARCHITECTURE.md - Technical details

2. **Explore Features**:
   - Create sample events
   - Purchase tickets
   - View admin dashboard
   - Download tickets

3. **Customize**:
   - Change colors in styles/global.css
   - Add more features
   - Integrate real payment gateway
   - Add email notifications

4. **Deploy**:
   - Backend to Heroku/Railway
   - Frontend to Vercel/Netlify
   - Database to MongoDB Atlas

---

## Support Resources

- Node.js: https://nodejs.org/docs
- Express: https://expressjs.com
- React: https://react.dev
- MongoDB: https://docs.mongodb.com
- Mongoose: https://mongoosejs.com

---

**Setup Complete! Happy coding! 🚀**
