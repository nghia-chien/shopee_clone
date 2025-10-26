# Shopee Clone - E-commerce Platform

A full-stack e-commerce application inspired by Shopee, built with modern web technologies. This project demonstrates a complete e-commerce solution with user authentication, product management, shopping cart functionality, and order processing.

## 🎯 Project Overview

This is a comprehensive e-commerce platform that replicates core features of Shopee, including:

- **User Authentication & Authorization** - Secure login/register with JWT tokens
- **Product Catalog** - Browse and view product details
- **Shopping Cart** - Add, update, and remove items
- **Order Management** - Create and track orders
- **Admin Panel** - Product and order management interface
- **Responsive Design** - Mobile-first approach with Tailwind CSS

## 🛠️ Tech Stack

### Frontend
- **React 19** - Modern React with latest features
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **React Router DOM** - Client-side routing
- **Zustand** - Lightweight state management
- **TanStack Query** - Server state management and caching
- **Refine** - Admin panel framework

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **TypeScript** - Type-safe backend development
- **Prisma** - Modern database ORM
- **PostgreSQL** - Relational database
- **JWT** - JSON Web Tokens for authentication
- **bcryptjs** - Password hashing
- **Zod** - Schema validation
- **Helmet** - Security middleware
- **CORS** - Cross-origin resource sharing
- **Morgan** - HTTP request logger

### Development Tools
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Concurrently** - Run multiple commands
- **json-server** - Mock API for development

## 📁 Project Structure

### Frontend Structure
```
src/
├── admin/                 # Admin panel components
│   └── AdminApp.tsx      # Main admin application
├── api/                  # API client configuration
│   └── client.ts         # HTTP client setup
├── components/           # Reusable UI components
│   ├── auth/            # Authentication components
│   │   ├── AuthGuard.tsx
│   │   ├── AuthLayout.tsx
│   │   ├── LoginForm.tsx
│   │   ├── RegisterForm.tsx
│   │   └── PromotionalBanner.tsx
│   └── layout/          # Layout components
│       └── HomeLayout.tsx
├── lib/                 # Utility libraries
│   └── react-query.ts   # Query client configuration
├── providers/           # Context providers
│   └── AppProviders.tsx # Main app providers
├── routes/              # Route definitions
│   └── index.tsx        # App routing
├── screens/             # Page components
│   ├── HomePage.tsx
│   ├── LoginPage.tsx
│   ├── RegisterPage.tsx
│   ├── ProductPage.tsx
│   ├── SimpleLoginPage.tsx
│   └── TestPage.tsx
├── store/               # State management
│   └── auth.ts          # Authentication store
├── App.tsx              # Main app component
└── main.tsx             # App entry point
```

### Backend Structure
```
backend/src/
├── controllers/         # Request handlers
│   ├── auth.controller.ts
│   ├── cart.controller.ts
│   ├── order.controller.ts
│   └── product.controller.ts
├── middlewares/         # Express middlewares
│   ├── auth.ts          # Authentication middleware
│   └── errorHandler.ts  # Error handling
├── routes/              # Route definitions
│   ├── index.ts         # Main router
│   └── modules/         # Feature-based routes
│       ├── auth.routes.ts
│       ├── cart.routes.ts
│       ├── order.routes.ts
│       └── product.routes.ts
├── services/            # Business logic
│   ├── auth.service.ts
│   ├── cart.service.ts
│   ├── order.service.ts
│   └── product.service.ts
├── utils/               # Utility functions
│   └── prisma.ts        # Prisma client
├── app.ts               # Express app configuration
└── server.ts            # Server entry point
```

## 🔄 Frontend-Backend Integration

### API Communication
The frontend communicates with the backend through a centralized API client (`src/api/client.ts`):

```typescript
const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api';

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });
  // Error handling and response parsing
}
```

### Authentication Flow
1. **Login/Register** → Frontend sends credentials to `/api/auth/login` or `/api/auth/register`
2. **Token Storage** → JWT token stored in Zustand store with persistence
3. **Protected Routes** → `AuthGuard` component validates token with `/api/auth/me`
4. **API Requests** → Token automatically included in Authorization header
5. **Token Refresh** → Automatic logout on token expiration

### Data Flow
- **Products**: Frontend fetches via React Query → Backend Prisma → PostgreSQL
- **Cart**: User actions → Zustand store → API calls → Database updates
- **Orders**: Order creation → Cart items → Order items → Database transaction

## 🗄️ Database Schema

### Core Models

#### User
```prisma
model User {
  id          String     @id @default(cuid())
  email       String     @unique
  phoneNumber String?    @unique
  password    String
  name        String?
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt
  
  orders      Order[]
  cartItems   CartItem[]
}
```

#### Product
```prisma
model Product {
  id          String       @id @default(cuid())
  title       String
  description String?
  price       Decimal      @db.Decimal(10, 2)
  stock       Int          @default(0)
  images      String[]
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt
  
  cartItems   CartItem[]
  orderItems  OrderItem[]
}
```

#### Cart & Orders
```prisma
model CartItem {
  id        String   @id @default(cuid())
  userId    String
  productId String
  quantity  Int      @default(1)
  
  user      User     @relation(fields: [userId], references: [id])
  product   Product  @relation(fields: [productId], references: [id])
  
  @@unique([userId, productId])
}

model Order {
  id        String      @id @default(cuid())
  userId    String
  total     Decimal     @db.Decimal(10, 2)
  status    String      @default("pending")
  createdAt DateTime    @default(now())
  
  user      User        @relation(fields: [userId], references: [id])
  items     OrderItem[]
}

model OrderItem {
  id        String   @id @default(cuid())
  orderId   String
  productId String
  price     Decimal  @db.Decimal(10, 2)
  quantity  Int      @default(1)
  
  order     Order    @relation(fields: [orderId], references: [id])
  product   Product  @relation(fields: [productId], references: [id])
}
```

## 🚀 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user (protected)

### Products
- `GET /api/products` - List all products
- `GET /api/products/:id` - Get product details

### Cart (Protected)
- `GET /api/cart` - Get user's cart items
- `POST /api/cart/items` - Add item to cart
- `PUT /api/cart/items/:productId` - Update cart item quantity
- `DELETE /api/cart/items/:productId` - Remove item from cart

### Orders (Protected)
- `GET /api/orders` - List user's orders
- `POST /api/orders` - Create new order
- `GET /api/orders/:id` - Get order details

## 🏗️ Current Development Stage

### ✅ Completed Features
- **Authentication System**
  - User registration with email/phone validation
  - Secure login with JWT tokens
  - Password hashing with bcrypt
  - Protected routes with AuthGuard
  - Persistent authentication state

- **Product Management**
  - Product listing and details
  - Image support for products
  - Price and stock management
  - Admin panel integration with Refine

- **Shopping Cart**
  - Add/remove items from cart
  - Update item quantities
  - Persistent cart state
  - Cart validation

- **Order System**
  - Order creation from cart
  - Order history tracking
  - Order status management

- **UI/UX**
  - Responsive design with Tailwind CSS
  - Modern Vietnamese e-commerce styling
  - Loading states and error handling
  - Mobile-first approach

### 🚧 In Progress / Partial Implementation
- **Admin Panel** - Basic Refine setup, needs custom components
- **Product Images** - Schema supports arrays, UI needs enhancement
- **Order Status** - Backend ready, frontend status display needed

### ❌ Missing Features
- **Payment Integration** - No payment gateway implementation
- **Search & Filtering** - Product search and category filtering
- **User Profile** - Profile management and settings
- **Reviews & Ratings** - Product review system
- **Notifications** - Order updates and promotions
- **Inventory Management** - Stock tracking and alerts
- **Shipping** - Address management and shipping options
- **Social Features** - Wishlist, favorites, social login
- **Analytics** - Sales reports and user analytics
- **Email System** - Order confirmations and notifications

## 🛣️ Roadmap & Next Steps

### Phase 1: Core E-commerce Features (Priority: High)
1. **Enhanced Product Management**
   - Product categories and subcategories
   - Advanced search and filtering
   - Product variants (size, color, etc.)
   - Bulk product import/export

2. **Improved Shopping Experience**
   - Wishlist functionality
   - Product recommendations
   - Recently viewed products
   - Quick add to cart

3. **User Profile & Settings**
   - Profile management
   - Address book
   - Order history with detailed tracking
   - Account settings

### Phase 2: Business Features (Priority: Medium)
1. **Payment Integration**
   - Multiple payment gateways (Stripe, PayPal, etc.)
   - Payment method management
   - Refund processing

2. **Shipping & Logistics**
   - Shipping address management
   - Shipping rate calculation
   - Order tracking integration
   - Delivery notifications

3. **Inventory Management**
   - Low stock alerts
   - Inventory tracking
   - Supplier management
   - Automated reordering

### Phase 3: Advanced Features (Priority: Low)
1. **Marketing & Analytics**
   - Promotional campaigns
   - Discount codes and coupons
   - Sales analytics dashboard
   - User behavior tracking

2. **Social & Community**
   - Product reviews and ratings
   - Social media integration
   - User-generated content
   - Community features

3. **Mobile & Performance**
   - Progressive Web App (PWA)
   - Offline functionality
   - Performance optimization
   - Mobile app development

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm/yarn
- PostgreSQL database
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd shopee-clone
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   
   # Setup environment variables
   cp .env.example .env
   # Edit .env with your database URL and JWT secret
   
   # Run database migrations
   npx prisma migrate dev
   
   # Start backend server
   npm run dev
   ```

3. **Frontend Setup**
   ```bash
   # From project root
   npm install
   
   # Start frontend development server
   npm run dev
   ```

4. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:4000
   - Admin Panel: http://localhost:5173/admin

### Development Scripts

**Frontend:**
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

**Backend:**
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript
- `npm run start` - Start production server
- `npm run prisma:studio` - Open Prisma Studio
- `npm run prisma:migrate` - Run database migrations

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Inspired by Shopee's user interface and functionality
- Built with modern web technologies and best practices
- Designed for educational and portfolio purposes#   s h o p p e _ c l o n e  
 