# Quick Start Guide

## One-Command Setup (Recommended)

### Step 1: Backend Setup
```bash
cd backend
npm install
cp .env.example .env
```

**Make sure MongoDB is running locally or update MONGO_URI in .env**

```bash
npm run dev
```

Backend runs on http://localhost:5000

### Step 2: Frontend Setup (New Terminal)
```bash
cd frontend
npm install
npm start
```

Frontend runs on http://localhost:3000

## 🧪 Quick Test

### Create a Demo Account
1. Go to http://localhost:3000/register
2. Enter:
   - Name: John Doe
   - Email: john@demo.com
   - Password: password123
3. Click "Create Account"

### Create Sample Event (Admin Only)
First, create an admin account by modifying backend and running:
```javascript
// In MongoDB directly or through a seeding script
db.users.updateOne(
  { email: "admin@demo.com" },
  { $set: { isAdmin: true } }
)
```

Then login and access `/admin` dashboard

### Browse & Purchase
1. Click "Browse Events" (home page shows empty until events are created)
2. Create some test events via admin panel
3. Click event to view details
4. Click "Add to Cart"
5. Click cart icon
6. Click "Proceed to Checkout"
7. Fill in attendee info
8. Complete purchase

## 📊 Admin Dashboard

Access at `/admin` (requires admin login)

- **Dashboard Tab**: View key metrics
- **Users Tab**: Manage users
- **Analytics Tab**: View event performance

## 🔄 API Testing

### Test with cURL or Postman

```bash
# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@test.com",
    "password": "password123",
    "confirmPassword": "password123"
  }'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@test.com",
    "password": "password123"
  }'

# Get Events
curl http://localhost:5000/api/events

# Get Specific Event
curl http://localhost:5000/api/events/{event_id}
```

## 📱 Mobile Testing

The app is fully responsive. Test on:
- Chrome DevTools (F12 > Toggle Device)
- Actual mobile device on same network

## 🐛 Common Issues

### MongoDB Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```
**Solution**: Start MongoDB locally or update MONGO_URI in .env

### Port Already in Use
```
Error: listen EADDRINUSE :::5000
```
**Solution**: Kill process or use different port
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# macOS/Linux
lsof -i :5000
kill -9 <PID>
```

### CORS Errors
**Solution**: Make sure backend is running on :5000 and frontend on :3000

### JWT Token Expired
- Clear localStorage
- Login again to get new token

## 📖 Project Structure Quick Reference

```
📁 virtual-event-ticketing/
├── 📁 backend/          → Express API Server
│   ├── server.js        → Main entry point
│   ├── config/          → Database config
│   ├── models/          → MongoDB schemas
│   ├── controllers/     → Business logic
│   ├── routes/          → API endpoints
│   └── .env             → Environment config
│
└── 📁 frontend/         → React SPA
    ├── src/
    │   ├── pages/       → Page components
    │   ├── components/  → Reusable components
    │   ├── services/    → API calls
    │   ├── context/     → State management
    │   └── styles/      → CSS files
    └── package.json
```

## 🎯 Feature Checklist

- ✅ User Authentication (Register/Login/Logout)
- ✅ Event Browsing with Filters
- ✅ Shopping Cart
- ✅ Checkout Process
- ✅ Order Management
- ✅ Ticket View/Download
- ✅ Admin Dashboard
- ✅ Responsive UI
- ✅ Error Handling
- ✅ JWT Protection

## 🔗 Important URLs

| Feature | URL |
|---------|-----|
| Home | http://localhost:3000 |
| Login | http://localhost:3000/login |
| Register | http://localhost:3000/register |
| Cart | http://localhost:3000/cart |
| My Tickets | http://localhost:3000/my-tickets |
| Admin | http://localhost:3000/admin |
| API | http://localhost:5000/api |
| Health Check | http://localhost:5000/api/health |

## 📚 Code Examples

### Making API Calls (Frontend)
```javascript
import eventService from '../services/eventService';

// Get all events
const { events } = await eventService.getAllEvents({
  category: 'Technology',
  minPrice: 0,
  maxPrice: 100
});
```

### Creating an Event (Admin)
```javascript
const newEvent = {
  title: 'React Workshop',
  description: 'Learn React',
  price: 49,
  ticketsAvailable: 100,
  eventDate: '2026-03-15',
  eventTime: '10:00',
  category: 'Technology'
};

const { event } = await eventService.createEvent(newEvent, token);
```

## 🎓 Learning Resources

- [React Documentation](https://react.dev)
- [Express.js Guide](https://expressjs.com)
- [MongoDB Manual](https://docs.mongodb.com/manual)
- [JWT.io](https://jwt.io)

---

**Ready to code? Happy building! 🚀**
