
# 📝 Shopee Clone Full Architecture Report

## 🔹 Backend Structure
```
- **app.ts** [File]
- **controllers\account.controller.ts** [Controller]
- **controllers\admin\auth.controller.ts** [Controller]
- **controllers\admin\seller.controller.ts** [Controller]
- **controllers\admin\user.controller.ts** [Controller]
- **controllers\admin\voucher.controller.ts** [Controller]
- **controllers\auth.controller.ts** [Controller]
- **controllers\cart.controller.ts** [Controller] → Exports: getCartCountController
- **controllers\category.controller.ts** [Controller] → Exports: getProductsByCategory, getProductsByCategorySlug, getCategories
- **controllers\chat.controller.ts** [Controller]
- **controllers\complaint.controller.ts** [Controller]
- **controllers\order.controller.ts** [Controller]
- **controllers\product.controller.ts** [Controller] → Exports: getProductController, addProductReviewController, addProductFeedbackController, searchKeywords, searchHandler
- **controllers\review.controller.ts** [Controller]
- **controllers\seller\analytics.controller.ts** [Controller]
- **controllers\seller\auth.controller.ts** [Controller] → Exports: sellerRegisterController, sellerLoginController, refreshSellerTokenController, sellerMeController
- **controllers\seller\getSellerProducts.ts** [Controller] → Exports: getSellerProducts
- **controllers\seller\order.controller.ts** [Controller]
- **controllers\seller\productSeller.controller.ts** [Controller] → Exports: createSellerProduct, getSellerProducts, getSellerProductById, updateSellerProduct, deleteSellerProduct
- **controllers\seller\settings.controller.ts** [Controller]
- **controllers\seller\tempCodeRunnerFile.ts** [Controller]
- **controllers\seller\updateOrderStatus.controller.ts** [Controller]
- **controllers\seller\upload.controller.ts** [Controller] → Exports: uploadSellerImage
- **controllers\seller\voucher.controller.ts** [Controller]
- **controllers\shop.controller.ts** [Controller] → Exports: getShopSummaries, getProductsBySeller, getShopInfo, getMallShops
- **controllers\voucher.controller.ts** [Controller]
- **middlewares\auth.ts** [File]
- **middlewares\authAdmin.ts** [File] → Exports: requireAuthAdmin
- **middlewares\authSeller.ts** [File] → Exports: requireAuthSeller
- **middlewares\errorHandler.ts** [File]
- **middlewares\upload.ts** [File] → Exports: upload, authSeller
- **prismaClient.ts** [File] → Exports: prisma
- **routes\index.ts** [Router] → Routes: GET /
- **routes\modules\account.routes.ts** [Router] → Routes: GET /, PUT /, POST /avatar, PUT /password, GET /addresses, POST /addresses, PUT /addresses/:id, DELETE /addresses/:id, PUT /addresses/:id/default
- **routes\modules\admin.routes.ts** [Router] → Routes: POST /login, GET /me, GET /vouchers, POST /vouchers, GET /users, GET /users/:id, POST /users, PUT /users/:id, DELETE /users/:id, GET /sellers, GET /sellers/:id, POST /sellers, PUT /sellers/:id, DELETE /sellers/:id
- **routes\modules\auth.routes.ts** [Router] → Routes: POST /login, POST /register, GET /me
- **routes\modules\cart.routes.ts** [Router] → Routes: GET /, POST /items, PUT /items/:product_id, DELETE /items/:product_id, GET /count
- **routes\modules\category.routes.ts** [Router] → Routes: GET /, GET /tree, GET /:id/attributes, GET /:categoryId/products, GET /slug/:slug/products
- **routes\modules\chat.routes.ts** [Router] → Routes: GET /threads/user, POST /threads, GET /threads/seller, POST /message, POST /message/seller, GET /messages/:threadId, GET /messages/:threadId/seller, POST /system-message
- **routes\modules\order.routes.ts** [Router] → Routes: GET /orders, POST /, GET /all, GET /:id
- **routes\modules\product.routes.ts** [Router] → Routes: GET /, GET /keywords, GET /search, GET /:id, GET /:id/reviews, POST /:id/reviews, POST /:id/feedback
- **routes\modules\review.routes.ts** [Router] → Routes: POST /, GET /user, GET /:reviewId/media, POST /:reviewId/like, PUT /:reviewId, DELETE /:reviewId
- **routes\modules\shop.routes.ts** [Router] → Routes: GET /summary, GET /mall, GET /:seller_id, GET /:seller_id/products
- **routes\modules\voucher.routes.ts** [Router] → Routes: GET /public, GET /me, POST /:voucherId/save
- **scripts\check-admin-setup.ts** [File]
- **scripts\create-admin-table.ts** [File]
- **scripts\force-regenerate-prisma.ts** [File]
- **scripts\setup-admin.ts** [File]
- **scripts\update-admin-table.ts** [File]
- **seeds\admin.ts** [File]
- **seeds\categories.ts** [File]
- **sellerRoutes\index.ts** [File]
- **sellerRoutes\modulesSeller\sellerAnalytics.routes.ts** [Router] → Routes: GET /stats, GET /analytics, GET /export, POST /email-report
- **sellerRoutes\modulesSeller\sellerAuth.ts** [File]
- **sellerRoutes\modulesSeller\sellerOrder.routes.ts** [Router] → Routes: GET /sold, GET /:id, GET /:id/timeline, POST /:id/tracking, PATCH /:id/status
- **sellerRoutes\modulesSeller\sellerProduct.ts** [File]
- **sellerRoutes\modulesSeller\sellerReview.routes.ts** [Router] → Routes: GET /reviews, POST /reviews/:reviewId/reply
- **sellerRoutes\modulesSeller\sellerSettings.routes.ts** [Router] → Routes: GET /profile, PUT /profile, PATCH /profile, PUT /payment, PATCH /payment, PUT /shipping, PATCH /shipping, POST /security/password
- **sellerRoutes\modulesSeller\sellerVoucher.routes.ts** [Router] → Routes: GET /, POST /
- **sellerRoutes\modulesSeller\uploadSeller.routes.ts** [Router] → Routes: POST /
- **server.ts** [File]
- **services\auth.service.ts** [Service]
- **services\cart.service.ts** [Service]
- **services\chat.service.ts** [Service]
- **services\order.service.ts** [Service]
- **services\product.service.ts** [Service] → Exports: getProductById
- **services\review.service.ts** [Service]
- **services\seller\auth.service.ts** [Service]
- **services\seller\order.service.ts** [Service]
- **services\seller\product.service.ts** [Service] → Exports: SellerProductService
- **types\nodemailer.d.ts** [File]
- **utils\cloudinary.ts** [File]
- **utils\email.ts** [File]
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
  - image          String?    @db.VarChar(255)
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
  - id             String         @id @default(dbgenerated("gen_random_uuid()"))
  - total          Decimal        @db.Decimal(10, 2)
  - status         String         @default("pending")
  - created_at     DateTime       @default(now())
  - updated_at     DateTime       @default(now())
  - user_id        String?
  - system_voucher Json?
  - payment_method String?
  - complaints     complaints[]
  - order_item     order_item[]
  - user           user?          @relation(fields: [user_id], references: [id], onDelete: Cascade, onUpdate: NoAction)
  - seller_order   seller_order[]

### Model: product
  - id              String            @id @default(dbgenerated("gen_random_uuid()"))
  - title           String
  - description     String?
  - price           Decimal           @db.Decimal(10, 2)
  - stock           Int               @default(0)
  - images          String[]
  - seller_id       String
  - category_id     String?
  - dimensions      Json?
  - discount        Decimal?          @default(0) @db.Decimal(10, 2)
  - rating          Float?            @default(0)
  - reviews_count   Int?              @default(0)
  - tags            String[]
  - attributes      Json?
  - status          String?           @default("active")
  - weight          Float?
  - created_at      DateTime          @default(now())
  - updated_at      DateTime          @default(now())
  - cart_item       cart_item[]
  - complaints      complaints[]
  - order_item      order_item[]
  - category        category?         @relation(fields: [category_id], references: [id])
  - seller          seller            @relation(fields: [seller_id], references: [id])
  - product_reviews product_reviews[]
  - vouchers        vouchers[]
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
  - updated_at                  DateTime                      @updatedAt
  - password                    String
  - avatar                      String?
  - shop_mall                   shop_status?                  @default(normal)
  - chat_threads                chat_threads[]
  - complaints                  complaints[]
  - messages                    messages[]
  - product                     product[]
  - review_replies              review_replies[]
  - seller_order                seller_order[]
  - seller_payout_settings      seller_payout_settings[]
  - seller_shipping_preferences seller_shipping_preferences[]
  - vouchers                    vouchers[]

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
  - id                                      String               @id @default(dbgenerated("gen_random_uuid()"))
  - email                                   String               @unique
  - phone_number                            String?              @unique @db.VarChar(20)
  - password                                String
  - name                                    String?
  - created_at                              DateTime             @default(now())
  - updated_at                              DateTime             @default(now())
  - avatar                                  String?
  - address                                 address[]
  - cart_item                               cart_item[]
  - chat_threads                            chat_threads[]
  - complaint_comments                      complaint_comments[]
  - complaints_complaints_assigned_toTouser complaints[]         @relation("complaints_assigned_toTouser")
  - complaints_complaints_user_idTouser     complaints[]         @relation("complaints_user_idTouser")
  - messages                                messages[]
  - orders                                  orders[]
  - product_reviews                         product_reviews[]
  - review_likes                            review_likes[]
  - user_vouchers                           user_vouchers[]

### Model: seller_order
  - id                String    @id @default(dbgenerated("gen_random_uuid()"))
  - order_id          String
  - seller_id         String
  - total             Decimal   @db.Decimal
  - shop_voucher      Json?
  - shipping_provider String?
  - shipping_fee      Decimal?  @default(0) @db.Decimal
  - seller_status     String?   @default("pending")
  - created_at        DateTime? @default(now()) @db.Timestamp(6)
  - updated_at        DateTime? @default(now()) @db.Timestamp(6)
  - orders            orders    @relation(fields: [order_id], references: [id], onDelete: Cascade, onUpdate: NoAction)
  - seller            seller    @relation(fields: [seller_id], references: [id], onDelete: Cascade, onUpdate: NoAction)
  - 
  - @@index([order_id], map: "idx_seller_order_order_id")
  - @@index([seller_id], map: "idx_seller_order_seller_id")

### Model: user_vouchers
  - id          String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  - user_id     String
  - saved_at    DateTime? @default(now()) @db.Timestamptz(6)
  - used_at     DateTime? @db.Timestamptz(6)
  - usage_count Int       @default(0)
  - voucher_id  String    @db.Uuid
  - user        user      @relation(fields: [user_id], references: [id], onDelete: Cascade)
  - vouchers    vouchers  @relation(fields: [voucher_id], references: [id], onDelete: Cascade)
  - 
  - @@unique([user_id, voucher_id])
  - @@index([voucher_id])

### Model: vouchers
  - id                   String          @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  - code                 String          @unique
  - source               String
  - seller_id            String
  - type                 String
  - discount_type        String
  - discount_value       Decimal         @db.Decimal(12, 2)
  - max_discount_amount  Decimal?        @db.Decimal(12, 2)
  - min_order_amount     Decimal?        @default(0) @db.Decimal(12, 2)
  - product_id           String?
  - applicable_user_id   String?         @db.Uuid
  - usage_limit_per_user Int?            @default(1)
  - usage_limit_total    Int?            @default(1000)
  - used_count           Int?            @default(0)
  - start_at             DateTime        @db.Timestamptz(6)
  - end_at               DateTime        @db.Timestamptz(6)
  - status               String?         @default("ACTIVE")
  - user_vouchers        user_vouchers[]
  - product              product?        @relation(fields: [product_id], references: [id])
  - seller               seller?          @relation(fields: [seller_id], references: [id], onDelete: Cascade)
  - 
  - @@index([seller_id], map: "idx_voucher_seller")
  - @@index([status], map: "idx_voucher_status")

### Model: chat_threads
  - id         String     @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  - user_id    String
  - seller_id  String
  - created_at DateTime?  @default(now()) @db.Timestamptz(6)
  - updated_at DateTime?  @default(now()) @db.Timestamptz(6)
  - seller     seller     @relation(fields: [seller_id], references: [id], onDelete: NoAction, onUpdate: NoAction)
  - user       user       @relation(fields: [user_id], references: [id], onDelete: NoAction, onUpdate: NoAction)
  - messages   messages[]

### Model: complaint_comments
  - id           String     @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  - complaint_id String     @db.Uuid
  - sender_id    String
  - sender_role  String     @db.VarChar(10)
  - content      String?
  - created_at   DateTime?  @default(now()) @db.Timestamptz(6)
  - complaints   complaints @relation(fields: [complaint_id], references: [id], onDelete: Cascade, onUpdate: NoAction)
  - user         user       @relation(fields: [sender_id], references: [id], onDelete: NoAction, onUpdate: NoAction)

### Model: complaints
  - id                                String               @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  - user_id                           String
  - seller_id                         String
  - order_id                          String?
  - product_id                        String?
  - type                              String               @db.VarChar(50)
  - description                       String?
  - attachments                       Json?                @db.Json
  - status                            String               @default("NEW") @db.VarChar(20)
  - assigned_to                       String?
  - created_at                        DateTime?            @default(now()) @db.Timestamptz(6)
  - updated_at                        DateTime?            @default(now()) @db.Timestamptz(6)
  - complaint_comments                complaint_comments[]
  - user_complaints_assigned_toTouser user?                @relation("complaints_assigned_toTouser", fields: [assigned_to], references: [id], onDelete: NoAction, onUpdate: NoAction)
  - orders                            orders?              @relation(fields: [order_id], references: [id], onDelete: NoAction, onUpdate: NoAction)
  - product                           product?             @relation(fields: [product_id], references: [id], onDelete: NoAction, onUpdate: NoAction)
  - seller                            seller               @relation(fields: [seller_id], references: [id], onDelete: NoAction, onUpdate: NoAction)
  - user_complaints_user_idTouser     user                 @relation("complaints_user_idTouser", fields: [user_id], references: [id], onDelete: NoAction, onUpdate: NoAction)

### Model: messages
  - id           String       @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  - thread_id    String       @db.Uuid
  - user_id      String?
  - seller_id    String?
  - content      String?
  - attachments  Json?        @db.Json
  - status       String       @default("SENT") @db.VarChar(10)
  - pinned       Boolean?     @default(false)
  - created_at   DateTime?    @default(now()) @db.Timestamptz(6)
  - sender_type  String       @default("USER") @db.VarChar(10)
  - order_id     String?      @db.Uuid
  - seller       seller?      @relation(fields: [seller_id], references: [id], onDelete: NoAction, onUpdate: NoAction)
  - chat_threads chat_threads @relation(fields: [thread_id], references: [id], onDelete: Cascade, onUpdate: NoAction)
  - user         user?        @relation(fields: [user_id], references: [id], onDelete: NoAction, onUpdate: NoAction)
  - 
  - @@index([seller_id], map: "idx_messages_seller")
  - @@index([thread_id], map: "idx_messages_thread")
  - @@index([user_id], map: "idx_messages_user")
  - @@index([order_id], map: "idx_messages_order")

### Model: product_reviews
  - id              String           @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  - product_id      String
  - user_id         String
  - rating          Int
  - title           String?          @db.VarChar(255)
  - content         String?
  - attachments     Json?            @db.Json
  - anonymous       Boolean?         @default(false)
  - like_count      Int?             @default(0)
  - created_at      DateTime?        @default(now()) @db.Timestamptz(6)
  - updated_at      DateTime?        @default(now()) @db.Timestamptz(6)
  - seller_order_id String?          @unique(map: "unique_review_per_seller_order") @db.Uuid
  - product         product          @relation(fields: [product_id], references: [id], onDelete: NoAction, onUpdate: NoAction)
  - user            user             @relation(fields: [user_id], references: [id], onDelete: NoAction, onUpdate: NoAction)
  - review_likes    review_likes[]
  - review_media    review_media[]
  - review_replies  review_replies[]
  - 
  - @@index([product_id], map: "idx_product_reviews_product")
  - @@index([seller_order_id], map: "idx_product_reviews_seller_order")
  - @@index([user_id], map: "idx_product_reviews_user")

### Model: review_likes
  - id              String          @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  - review_id       String          @db.Uuid
  - user_id         String
  - created_at      DateTime?       @default(now()) @db.Timestamptz(6)
  - product_reviews product_reviews @relation(fields: [review_id], references: [id], onDelete: Cascade, onUpdate: NoAction)
  - user            user            @relation(fields: [user_id], references: [id], onDelete: NoAction, onUpdate: NoAction)
  - 
  - @@unique([review_id, user_id])

### Model: review_media
  - id              String          @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  - review_id       String          @db.Uuid
  - type            String          @db.VarChar(10)
  - url             String
  - created_at      DateTime?       @default(now()) @db.Timestamptz(6)
  - product_reviews product_reviews @relation(fields: [review_id], references: [id], onDelete: Cascade, onUpdate: NoAction)

### Model: review_replies
  - id              String          @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  - review_id       String          @db.Uuid
  - seller_id       String
  - content         String?
  - created_at      DateTime?       @default(now()) @db.Timestamptz(6)
  - product_reviews product_reviews @relation(fields: [review_id], references: [id], onDelete: Cascade, onUpdate: NoAction)
  - seller          seller          @relation(fields: [seller_id], references: [id], onDelete: NoAction, onUpdate: NoAction)

### Model: admin
  - id         String    @id @default(dbgenerated("uuid_generate_v4()")) @db.Uuid
  - name       String    @db.VarChar(255)
  - email      String    @unique @db.VarChar(255)
  - password   String    @db.VarChar(255)
  - created_at DateTime? @default(now()) @db.Timestamp(6)
  - updated_at DateTime? @default(now()) @db.Timestamp(6)
  - 
  - @@index([email], map: "idx_admin_email")

### Model: address
  - id           String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  - user_id      String
  - full_name    String
  - phone        String    @db.VarChar(20)
  - address_line String
  - city         String
  - district     String
  - ward         String
  - is_default   Boolean   @default(false)
  - created_at   DateTime? @default(now()) @db.Timestamp(6)
  - updated_at   DateTime? @default(now()) @db.Timestamp(6)
  - user         user      @relation(fields: [user_id], references: [id], onDelete: Cascade, onUpdate: NoAction, map: "fk_address_user")


## 🔹 Frontend Structure
```
- admin\AdminApp.tsx → Routes: /login, /*, /dashboard, /products, /sellers, /users, /orders, /analytics, /settings, /
- api\admin.ts
- api\adminSellers.ts
- api\adminUsers.ts
- api\adminVouchers.ts
- api\chat.ts
- api\reviews.ts
- api\sellerapi\seller.ts
- api\sellerapi\sellerCart.ts
- api\sellerapi\sellerOrders.ts
- api\sellerapi\sellerProducts.ts
- api\sellerapi\sellerSettings.tsx
- api\sellerapi\vouchers.ts
- api\userapi\account.ts
- api\userapi\client.ts
- api\userapi\orders.ts
- api\vouchers.ts
- App.css
- App.tsx
- assets\react.svg
- components\admin\AdminGuard.tsx
- components\admin\AdminLayout.tsx
- components\admin\AdminLogin.tsx
- components\auth\AuthGuard.tsx
- components\auth\AuthLayout.tsx
- components\auth\PromotionalBanner.tsx
- components\chat\ChatBox.tsx
- components\chat\ChatWidget.tsx
- components\home\ScrollToTop.tsx
- components\home\SearchBar.tsx
- components\layout\Footer.tsx
- components\layout\Header.tsx
- components\layout\HomeLayout.tsx
- components\layout\UserLayout.tsx
- components\product\ProductListSection.tsx
- components\review\ReviewForm.tsx
- components\review\ReviewItem.tsx
- components\review\ReviewList.tsx
- components\review\ReviewMediaGallery.tsx
- components\review\ReviewSection.tsx
- components\review\SellerReplyForm.tsx
- components\seller\AuthGuard.tsx
- components\seller\SellerLayout.tsx
- components\seller\SellerLogin.tsx
- components\seller\SellerRegister.tsx
- components\seller\UploadImage.tsx
- components\shops\FeaturedShops.tsx
- hooks\useChat.ts
- hooks\useMall.ts
- hooks\useReviews.ts
- i18n\index.ts
- i18n\locales\en.json
- i18n\locales\vi.json
- i18n\types.d.ts
- index.css
- lib\react-query.ts
- main.tsx
- providers\AppProviders.tsx
- routes\AdminRoutes.tsx → Routes: /login, /*, /dashboard, /products, /sellers, /users, /orders, /analytics, /settings, /vouchers, /
- routes\AppRoutes.tsx → Routes: /login, /register, /, /products/:id, /cart, /flash-sale, /admin/*, /category/:slug, /shop/:seller_id, /seller/*, /search, *, /account, chat, orders, /user, orders, profile, chat, vouchers, notifications
- routes\SellerRoutes.tsx → Routes: register, login, home, dashboard, upload, orders, analytics, settings, chats, reviews, voucher, *
- screens\admin\AdminDashboard.tsx
- screens\admin\AdminEvent.tsx
- screens\admin\AdminSellers.tsx
- screens\admin\AdminUsers.tsx
- screens\admin\AdminVoucher.tsx
- screens\admin\CategoryPage.tsx
- screens\client\AccountPage.tsx
- screens\client\CartPage.tsx
- screens\client\CategoryPage.tsx
- screens\client\ChatPage.tsx
- screens\client\EventPage.tsx
- screens\client\FlashSalePage.tsx
- screens\client\HomePage.tsx
- screens\client\LoginPage.tsx
- screens\client\OrdersPage.tsx
- screens\client\ProductPage.tsx
- screens\client\RegisterPage.tsx
- screens\client\SearchResultsPage.tsx
- screens\client\ShopPage.tsx
- screens\client\VoucherPage.tsx
- screens\seller\Loginseller.tsx
- screens\seller\SellerAnalytics.tsx
- screens\seller\SellerChatPage.tsx
- screens\seller\SellerDashboard.tsx
- screens\seller\SellerHome.tsx
- screens\seller\SellerOrders.tsx
- screens\seller\SellerReview.tsx
- screens\seller\SellerSettings.tsx
- screens\seller\SellerUploadPage.tsx
- screens\seller\SellerVoucher.tsx
- store\AdminAuth.ts
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
