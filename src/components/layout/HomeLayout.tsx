import type { ReactNode } from "react";
import { useAuthStore } from "../../store/auth";
import { useNavigate } from "react-router-dom";
import "slick-carousel/slick/slick.css"; 
import "slick-carousel/slick/slick-theme.css";
import Slider from "react-slick";
import { Footer } from "./Footer";
import { Header } from "./Header";

interface HomeLayoutProps {
  children?: ReactNode;
}

export function HomeLayout({ children }: HomeLayoutProps) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // ============================================================================
  // DATA SECTION - TODO: Replace with API calls
  // ============================================================================

  // TODO: API Integration - GET /api/categories
  // Expected response: Array<{ id: string, name: string, icon: string, slug: string }>
  const categories = [
    "Thời Trang Nam", "Thời Trang Nữ", "Điện Thoại & Phụ Kiện", 
    "Thiết Bị Điện Tử", "Máy Tính & Laptop", "Máy Ảnh & Máy Quay Phim",
    "Đồng Hồ", "Giày Dép Nam", "Giày Dép Nữ", "Túi Ví Nam",
    "Túi Ví Nữ", "Phụ Kiện & Trang Sức", "Nhà Cửa & Đời Sống", 
    "Sách & Văn Phòng Phẩm", "Thể Thao & Du Lịch", "Ô Tô & Xe Máy",
    "Mẹ & Bé", "Làm Đẹp & Sức Khỏe", "Thú Cưng", "Voucher & Dịch Vụ"
  ];

  // TODO: API Integration - GET /api/products?type=flash-sale&limit=6
  // Add real-time countdown timer integration
  const flashSaleProducts = Array.from({ length: 6 }, (_, i) => ({
    id: `fs-${i + 1}`,
    name: `Sản phẩm Flash Sale ${i + 1}`,
    price: 99000,
    originalPrice: 299000,
    discount: 67,
    sold: 75 + Math.floor(Math.random() * 20),
    image: "", // TODO: Add CDN image URLs
    stock: 100
  }));

  // TODO: API Integration - GET /api/shops?type=mall&featured=true
  const mallShops = Array.from({ length: 12 }, (_, i) => ({
    id: `shop-${i + 1}`,
    name: `Shop Mall ${i + 1}`,
    logo: "", // TODO: Add shop logo URLs
    isOfficial: true,
    rating: 4.5 + Math.random() * 0.5
  }));

  // TODO: API Integration - GET /api/products?sort=trending&limit=30
  // Add infinite scroll or pagination
  const trendingProducts = Array.from({ length: 30 }, (_, i) => ({
    id: `prod-${i + 1}`,
    name: `Sản phẩm Hot ${i + 1}`,
    description: "Chất lượng cao, giá tốt nhất thị trường",
    price: 129000 + Math.floor(Math.random() * 500000),
    originalPrice: 250000 + Math.floor(Math.random() * 500000),
    sold: Math.floor(Math.random() * 10000),
    rating: 4.0 + Math.random(),
    ratingCount: Math.floor(Math.random() * 1000),
    location: "TP. Hồ Chí Minh",
    image: "", // TODO: Add product image URLs
    freeShip: Math.random() > 0.5,
    discount: Math.floor(Math.random() * 50)
  }));



  // TODO: API Integration - GET /api/banners?position=main
  const mainBanners = [
    { id: 1, image: "/bannerbig1.png", link: "/sale", alt: "Banner 1" },
    { id: 2, image: "/bannerbig2.png", link: "/new-arrivals", alt: "Banner 2" },
    { id: 3, image: "/bannerbig3.png", link: "/brands", alt: "Banner 3" }
  ];
  const subBanners = [
    { id: 1, image: "/banner1.png", link: "/voucher50k", alt: "Voucher 50K" },
    { id: 2, image: "/banner2.png", link: "/freeship", alt: "Miễn Phí Vận Chuyển" }
  ];
  // Quick action items - can be made dynamic via API
  const quickActions = [
    { name: "Shopee Mall", icon: "🏪", link: "/mall" },
    { name: "Bắt Deal 0Đ", icon: "⚡", link: "/deals" },
    { name: "Miễn Phí Ship", icon: "🚚", link: "/freeship" },
    { name: "Voucher 50%", icon: "🎟️", link: "/vouchers" },
    { name: "Hàng Quốc Tế", icon: "🌍", link: "/international" },
    { name: "Nạp Thẻ", icon: "💳", link: "/topup" },
    { name: "Shopee Siêu Rẻ", icon: "💰", link: "/cheap" },
    { name: "Shopee Xu", icon: "💎", link: "/coins" }
  ];

  // ============================================================================
  // HELPER FUNCTIONS
  // ============================================================================

  const formatPrice = (price: number) => {
    return price.toLocaleString("vi-VN");
  };

  const formatSold = (sold: number) => {
    if (sold >= 1000) return `${(sold / 1000).toFixed(1)}k`;
    return sold.toString();
  };

  // TODO: Implement real countdown timer
  const getFlashSaleCountdown = () => {
    return { hours: 12, minutes: 34, seconds: 56 };
  };

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================



  const handleCategoryClick = (category: string) => {
    // TODO: Navigate to category page
    navigate(`/category/${category}`);
  };

  const handleProductClick = (productId: string) => {
    // TODO: Navigate to product detail page
    navigate(`/product/${productId}`);
  };

  const handleShopClick = (shopId: string) => {
    // TODO: Navigate to shop page
    navigate(`/shop/${shopId}`);
  };
  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: true,
    autoplay: true,
    autoplaySpeed: 4000,

  };
  // ============================================================================
  // RENDER COMPONENT
  // ============================================================================

  return (
    <div className="bg-gray-50 w-full overflow-visible">  <Header></Header>
   

      {/* ========================================================================
          MAIN CONTENT AREA
      ======================================================================== */}
        {/* ======================================================================
            BANNER CAROUSEL SECTION (container)
        ====================================================================== */}
        <section className="bg-white rounded-sm shadow-sm mt-4">
          <div className="max-w-[1200px] mx-auto px-4">
          {/* banner chính: bố cục như mẫu, giữ slider hoạt động */}
          <section className="py-4">
            <div className="grid gap-2 md:grid-cols-[800px_1fr]">
              {/* Main Banner (slider) */}
              <div className="rounded-sm overflow-hidden shadow-sm h-[200px] sm:h-[220px] md:h-[235px]">
                <Slider {...settings}>
                  {mainBanners.map((banner) => (
                    <a key={banner.id} href={banner.link}>
                      <img
                        src={banner.image}
                        alt={banner.alt}
                        className="w-full h-full object-cover rounded-sm"
                      />
                    </a>
                  ))}
                </Slider>
              </div>

              {/* Sub Banners stacked to match total height */}
              <div className="hidden md:flex flex-col gap-2 h-[235px]">
                {subBanners.map((banner) => (
                  <a
                    key={banner.id}
                    href={banner.link}
                    className="flex-1 rounded-sm overflow-hidden shadow-sm"
                  >
                    <img
                      src={banner.image}
                      alt={banner.alt}
                      className="w-full h-full object-cover rounded-sm"
                    />
                  </a>
                ))}
              </div>
            </div>
          </section>
          </div>
        </section>

        {/* ======================================================================
            QUICK ACTIONS SECTION (separate card)
        ====================================================================== */}
        <section className="bg-white rounded-sm shadow-sm mt-3">
          <div className="max-w-[1200px] mx-auto px-4 py-4">
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-4">
              {quickActions.map((action) => (
                <div
                  key={action.name}
                  className="flex flex-col items-center gap-2 cursor-pointer group"
                  onClick={() => navigate(action.link)}
                >
                  <div className="w-14 h-14 bg-gradient-to-br from-orange-100 to-pink-100 rounded-lg flex items-center justify-center group-hover:shadow-md group-hover:scale-105 transition-all">
                    <span className="text-2xl">{action.icon}</span>
                  </div>
                  <span className="text-xs text-center text-gray-700 group-hover:text-orange-500 transition">
                    {action.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <main className="max-w-7xl mx-auto px-4 py-6 space-y-6 w-full overflow-x-hidden">
        {/* ======================================================================
            CATEGORIES SECTION
            TODO: 
            - Fetch from API
            - Add category icons
            - Implement category filtering
            - Add breadcrumb navigation on category pages
        ====================================================================== */}
        <section className="bg-white rounded-sm p-6 shadow-sm max-w-[1200px] mx-auto">
          <h2 className="text-gray-500 text-sm mb-4 uppercase font-semibold">Danh Mục</h2>
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-10 gap-4">
            {categories.map((cat, i) => (
              <div 
                key={i}
                className="flex flex-col items-center gap-2 cursor-pointer group"
                onClick={() => handleCategoryClick(cat)}
              >
                <div className="w-16 h-16 bg-gray-50 border-2 border-gray-200 rounded-lg flex items-center justify-center group-hover:border-orange-500 group-hover:shadow-md transition-all">
                  <div className="w-10 h-10 bg-gradient-to-br from-orange-300 to-pink-300 rounded"></div>
                </div>
                <span className="text-xs text-center text-gray-700 line-clamp-2 group-hover:text-orange-500 transition">
                  {cat}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* ======================================================================
            FLASH SALE SECTION
            TODO:
            - Real-time countdown timer
            - Progress bar animation
            - Auto-refresh product availability
            - Add "Nhắc tôi" (remind me) feature
            - Socket connection for live updates
        ====================================================================== */}
        <section className="bg-white rounded-sm shadow-sm">
          <div className="flex items-center justify-between px-6 py-4 border-b">
            <div className="flex items-center gap-4">
              <h2 className="text-orange-500 text-xl font-bold uppercase tracking-wide">
                ⚡ Flash Sale
              </h2>
              
              {/* Countdown Timer */}
              <div className="flex items-center gap-2">
                {(() => {
                  const time = getFlashSaleCountdown();
                  return (
                    <>
                      <div className="bg-black text-white text-sm px-2.5 py-1 rounded font-mono">
                        {String(time.hours).padStart(2, '0')}
                      </div>
                      <span className="text-black font-bold">:</span>
                      <div className="bg-black text-white text-sm px-2.5 py-1 rounded font-mono">
                        {String(time.minutes).padStart(2, '0')}
                      </div>
                      <span className="text-black font-bold">:</span>
                      <div className="bg-black text-white text-sm px-2.5 py-1 rounded font-mono">
                        {String(time.seconds).padStart(2, '0')}
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
            
            <button className="text-orange-500 hover:text-orange-600 flex items-center gap-1 font-medium transition">
              Xem tất cả
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"/>
              </svg>
            </button>
          </div>
          
          {/* Flash Sale Products Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-px bg-gray-100 p-px">
            {flashSaleProducts.map((product) => (
              <div 
                key={product.id}
                className="bg-white p-4 hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer"
                onClick={() => handleProductClick(product.id)}
              >
                {/* Product Image */}
                <div className="relative">
                  <div className="w-full aspect-square bg-gradient-to-br from-gray-100 to-gray-200 rounded mb-2"></div>
                  
                  {/* Discount Badge */}
                  <div className="absolute top-0 right-0 bg-yellow-400 text-xs font-bold px-2 py-1 rounded-bl shadow">
                    -{product.discount}%
                  </div>
                </div>
                
                {/* Price */}
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-orange-500 text-lg font-bold">
                    ₫{formatPrice(product.price)}
                  </span>
                </div>
                
                {/* Sold Progress Bar */}
                <div className="relative mt-3">
                  <div className="h-4 bg-pink-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-orange-400 to-pink-500 flex items-center justify-center transition-all duration-300"
                      style={{ width: `${product.sold}%` }}
                    >
                      <span className="text-xs text-white font-bold">
                        ĐÃ BÁN {product.sold}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ======================================================================
            SHOPEE MALL SECTION
            TODO:
            - Fetch official shops from API
            - Add shop badges (Official, Verified, etc.)
            - Show shop rating and follower count
            - Add "Follow" button
        ====================================================================== */}
        <section className="bg-white rounded-sm p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <h2 className="text-orange-500 text-xl font-bold uppercase">
                Shopee Mall
              </h2>
              <span className="bg-orange-500 text-white text-xs px-3 py-1 rounded-full font-medium">
                7 Ngày Miễn Phí Trả Hàng
              </span>
            </div>
            <button 
              className="text-orange-500 hover:text-orange-600 font-medium transition"
              onClick={() => navigate("/mall")}
            >
              Xem tất cả →
            </button>
          </div>
          
          {/* Mall Shops Grid */}
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-12 gap-4">
            {mallShops.map((shop) => (
              <div 
                key={shop.id}
                className="cursor-pointer group"
                onClick={() => handleShopClick(shop.id)}
              >
                <div className="w-full aspect-square border-2 border-gray-200 rounded-lg overflow-hidden group-hover:border-orange-500 group-hover:shadow-lg transition-all">
                  <div className="w-full h-full bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
                    <span className="text-2xl">🏪</span>
                  </div>
                </div>
                {/* TODO: Add shop name and rating below */}
              </div>
            ))}
          </div>
        </section>

        {/* ======================================================================
            TRENDING PRODUCTS SECTION (Gợi Ý Hôm Nay)
            TODO:
            - Implement infinite scroll or pagination
            - Add sorting options (price, rating, sales)
            - Add filtering sidebar
            - Add product quick view modal
            - Add "Add to cart" button on hover
            - Implement lazy loading for images
        ====================================================================== */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-gray-600 text-lg uppercase font-bold">
              Gợi Ý Hôm Nay
            </h2>
            {/* TODO: Add filter/sort dropdown */}
          </div>
          
          {/* Products Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-2">
            {trendingProducts.map((product) => (
              <div 
                key={product.id}
                className="bg-white rounded-sm overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group"
                onClick={() => handleProductClick(product.id)}
              >
                {/* Product Image */}
                <div className="relative w-full aspect-square bg-gradient-to-br from-gray-50 to-gray-100">
                  {/* TODO: Add real product images */}
                  
                  {/* Discount badge if applicable */}
                  {product.discount > 0 && (
                    <div className="absolute top-0 right-0 bg-yellow-400 text-xs font-bold px-2 py-1 rounded-bl">
                      -{product.discount}%
                    </div>
                  )}
                  
                  {/* Free ship badge */}
                  {product.freeShip && (
                    <div className="absolute bottom-0 left-0 bg-green-500 text-white text-xs px-2 py-1 rounded-tr">
                      Freeship
                    </div>
                  )}
                </div>
                
                {/* Product Info */}
                <div className="p-2">
                  {/* Product Name */}
                  <div className="text-sm text-gray-800 line-clamp-2 mb-2 h-10">
                    {product.name} - {product.description}
                  </div>
                  
                  {/* Price and Sold */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1">
                      <span className="text-orange-500 font-bold text-base">
                        ₫{formatPrice(product.price)}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">
                      Đã bán {formatSold(product.sold)}
                    </span>
                  </div>
                  
                  {/* Rating Stars */}
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex text-yellow-400">
                      {[...Array(5)].map((_, i) => (
                        <svg key={i} className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                        </svg>
                      ))}
                    </div>
                    {product.ratingCount > 0 && (
                      <span className="text-xs text-gray-500">
                        ({formatSold(product.ratingCount)})
                      </span>
                    )}
                  </div>
                  
                  {/* Location */}
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{product.location}</span>
                    {/* TODO: Add wishlist/favorite button */}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Load More Button */}
          {/* TODO: Replace with infinite scroll or proper pagination */}
          <div className="flex justify-center mt-6">
            <button className="px-8 py-3 border border-gray-300 rounded-sm hover:bg-gray-50 hover:border-orange-500 transition font-medium">
              Xem thêm
            </button>
          </div>
        </section>

        {/* ======================================================================
            ADDITIONAL SECTIONS (Can be added as needed)
            
            TODO: Consider adding these sections:
            
            1. DAILY DISCOVER SECTION
               - New products daily
               - Personalized recommendations
               
            2. TOP BRANDS SECTION
               - Featured brand partnerships
               - Brand sale events
               
            3. RECENT VIEWED PRODUCTS
               - Track user browsing history
               - Show in sidebar or separate section
               
            4. SHOPEE LIVE SECTION
               - Live streaming shopping
               - Show active streams with viewer count
               
            5. BLOG/INSPIRATION SECTION
               - Shopping guides
               - Trend articles
               - Style inspiration
               
            6. SEASONAL/PROMOTIONAL BANNERS
               - Holiday sales
               - Special events (11.11, 12.12, etc.)
               
            7. USER REVIEWS HIGHLIGHT
               - Featured customer reviews
               - Photo reviews showcase
        ====================================================================== */}

        {/* Custom children content - allows extending the layout */}
        {children}

      </main>
      <Footer></Footer>
      {/* ========================================================================
          FLOATING ACTION BUTTONS (Optional)
          TODO: Add these floating elements:
          - Back to top button (appears on scroll)
          - Live chat support button
          - App download prompt (mobile)
          - Recently viewed products sidebar
      ======================================================================== */}
      
      {/* Back to Top Button */}
      {/* TODO: Show only when scrolled down */}
      <button 
        className="fixed bottom-6 right-6 w-12 h-12 bg-orange-500 text-white rounded-full shadow-lg hover:bg-orange-600 transition flex items-center justify-center z-50"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      >
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd"/>
        </svg>
      </button>

      {/* Live Chat Button */}
      {/* TODO: Integrate with customer support chat system */}
      <button 
        className="fixed bottom-24 right-6 w-12 h-12 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-600 transition flex items-center justify-center z-50"
        title="Chat với chúng tôi"
      >
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
          <path d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm3.293 1.293a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 01-1.414-1.414L7.586 10 5.293 7.707a1 1 0 010-1.414zM11 12a1 1 0 100 2h3a1 1 0 100-2h-3z"/>
        </svg>
      </button>
    
    </div>
  );
}

/* ==============================================================================
   EXPORT AND USAGE NOTES
   
   This HomeLayout component provides a complete Shopee-style e-commerce homepage.
   
   KEY FEATURES IMPLEMENTED:
   ✅ Responsive header with search and cart
   ✅ Banner carousel section (placeholder)
   ✅ Quick action buttons
   ✅ Category grid navigation
   ✅ Flash sale section with countdown
   ✅ Shopee Mall section
   ✅ Trending products grid
   ✅ Comprehensive footer
   ✅ Floating action buttons
   
   FEATURES TO IMPLEMENT:
   ⏳ Real API integration for all data
   ⏳ Image lazy loading
   ⏳ Infinite scroll / pagination
   ⏳ Real-time countdown timer
   ⏳ Search autocomplete
   ⏳ Shopping cart functionality
   ⏳ Product quick view modal
   ⏳ Wishlist/favorites
   ⏳ User authentication flow
   ⏳ Notification system
   ⏳ Analytics tracking
   ⏳ SEO optimization
   ⏳ Performance optimization (code splitting, etc.)
   
   RECOMMENDED FOLDER STRUCTURE:
   /components
     /layout
       HomeLayout.tsx (this file)
       Header.tsx (extracted)
       Footer.tsx (extracted)
     /home
       BannerCarousel.tsx
       QuickActions.tsx
       CategoryGrid.tsx
       FlashSaleSection.tsx
       MallSection.tsx
       ProductGrid.tsx
     /product
       ProductCard.tsx
       ProductQuickView.tsx
     /common
       Button.tsx
       Badge.tsx
       StarRating.tsx
   
   PERFORMANCE TIPS:
   1. Use React.memo() for product cards
   2. Implement virtual scrolling for long product lists
   3. Lazy load images with intersection observer
   4. Use code splitting for sections below the fold
   5. Implement service worker for offline support
   6. Use CDN for images and static assets
   7. Implement proper caching strategy
   
   ACCESSIBILITY CHECKLIST:
   ☐ Add proper ARIA labels
   ☐ Ensure keyboard navigation works
   ☐ Add alt text to all images
   ☐ Test with screen readers
   ☐ Ensure proper color contrast
   ☐ Add focus indicators
   ☐ Make clickable areas large enough (44x44px minimum)
   
   TESTING CHECKLIST:
   ☐ Unit tests for utility functions
   ☐ Integration tests for user flows
   ☐ E2E tests for critical paths
   ☐ Visual regression tests
   ☐ Performance testing
   ☐ Mobile responsiveness testing
   ☐ Cross-browser testing
============================================================================== */