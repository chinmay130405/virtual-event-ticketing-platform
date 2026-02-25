# Architecture & Technical Documentation

## 🏗️ System Architecture

### Frontend Architecture (React)

```
┌─────────────────────────────────────────────┐
│         React Application (Port 3000)       │
├─────────────────────────────────────────────┤
│  ┌──────────────────────────────────────┐  │
│  │    Router (React Router v6)          │  │
│  │  ├─ /                                │  │
│  │  ├─ /event/:id                       │  │
│  │  ├─ /login, /register                │  │
│  │  ├─ /cart                            │  │
│  │  ├─ /checkout                        │  │
│  │  ├─ /my-tickets                      │  │
│  │  └─ /admin (protected)               │  │
│  └──────────────────────────────────────┘  │
│                    │                         │
│  ┌────────────────────────────────────────┐ │
│  │    Context (Auth State)                │ │
│  │  - User info                           │ │
│  │  - Authentication state                │ │
│  │  - Loading state                       │ │
│  └────────────────────────────────────────┘ │
│                    │                         │
│  ┌────────────────────────────────────────┐ │
│  │    Services (API Calls)                │ │
│  │  - authService.js                      │ │
│  │  - eventService.js                     │ │
│  │  - cartService.js                      │ │
│  │  - orderService.js                     │ │
│  │  - adminService.js                     │ │
│  └────────────────────────────────────────┘ │
│                    │                         │
└────────────────────┼────────────────────────┘
                     │
                     ↓ (HTTP/REST)
            localhost:5000/api
```

### Backend Architecture (Node.js/Express)

```
┌───────────────────────────────────────────────┐
│    Express Server (Port 5000)                 │
├───────────────────────────────────────────────┤
│  ┌───────────────────────────────────────┐   │
│  │    Middleware Layer                   │   │
│  │  ├─ CORS                              │   │
│  │  ├─ JSON Parser                       │   │
│  │  ├─ Auth Middleware (JWT verify)      │   │
│  │  └─ Error Handler                     │   │
│  └───────────────────────────────────────┘   │
│              │                                │
│  ┌───────────────────────────────────────┐   │
│  │    Routes                             │   │
│  │  ├─ /api/auth                         │   │
│  │  ├─ /api/events                       │   │
│  │  ├─ /api/cart                         │   │
│  │  ├─ /api/orders                       │   │
│  │  └─ /api/admin                        │   │
│  └───────────────────────────────────────┘   │
│              │                                │
│  ┌───────────────────────────────────────┐   │
│  │    Controllers                        │   │
│  │  - Business logic                     │   │
│  │  - Request handling                   │   │
│  │  - Response formatting                │   │
│  └───────────────────────────────────────┘   │
│              │                                │
│  ┌───────────────────────────────────────┐   │
│  │    Models (MongoDB Schemas)           │   │
│  │  ├─ User                              │   │
│  │  ├─ Event                             │   │
│  │  ├─ Cart                              │   │
│  │  └─ Order                             │   │
│  └───────────────────────────────────────┘   │
│              │                                │
└──────────────┼────────────────────────────────┘
               │
               ↓ (Mongoose ODM)
        MongoDB Database
```

## 🔄 Data Flow Examples

### User Registration Flow
```
1. User fills form → Submit
2. Frontend: authService.register(userData)
3. POST /api/auth/register
4. Backend: authController.register()
5. Hash password with bcrypt
6. Create User document in MongoDB
7. Generate JWT token
8. Return token + user data
9. Frontend: Save token to localStorage
10. Redirect to home page
11. AuthContext updates with user
```

### Event Purchase Flow
```
1. User browses events
2. Clicks "Add to Cart"
3. Frontend: cartService.addToCart(eventId, quantity, token)
4. POST /api/cart/add
5. Backend: Verify JWT → Get user → Update cart in DB
6. Return updated cart
7. User goes to checkout
8. Fills attendee details
9. Clicks "Complete Purchase"
10. Frontend: orderService.checkout(formData, token)
11. POST /api/orders/checkout
12. Backend:
    a. Verify JWT
    b. Check ticket availability
    c. Create Order document
    d. Update Event ticketsSold count
    e. Clear user's cart
    f. Send confirmation email (mock)
    g. Return order details
13. Frontend: Redirect to order confirmation
14. Show ticket details and download option
```

## 🔐 Authentication Flow

### JWT Authentication
```
┌──────────────┐
│ User Login   │
└──────┬───────┘
       │
       ↓
┌──────────────────────────────────┐
│ POST /api/auth/login             │
│ { email, password }              │
└──────┬───────────────────────────┘
       │
       ↓
┌──────────────────────────────────┐
│ Backend:                         │
│ 1. Find user by email            │
│ 2. Compare passwords (bcrypt)    │
│ 3. Generate JWT token            │
│ 4. Return { token, user }        │
└──────┬───────────────────────────┘
       │
       ↓
┌──────────────────────────────────┐
│ Frontend:                        │
│ 1. Save token to localStorage    │
│ 2. Update AuthContext            │
│ 3. Set Authorization header      │
└──────┬───────────────────────────┘
       │
       ↓
┌──────────────────────────────────┐
│ Protected Route Request:         │
│ Headers: {                       │
│   Authorization: Bearer <token>  │
│ }                                │
└──────┬───────────────────────────┘
       │
       ↓
┌──────────────────────────────────┐
│ Backend Auth Middleware:         │
│ 1. Extract token                 │
│ 2. Verify JWT signature          │
│ 3. Attach user to request        │
│ 4. Proceed or deny               │
└──────────────────────────────────┘
```

## 📊 Database Design

### Relationships Diagram
```
┌─────────────┐         ┌─────────────┐
│    User     │────────→│    Event    │
├─────────────┤         ├─────────────┤
│ _id         │         │ _id         │
│ name        │         │ title       │
│ email       │         │ description │
│ password    │         │ price       │
│ isAdmin     │         │ createdBy   │
└─────────────┘         └─────────────┘
       ▲                      ▲
       │                      │
       └──────────┬───────────┘
                  │
         ┌────────┴────────┐
         ▼                 ▼
     ┌────────┐      ┌──────────┐
     │ Cart   │      │ Order    │
     ├────────┤      ├──────────┤
     │ user   │      │ user     │
     │ items[]│      │ tickets[]│
     │        │      │ totalAmt │
     └────────┘      └──────────┘
```

## 🛡️ Security Measures

### Password Security
```javascript
// Bcrypt hashing (10 salt rounds)
const salt = await bcrypt.genSalt(10);
const hashedPassword = await bcrypt.hash(password, salt);

// Password comparison
const isMatch = await bcrypt.compare(enteredPassword, hashedPassword);
```

### JWT Security
```javascript
// Token generation
jwt.sign(
  { id: userId, isAdmin: isAdmin },
  process.env.JWT_SECRET,
  { expiresIn: '7d' }
);

// Token verification
jwt.verify(token, process.env.JWT_SECRET);
```

### Request Validation
- Input type checking
- Email format validation
- Required field validation
- Array bounds checking
- Unauthorized access prevention

## 🚀 Performance Optimization

### Frontend
- Code splitting with React Router
- Lazy loading of components
- CSS optimization
- Image optimization (using placeholder URLs)
- State management with Context API

### Backend
- Database indexing (text search on events)
- Query optimization with lean()
- Connection pooling (MongoDB)
- Middleware caching potential
- Async/await for non-blocking operations

## 📈 Scalability Considerations

### Current Implementation
- Single MongoDB instance
- Single Express server
- In-memory cart per user

### Scalability Improvements
1. **Database**: Add indexing, sharding, replication
2. **Cache**: Implement Redis for cart/session
3. **Load Balancing**: Use NGINX or HAProxy
4. **API Gateway**: Add rate limiting, caching
5. **CDN**: Serve static assets globally
6. **Microservices**: Separate auth, payments, notifications

## 🧪 Testing Strategy

### Unit Tests (Backend)
```javascript
// Example test structure
describe('User Model', () => {
  it('should hash password before save', async () => {
    const user = await User.create({
      name: 'Test',
      email: 'test@test.com',
      password: 'password123'
    });
    expect(user.password).not.toBe('password123');
  });
});
```

### Integration Tests (Frontend)
```javascript
// Example test structure
describe('Login Flow', () => {
  it('should login user and redirect', async () => {
    // Render login page
    // Fill in credentials
    // Submit form
    // Assert redirect to home
  });
});
```

## 📝 Error Handling

### Backend Error Types
```javascript
// Validation Error
{ statusCode: 400, message: "Invalid input" }

// Authentication Error
{ statusCode: 401, message: "Invalid credentials" }

// Authorization Error
{ statusCode: 403, message: "Not authorized" }

// Not Found Error
{ statusCode: 404, message: "Resource not found" }

// Server Error
{ statusCode: 500, message: "Server error" }
```

### Frontend Error Handling
```javascript
try {
  const response = await authService.login(email, password);
  // Handle success
} catch (err) {
  setError(err.message);
  // Display to user
}
```

## 🔄 State Management

### Frontend State
```javascript
// AuthContext provides:
- user: Current user object
- isAuthenticated: Boolean
- isAdmin: Boolean
- loading: Loading state
- login: Function
- register: Function
- logout: Function
```

### Backend Session
```javascript
// JWT Token contains:
{
  id: "user_id",
  isAdmin: false,
  iat: issued_at,
  exp: expiration_time
}
```

## 📊 API Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    "id": "123",
    "name": "John"
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description"
}
```

## 🎯 Code Quality Standards

### Naming Conventions
- camelCase for variables/functions
- PascalCase for components/classes
- UPPERCASE for constants
- Descriptive names (searchEvents, not getE)

### Code Organization
- Separate concerns (controllers, models, routes)
- Reusable components
- Service layer for API calls
- Utility functions for helpers

### Comments & Documentation
- JSDoc for functions
- Inline comments for complex logic
- README files for modules
- Clear variable names reduce need for comments

## 📚 Best Practices Implemented

✅ RESTful API design
✅ Middleware architecture
✅ Error handling patterns
✅ Environment configuration
✅ Password hashing
✅ JWT authentication
✅ Input validation
✅ Protected routes
✅ Component modularity
✅ Service layer pattern
✅ Context API for state
✅ Responsive design
✅ Accessibility considerations
✅ Clean code principles

---

This architecture provides a solid foundation for a scalable, maintainable full-stack application.
