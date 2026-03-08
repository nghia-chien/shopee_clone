# Shopee Clone - Full-Stack E-Commerce Platform

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=Prisma&logoColor=white)](https://www.prisma.io/)

A comprehensive full-stack e-commerce platform inspired by Shopee, featuring a complete marketplace ecosystem with multiple user roles (buyers, sellers, admins). Built with modern web technologies and best practices.

## 🌟 Features

### 🛒 User (Buyer) Features
- **User Authentication**: Secure JWT-based login and registration
- **Product Discovery**: Advanced search, filtering, and category navigation
- **Shopping Cart**: Add, update, and manage cart items with variants
- **Order Management**: Complete checkout process with address selection
- **Payment Integration**: PayPal payment processing
- **Voucher System**: Apply discount codes and promotions
- **Order Tracking**: Real-time order status and history
- **Product Reviews**: Rate and review products with image attachments
- **Real-time Chat**: WebSocket-powered communication with sellers
- **Customer Support**: Complaint filing and dispute resolution
- **Flash Sales**: Time-limited promotional events

### 🏪 Seller Features
- **Seller Dashboard**: Dedicated seller interface and analytics
- **Product Management**: Full CRUD operations for products and variants
- **Order Fulfillment**: Manage and process customer orders
- **Shop Customization**: Profile, settings, and branding options
- **Review Management**: Respond to customer reviews
- **Voucher Creation**: Create seller-specific discount codes
- **Real-time Communication**: Chat with customers
- **Payment Management**: Configure payment methods

### 👨‍💼 Admin Features
- **User Management**: CRUD operations for users and sellers
- **Content Moderation**: Product and review management
- **Order Monitoring**: Track and update order statuses
- **Analytics Dashboard**: Platform statistics and insights
- **Category Management**: Hierarchical category structure
- **System Administration**: Comprehensive admin panel with Refine framework

## 🛠️ Technology Stack

### Backend
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL (via Neon serverless)
- **ORM**: Prisma with database migrations
- **Authentication**: JWT (jsonwebtoken)
- **Validation**: Zod schemas
- **File Upload**: Multer with Cloudinary integration
- **Real-time**: WebSocket (ws)
- **Email**: Nodemailer (SMTP)
- **Security**: Helmet, CORS, bcryptjs

### Frontend
- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS with PostCSS
- **Routing**: React Router v6
- **State Management**: Zustand
- **Data Fetching**: TanStack React Query
- **Admin Panel**: Refine framework
- **Internationalization**: i18next
- **Icons**: Lucide React

### Third-Party Integrations
- **Payment**: PayPal SDK
- **Shipping**: GHN (Green Hub Network) API
- **Image Storage**: Cloudinary CDN
- **Database**: Neon PostgreSQL

## 📋 Prerequisites

- **Node.js** >= 18.0.0
- **npm** or **yarn** package manager
- **PostgreSQL** database (or Neon account)
- **Git** for version control

## 🚀 Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd shopee-clone
```

### 2. Backend Setup

#### Install Dependencies
```bash
cd backend
npm install
```

#### Environment Configuration
Create a `.env` file in the `backend` directory:
```env
# Database
DATABASE_URL="postgresql://username:password@host:port/database"

# JWT
JWT_SECRET="your-super-secret-jwt-key"

# Server
PORT=4000

# Cloudinary (Image Upload)
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"

# Email (Optional)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
EMAIL_FROM="noreply@shopee-clone.com"

# GHN Shipping Integration
GHN_TOKEN="your-ghn-api-token"
SHIP_FROM_PHONE="your-phone-number"
SHIP_FROM_NAME="Your Shop Name"
GHN_STATUS_SYNC_INTERVAL_MS=60000
GHN_STATUS_STALE_MINUTES=30

# PayPal
PAYPAL_CLIENT_ID="your-paypal-client-id"
PAYPAL_CLIENT_SECRET="your-paypal-client-secret"
PAYPAL_MODE="sandbox"  # or "live"
```

#### Database Setup
```bash
# Generate Prisma client and run migrations
npm run prisma:migrate

# (Optional) Seed initial data
npm run seed:categories
npm run seed:admin
```

#### Start Backend Server
```bash
# Development mode
npm run dev

# Production build
npm run build
npm start
```

### 3. Frontend Setup

#### Install Dependencies
```bash
cd ../fontend  # Note: intentional typo in directory name
npm install
```

#### Environment Configuration
Create a `.env.local` file in the `fontend` directory:
```env
VITE_API_URL="http://localhost:4000/api"
```

#### Start Frontend Development Server
```bash
npm run dev
```

## 📁 Project Structure

```
shopee-clone/
├── backend/                           # Node.js API Server
│   ├── src/
│   │   ├── controllers/              # Business logic handlers
│   │   ├── services/                 # Business logic & helpers
│   │   ├── routes/                   # API route definitions
│   │   ├── sellerRoutes/             # Seller-specific routes
│   │   ├── middlewares/              # Express middlewares
│   │   ├── jobs/                     # Background processes
│   │   ├── utils/                    # Utility functions
│   │   ├── types/                    # TypeScript definitions
│   │   ├── app.ts                    # Express app setup
│   │   └── server.ts                 # Server entry point
│   ├── prisma/
│   │   ├── schema.prisma            # Database schema
│   │   └── migrations/              # Schema migrations
│   └── package.json
├── fontend/                          # React SPA Frontend
│   ├── src/
│   │   ├── api/                     # API client wrappers
│   │   ├── components/              # Reusable UI components
│   │   ├── screens/                 # Page components
│   │   ├── routes/                  # Route definitions
│   │   ├── store/                   # Zustand state stores
│   │   ├── hooks/                   # Custom React hooks
│   │   ├── providers/               # Context providers
│   │   ├── i18n/                    # Internationalization
│   │   ├── lib/                     # Library configurations
│   │   ├── types/                   # TypeScript types
│   │   └── assets/                  # Static assets
│   ├── public/                      # Public static files
│   └── package.json
├── .gitignore
└── README.md
```

## 🔌 API Documentation

### Base URL
```
http://localhost:4000/api
```

### Authentication
Most endpoints require JWT authentication via Bearer token:
```
Authorization: Bearer <jwt-token>
```

### Key Endpoints

#### Authentication
- `POST /auth/login` - User login
- `POST /auth/register` - User registration
- `GET /auth/me` - Get current user

#### Products
- `GET /products` - List products (paginated)
- `GET /products/:id` - Get product details
- `GET /products/search` - Search products
- `POST /products/:id/reviews` - Add product review

#### Cart & Orders
- `GET /cart` - Get user's cart
- `POST /cart/items` - Add item to cart
- `POST /orders` - Create new order
- `GET /orders` - Get user's orders

#### Seller API (`/seller/*`)
- `POST /seller/auth/login` - Seller login
- `GET /seller/products` - Get seller's products
- `POST /seller/products` - Create product
- `GET /seller/orders` - Get seller's orders

#### Admin API (`/admin/*`)
- `POST /admin/login` - Admin login
- `GET /admin/dashboard/stats` - Dashboard statistics
- `GET /admin/users` - List all users
- `GET /admin/products` - List all products

#### Shipping
- `GET /shipping/provinces` - Get provinces
- `POST /shipping/fee` - Calculate shipping fee
- `POST /shipping/create-order` - Create shipping order

#### Chat
- `GET /chat/threads/user` - Get user's chat threads
- `POST /chat/message` - Send message

For complete API documentation, see the Postman collection or Swagger docs.

## 🗄️ Database Schema

The application uses PostgreSQL with the following main entities:

- **Users**: Buyers, sellers, and admins
- **Products**: Marketplace items with variants
- **Categories**: Hierarchical product categories
- **Orders**: Customer orders with items
- **Cart Items**: Shopping cart contents
- **Reviews**: Product ratings and feedback
- **Chat**: Real-time messaging system
- **Shipping**: GHN integration tracking
- **Vouchers**: Discount codes and promotions

See `backend/prisma/schema.prisma` for the complete database schema.

## 🔧 Available Scripts

### Backend Scripts
```bash
npm run dev              # Start development server
npm run build            # Build for production
npm start                # Run production server
npm run prisma:migrate   # Run database migrations
npm run prisma:studio    # Open Prisma Studio
npm run seed:categories  # Seed categories
npm run setup:admin      # Setup admin account
```

### Frontend Scripts
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Use ESLint for code quality
- Write meaningful commit messages
- Test your changes thoroughly
- Update documentation as needed

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by Shopee e-commerce platform
- Built with modern web technologies
- Thanks to the open-source community

## 📞 Support

For support, email hacphichien@gmail.com or create an issue in the repository.

---

**Note**: This is an educational project demonstrating full-stack web development. Not intended for production use without proper security audits and testing.</content>
<parameter name="filePath">d:\do-an-chuyen-nganh\Shoppe\shopee-clone\README.md
