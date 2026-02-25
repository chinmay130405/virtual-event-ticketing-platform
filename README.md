# Virtual Event Ticketing Platform

A full-stack e-commerce platform for booking virtual event tickets. Built with **React.js** (frontend), **Node.js + Express** (backend), and **MongoDB** (database).

## 🎯 Features

### 1. User Authentication
- ✅ User registration with email validation
- ✅ Login with JWT authentication
- ✅ Password hashing using bcrypt
- ✅ User profile management
- ✅ Password change functionality

### 2. Event Management
- ✅ Browse all virtual events
- ✅ Advanced search and filtering (price, category, date)
- ✅ Event details page with full information
- ✅ Event categories (Technology, Business, Entertainment, Sports, Education)
- ✅ Real-time ticket availability tracking
- ✅ Event organizer information

### 3. Shopping Cart
- ✅ Add/remove tickets from cart
- ✅ Update ticket quantities
- ✅ Real-time price calculation
- ✅ Cart persistence in database (linked to user)
- ✅ Clear cart functionality

### 4. Checkout System
- ✅ Attendee information collection
- ✅ Billing address management
- ✅ Multiple payment method options
- ✅ Order confirmation with ticket generation
- ✅ Automatic ticket number generation

### 5. Order Management
- ✅ View all user orders/tickets
- ✅ Order tracking and status
- ✅ Ticket download (mock PDF)
- ✅ Cancel orders
- ✅ Order confirmation emails (mock)

### 6. Admin Panel
- ✅ Dashboard with key metrics
- ✅ User management
- ✅ Events analytics and reporting
- ✅ Sales reports
- ✅ Recent orders monitoring

## 📁 Project Structure

```
virtual-event-ticketing/
├── backend/
│   ├── config/
│   │   └── database.js          # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js    # Auth logic
│   │   ├── eventController.js   # Event management
│   │   ├── cartController.js    # Cart operations
│   │   ├── orderController.js   # Order processing
│   │   └── adminController.js   # Admin operations
│   ├── middleware/
│   │   ├── auth.js              # JWT verification
│   │   └── errorHandler.js      # Error handling
│   ├── models/
│   │   ├── User.js              # User schema
│   │   ├── Event.js             # Event schema
│   │   ├── Cart.js              # Cart schema
│   │   └── Order.js             # Order schema
│   ├── routes/
│   │   ├── auth.js              # Auth endpoints
│   │   ├── events.js            # Event endpoints
│   │   ├── cart.js              # Cart endpoints
│   │   ├── orders.js            # Order endpoints
│   │   └── admin.js             # Admin endpoints
│   ├── utils/
│   │   ├── jwt.js               # JWT utilities
│   │   ├── email.js             # Email service (mock)
│   │   └── pdf.js               # PDF generation (mock)
│   ├── package.json
│   ├── server.js                # Main server file
│   └── .env.example
│
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.js        # Navigation header
│   │   │   ├── Header.css
│   │   │   ├── EventCard.js     # Event card component
│   │   │   └── EventCard.css
│   │   ├── context/
│   │   │   └── AuthContext.js   # Auth state management
│   │   ├── pages/
│   │   │   ├── EventList.js     # Home/event listing
│   │   │   ├── EventDetails.js  # Event details
│   │   │   ├── Login.js         # Login page
│   │   │   ├── Register.js      # Registration page
│   │   │   ├── Cart.js          # Shopping cart
│   │   │   ├── Checkout.js      # Checkout form
│   │   │   ├── OrderConfirmation.js
│   │   │   ├── MyTickets.js     # View purchased tickets
│   │   │   ├── AdminDashboard.js
│   │   │   └── [CSS files]
│   │   ├── services/
│   │   │   ├── authService.js
│   │   │   ├── eventService.js
│   │   │   ├── cartService.js
│   │   │   ├── orderService.js
│   │   │   └── adminService.js
│   │   ├── styles/
│   │   │   └── global.css
│   │   ├── App.js               # Main app with routes
│   │   └── index.js             # Entry point
│   └── package.json
│
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v14+)
- MongoDB (local or Atlas)
- Git

### Backend Setup

1. **Navigate to backend folder:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create .env file:**
   ```bash
   cp .env.example .env
   ```

4. **Configure .env:**
   ```env
   MONGO_URI=mongodb://localhost:27017/virtual-event-ticketing
   JWT_SECRET=your_super_secret_key_change_in_production
   JWT_EXPIRE=7d
   PORT=5000
   NODE_ENV=development
   ```

5. **Ensure MongoDB is running:**
   ```bash
   # On Windows (if using local MongoDB)
   mongod
   
   # Or use MongoDB Atlas connection string
   ```

6. **Start backend server:**
   ```bash
   npm run dev
   # or
   npm start
   ```

   Server runs on `http://localhost:5000`

### Frontend Setup

1. **Open new terminal and navigate to frontend:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start React development server:**
   ```bash
   npm start
   ```

   App runs on `http://localhost:3000`

## 📚 MongoDB Schemas

### User Schema
```javascript
{
  name: String (required),
  email: String (required, unique),
  password: String (hashed, required),
  phone: String,
  isAdmin: Boolean (default: false),
  createdAt: Date
}
```

### Event Schema
```javascript
{
  title: String (required),
  description: String (required),
  category: String (enum),
  price: Number (required),
  ticketsAvailable: Number (required),
  ticketsSold: Number (default: 0),
  eventDate: Date (required),
  eventTime: String (HH:MM format),
  duration: String,
  bannerImage: String,
  location: String,
  speaker: String,
  isActive: Boolean,
  createdBy: ObjectId (ref: User),
  createdAt: Date
}
```

### Cart Schema
```javascript
{
  user: ObjectId (ref: User, unique),
  items: [
    {
      event: ObjectId (ref: Event),
      quantity: Number,
      price: Number
    }
  ],
  totalPrice: Number,
  updatedAt: Date
}
```

### Order Schema
```javascript
{
  user: ObjectId (ref: User),
  tickets: [
    {
      ticketNumber: String (unique),
      event: ObjectId (ref: Event),
      eventTitle: String,
      eventDate: Date,
      eventTime: String,
      quantity: Number
    }
  ],
  totalAmount: Number,
  paymentStatus: String (pending/completed/failed),
  orderStatus: String (confirmed/cancelled),
  orderNumber: String (unique),
  attendeeEmail: String,
  attendeeName: String,
  attendeePhone: String,
  billingAddress: {
    street: String,
    city: String,
    state: String,
    postalCode: String,
    country: String
  },
  paymentMethod: String,
  createdAt: Date
}
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user profile
- `PUT /api/auth/update-profile` - Update profile
- `POST /api/auth/change-password` - Change password

### Events
- `GET /api/events` - Get all events (with filtering)
- `GET /api/events/:id` - Get event details
- `POST /api/events` - Create event (admin)
- `PUT /api/events/:id` - Update event (admin)
- `DELETE /api/events/:id` - Delete event (admin)
- `GET /api/events/categories` - Get categories

### Cart
- `GET /api/cart` - Get user's cart
- `POST /api/cart/add` - Add to cart
- `PUT /api/cart/update/:eventId` - Update quantity
- `DELETE /api/cart/remove/:eventId` - Remove from cart
- `DELETE /api/cart/clear` - Clear entire cart

### Orders
- `POST /api/orders/checkout` - Create order from cart
- `GET /api/orders/my-orders` - Get user's orders
- `GET /api/orders/:id` - Get order details
- `PUT /api/orders/:id/cancel` - Cancel order
- `GET /api/orders/:orderId/tickets/:ticketId/download` - Download ticket
- `GET /api/orders` - Get all orders (admin)

### Admin
- `GET /api/admin/users` - Get all users
- `GET /api/admin/users/:id` - Get user details
- `PUT /api/admin/users/:id/role` - Update user role
- `DELETE /api/admin/users/:id` - Delete user
- `GET /api/admin/dashboard/stats` - Dashboard statistics
- `GET /api/admin/events/analytics` - Events analytics
- `GET /api/admin/reports/sales` - Sales reports

## 🧪 Testing the Application

### Create Test Events
1. Login as admin
2. Navigate to `/admin` (auto-redirected if not admin)
3. Create sample events with details

### Test User Flow
1. Register new account
2. Browse events with filters
3. View event details
4. Add tickets to cart
5. Go to checkout
6. Complete purchase
7. View tickets in "My Tickets"

### Test Admin Features
1. Login with admin account
2. View dashboard statistics
3. Check user management
4. View event analytics
5. Review sales reports

## 🎨 UI/UX Features

- **Responsive Design** - Works on desktop, tablet, and mobile
- **Modern Gradient Headers** - Purple to pink gradients
- **Smooth Animations** - Hover effects and transitions
- **Loading States** - Spinners and loading indicators
- **Error Handling** - User-friendly error messages
- **Alert Messages** - Success, error, and warning alerts
- **Form Validation** - Client-side validation with feedback

## 🔐 Security Features

- **JWT Authentication** - Secure token-based auth
- **Password Hashing** - bcrypt with salt rounds
- **Protected Routes** - Server-side route protection
- **Admin Verification** - Role-based access control
- **Input Validation** - Server-side data validation
- **Error Handling** - Centralized error management

## 📝 Environment Variables

### Backend (.env)
```env
MONGO_URI=mongodb://localhost:27017/virtual-event-ticketing
JWT_SECRET=your_secret_key
JWT_EXPIRE=7d
PORT=5000
NODE_ENV=development
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
```

### Frontend (.env - if needed)
```env
REACT_APP_API_URL=http://localhost:5000
```

## 🛠️ Tech Stack

**Frontend:**
- React.js 18
- React Router v6
- Axios (API calls)
- CSS3 (Flexbox, Grid)

**Backend:**
- Node.js
- Express.js
- MongoDB & Mongoose
- JWT (jsonwebtoken)
- Bcrypt (password hashing)
- PDFKit (mock)

## 📦 Key Dependencies

**Backend:**
- mongoose: ^7.0.3
- express: ^4.18.2
- jsonwebtoken: ^9.0.0
- bcryptjs: ^2.4.3
- cors: ^2.8.5
- dotenv: ^16.0.3

**Frontend:**
- react: ^18.2.0
- react-router-dom: ^6.9.0
- axios: ^1.3.4

## 🚀 Deployment

### Backend (Heroku/Railway)
1. Create Git repository
2. Push code to GitHub
3. Connect to Heroku/Railway
4. Set environment variables
5. Deploy

### Frontend (Vercel/Netlify)
1. Build React app: `npm run build`
2. Connect GitHub repo to Vercel/Netlify
3. Deploy automatically on push

## 🐛 Known Limitations

- Email sending is mocked (logs to console)
- PDF generation is mocked
- Payment integration is dummy
- Single admin role (no role hierarchy)
- No image upload (using placeholder URLs)

## 🚀 Future Enhancements

1. Real payment gateway integration (Stripe/PayPal)
2. Email notifications with nodemailer
3. Actual PDF ticket generation
4. Image upload for event banners
5. User reviews and ratings
6. Wishlist functionality
7. Email verification
8. Two-factor authentication
9. Refund management
10. Event categorization improvements

## 📄 License

MIT License - feel free to use for learning and commercial projects

## 👨‍💻 Author

Created as a full-stack e-commerce project demonstration

## 💬 Support

For issues or questions, please check the code comments or contact support.

---

**Happy Ticketing! 🎫**
