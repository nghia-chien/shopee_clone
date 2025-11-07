
# 📝 Shopee Clone Full Architecture Report

## 🔹 Backend Structure
```
- **app.ts** [File]
- **controllers\auth.controller.ts** [Controller]
- **controllers\cart.controller.ts** [Controller] → Exports: getCartCountController
- **controllers\category.controller.ts** [Controller]
- **controllers\order.controller.ts** [Controller]
- **controllers\product.controller.ts** [Controller] → Exports: getProductController, addProductReviewController, addProductFeedbackController, searchKeywords, searchHandler
- **controllers\seller\analytics.controller.ts** [Controller]
- **controllers\seller\auth.controller.ts** [Controller] → Exports: sellerRegisterController, sellerLoginController, sellerMeController, sellerExchangeController
- **controllers\seller\cart.controller.ts** [Controller]
- **controllers\seller\getSellerProducts.ts** [Controller] → Exports: getSellerProducts
- **controllers\seller\order.controller.ts** [Controller]
- **controllers\seller\productSeller.controller.ts** [Controller] → Exports: createSellerProduct, getSellerProducts, getSellerProductById, updateSellerProduct, deleteSellerProduct
- **controllers\seller\settings.controller.ts** [Controller]
- **controllers\seller\updateOrderStatus.controller.ts** [Controller]
- **controllers\seller\upload.controller.ts** [Controller] → Exports: uploadSellerImage
- **controllers\shop.controller.ts** [Controller] → Exports: getShopSummaries, getProductsBySeller
- **middlewares\auth.ts** [File]
- **middlewares\authSeller.ts** [File] → Exports: requireAuthSeller
- **middlewares\errorHandler.ts** [File]
- **middlewares\upload.ts** [File] → Exports: upload, authSeller
- **prismaClient.ts** [File] → Exports: prisma
- **routes\index.ts** [Router] → Routes: GET /
- **routes\modules\auth.routes.ts** [Router] → Routes: POST /login, POST /register, GET /me
- **routes\modules\cart.routes.ts** [Router] → Routes: GET /, POST /items, PUT /items/:product_id, DELETE /items/:product_id, GET /count
- **routes\modules\category.routes.ts** [Router] → Routes: GET /tree, GET /:id/attributes
- **routes\modules\order.routes.ts** [Router] → Routes: GET /, POST /, GET /:id
- **routes\modules\product.routes.ts** [Router] → Routes: GET /, GET /keywords, GET /search, GET /:id, POST /:id/reviews, POST /:id/feedback
- **routes\modules\shop.routes.ts** [Router] → Routes: GET :seller_id, GET summary
- **seeds\categories.ts** [File]
- **sellerRoutes\index.ts** [File]
- **sellerRoutes\modulesSeller\sellerAnalytics.routes.ts** [Router] → Routes: GET /stats, GET /analytics
- **sellerRoutes\modulesSeller\sellerAuth.ts** [File]
- **sellerRoutes\modulesSeller\sellerCart.routes.ts** [Router] → Routes: GET /, POST /, PUT /:product_id, DELETE /:product_id
- **sellerRoutes\modulesSeller\sellerOrder.routes.ts** [Router] → Routes: POST /, GET /purchased, GET /sold, GET /:id, PATCH /:id/status
- **sellerRoutes\modulesSeller\sellerProduct.ts** [File]
- **sellerRoutes\modulesSeller\sellerSettings.routes.ts** [Router] → Routes: PUT /profile, PUT /payment, PUT /shipping, PUT /security/password
- **sellerRoutes\modulesSeller\uploadSeller.routes.ts** [Router] → Routes: POST /
- **server.ts** [File]
- **services\auth.service.ts** [Service]
- **services\cart.service.ts** [Service]
- **services\order.service.ts** [Service]
- **services\product.service.ts** [Service] → Exports: getProductById
- **services\seller\auth.service.ts** [Service]
- **services\seller\order.service.ts** [Service]
- **services\seller\product.service.ts** [Service] → Exports: SellerProductService
- **utils\cloudinary.ts** [File]
- **utils\prisma.ts** [File] → Exports: prisma
```

## 🔹 Prisma Models
### Model: cart_item
  - id         String  @id @default(dbgenerated("gen_random_uuid()"))
  - user_id    String
  - product_id String
  - quantity   Int     @default(1)
  - product    product @relation(fields: [product_id], references: [id])
  - user       user    @relation(fields: [user_id], references: [id])
  - 
  - @@unique([user_id, product_id], map: "cart_item_user_product_key")

### Model: category
  - id             String     @id @default(dbgenerated("gen_random_uuid()"))
  - name           String
  - slug           String     @unique
  - parent_id      String?
  - level          Int        @default(1)
  - path           String[]
  - category       category?  @relation("categoryTocategory", fields: [parent_id], references: [id])
  - other_category category[] @relation("categoryTocategory")
  - product        product[]
  - 
  - @@index([parent_id], map: "idx_category_parent_id")

### Model: order_item
  - id         String  @id @default(dbgenerated("gen_random_uuid()"))
  - order_id   String
  - product_id String
  - price      Decimal @db.Decimal(10, 2)
  - quantity   Int     @default(1)
  - orders     orders  @relation(fields: [order_id], references: [id])
  - product    product @relation(fields: [product_id], references: [id])

### Model: orders
  - id         String       @id @default(dbgenerated("gen_random_uuid()"))
  - total      Decimal      @db.Decimal(10, 2)
  - status     String       @default("pending")
  - created_at DateTime     @default(now())
  - updated_at DateTime     @default(now())
  - user_id    String?
  - order_item order_item[]
  - user       user?        @relation(fields: [user_id], references: [id], onDelete: Cascade, onUpdate: NoAction)

### Model: product
  - id            String       @id @default(dbgenerated("gen_random_uuid()"))
  - title         String
  - description   String?
  - price         Decimal      @db.Decimal(10, 2)
  - stock         Int          @default(0)
  - images        String[]
  - seller_id     String
  - category_id   String?
  - dimensions    Json?
  - discount      Decimal?     @default(0) @db.Decimal(10, 2)
  - rating        Float?       @default(0)
  - reviews_count Int?         @default(0)
  - tags          String[]
  - attributes    Json?
  - status        String?      @default("active")
  - weight        Float?
  - created_at    DateTime     @default(now())
  - updated_at    DateTime     @default(now())
  - cart_item     cart_item[]
  - order_item    order_item[]
  - category      category?    @relation(fields: [category_id], references: [id])
  - seller        seller       @relation(fields: [seller_id], references: [id])
  - 
  - @@index([category_id], map: "idx_product_category_id")
  - @@index([seller_id], map: "idx_product_seller_id")

### Model: seller
  - id                          String                        @id @default(dbgenerated("gen_random_uuid()"))
  - name                        String
  - email                       String                        @unique
  - phone_number                String?                       @unique @db.VarChar(20)
  - address                     Json?
  - rating                      Float?                        @default(0)
  - status                      String                        @default("active")
  - created_at                  DateTime                      @default(now())
  - updated_at                  DateTime                      @default(now())
  - password                    String
  - product                     product[]
  - seller_payout_settings      seller_payout_settings[]
  - seller_shipping_preferences seller_shipping_preferences[]

### Model: seller_payout_settings
  - id                String   @id @default(dbgenerated("gen_random_uuid()"))
  - seller_id         String
  - payout_method     String
  - account_number    String
  - bank_name         String?
  - currency          String   @default("VND")
  - min_payout_amount Decimal  @default(0) @db.Decimal(10, 2)
  - payout_frequency  String   @default("weekly")
  - status            String   @default("active")
  - created_at        DateTime @default(now())
  - updated_at        DateTime @default(now())
  - seller            seller   @relation(fields: [seller_id], references: [id])
  - 
  - @@index([seller_id], map: "idx_seller_payout_settings_seller_id")

### Model: seller_shipping_preferences
  - id                      String   @id @default(dbgenerated("gen_random_uuid()"))
  - seller_id               String
  - shipping_methods        Json
  - shipping_rates          Json
  - free_shipping_threshold Decimal  @default(0) @db.Decimal(10, 2)
  - default_warehouse       String?
  - regions_covered         Json?
  - status                  String   @default("active")
  - is_default              Boolean  @default(true)
  - created_at              DateTime @default(now())
  - updated_at              DateTime @default(now())
  - seller                  seller   @relation(fields: [seller_id], references: [id])
  - 
  - @@index([seller_id], map: "idx_seller_shipping_preferences_seller_id")

### Model: user
  - id           String      @id @default(dbgenerated("gen_random_uuid()"))
  - email        String      @unique
  - phone_number String?     @unique @db.VarChar(20)
  - password     String
  - name         String?
  - created_at   DateTime    @default(now())
  - updated_at   DateTime    @default(now())
  - cart_item    cart_item[]
  - orders       orders[]


## 🔹 Frontend Structure
```
- admin\AdminApp.tsx
- api\client.ts
- api\seller.ts
- api\sellerCart.ts
- api\sellerOrders.ts
- api\sellerProducts.ts
- App.css
- App.tsx
- assets\react.svg
- components\auth\AuthGuard.tsx
- components\auth\AuthLayout.tsx
- components\auth\PromotionalBanner.tsx
- components\home\ScrollToTop.tsx
- components\home\SearchBar.tsx
- components\layout\Footer.tsx
- components\layout\Header.tsx
- components\layout\HomeLayout.tsx
- components\product\ProductListSection.tsx
- components\seller\AuthGuard.tsx
- components\seller\SellerLayout.tsx
- components\seller\SellerLogin.tsx
- components\seller\SellerRegister.tsx
- components\seller\UploadImage.tsx
- components\shops\FeaturedShops.tsx
- i18n\index.ts
- i18n\locales\en.json
- i18n\locales\vi.json
- i18n\types.d.ts
- index.css
- lib\react-query.ts
- main.tsx
- providers\AppProviders.tsx
- routes\AppRoutes.tsx → Routes: /login, /register, /, /products/:id, /cart, /orders, /admin/*, /shop/:seller_id, /seller/*, /search, *
- routes\SellerRoutes.tsx → Routes: register, login, home, dashboard, upload, orders, analytics, settings, *
- screens\client\CartPage.tsx
- screens\client\HomePage.tsx
- screens\client\LoginPage.tsx
- screens\client\OrdersPage.tsx
- screens\client\ProductPage.tsx
- screens\client\RegisterPage.tsx
- screens\client\SearchResultsPage.tsx
- screens\client\ShopPage.tsx
- screens\seller\Loginseller.tsx
- screens\seller\SellerAnalytics.tsx
- screens\seller\SellerDashboard.tsx
- screens\seller\SellerHome.tsx
- screens\seller\SellerOrders.tsx
- screens\seller\SellerSettings.tsx
- screens\seller\SellerUploadPage.tsx
- store\auth.ts
- store\SellerAuth.ts
```

## 🔹 Authentication & CRUD Flow

### Seller Auth Flow
1. **Register** → POST /api/seller/auth/register
2. **Login** → POST /api/seller/auth/login
3. **Get current seller** → GET /api/seller/auth/me
4. **Middleware** → requireAuthSeller

### CRUD Product Flow
- **Create Product** → POST /api/seller/product
- **Read Products** → GET /api/seller/product
- **Update Product** → PUT /api/seller/product/:id
- **Delete Product** → DELETE /api/seller/product/:id

### File Upload Flow
- **Frontend** → input file → call /api/seller/upload
- **Backend** → multer middleware → Cloudinary upload → return URL
