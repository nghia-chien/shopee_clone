import type { ReactNode } from "react";
import { useAuthStore } from "../../store/auth";
import { useNavigate } from "react-router-dom";
import "slick-carousel/slick/slick.css"; 
import "slick-carousel/slick/slick-theme.css";
import Slider from "react-slick";
import { Footer } from "./Footer";
import { Header } from "./Header";
import { ChatWidget } from "../chat/ChatWidget";
import {useMallShops} from "../../hooks/useMall"
interface HomeLayoutProps {
  children?: ReactNode;
}

export function HomeLayout({ children }: HomeLayoutProps) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const { shops, loading } = useMallShops();
  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // ============================================================================
  // DATA SECTION - TODO: Replace with API calls
  // ============================================================================
 const categories = [
  { name: "Thời Trang Nam", slug: "thoi-trang-nam", icon: "👔" },
  { name: "Thời Trang Nữ", slug: "thoi-trang-nu", icon: "👗" },
  { name: "Điện Thoại & Phụ Kiện", slug: "dien-thoai-phu-kien", icon: "📱" },
  { name: "Thiết Bị Điện Tử", slug: "thiet-bi-dien-tu", icon: "💻" },
  { name: "Máy Tính & Laptop", slug: "may-tinh-laptop", icon: "🖥️" },
  { name: "Máy Ảnh & Máy Quay Phim", slug: "may-anh-may-quay", icon: "📷" },
  { name: "Đồng Hồ", slug: "dong-ho", icon: "⌚" },
  { name: "Giày Dép Nam", slug: "giay-dep-nam", icon: "👞" },
  { name: "Giày Dép Nữ", slug: "giay-dep-nu", icon: "👠" },
  { name: "Túi Ví Nam", slug: "balo-tui-vi-nam", icon: "👜" },
  { name: "Túi Ví Nữ", slug: "tui-vi-nu", icon: "🛍️" },
  { name: "Phụ Kiện & Trang Sức", slug: "phu-kien-trang-suc-nu", icon: "💍" },
  { name: "Nhà Cửa & Đời Sống", slug: "nha-cua-doi-song", icon: "🏠" },
  { name: "Sách & Văn Phòng Phẩm", slug: "nha-sach-online", icon: "📚" },
  { name: "Thể Thao & Du Lịch", slug: "the-thao-du-lich", icon: "🏖️" },
  { name: "Ô Tô & Xe Máy", slug: "oto-xe-may-xe-dap", icon: "🚗" },
  { name: "Mẹ & Bé", slug: "me-be", icon: "👶" },
  { name: "Làm Đẹp & Sức Khỏe", slug: "suc-khoe", icon: "🩺" },
  { name: "Thú Cưng", slug: "thu-cung", icon: "🐶" },
  { name: "Voucher & Dịch Vụ", slug: "voucher-dich-vu", icon: "🎟️" },
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



  function handleCategoryClick(cat: { name: string; slug: string }) {
  navigate(`/category/${cat.slug}`);
}

  const handleProductClick = (product_id: string) => {
    // TODO: Navigate to product detail page
    navigate(`/product/${product_id}`);
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
    <div className="bg-gray-50 ">  <Header></Header>
   

      {/* ========================================================================
          MAIN CONTENT AREA
      ======================================================================== */}
        {/* ======================================================================
            BANNER CAROUSEL SECTION
            TODO: 
            - Implement auto-slide with react-slick or swiper
            - Add navigation dots
            - Add prev/next buttons
            - Lazy load images
            - Add click tracking analytics
        ====================================================================== */}
        <section className="bg-white rounded-sm shadow-sm mt-4">
          
          {/* banner chính  */}
          <section className="flex gap-2 justify-center max-w-[1200px] mx-auto mt-4">
          {/* Main Banner Slider */}
          <div className="flex-2 h-[235px] w-[800px] rounded-sm overflow-hidden relative shadow-sm">
            <Slider {...settings}>
              {mainBanners.map((banner) => (
                <a key={banner.id} href={banner.link}>
                  <img
                    src={banner.image}
                    alt={banner.alt}
                    className="w-full h-[235px] object-cover rounded-sm"
                  />
                </a>
              ))}
            </Slider>
          </div>

          {/* Sub Banners (cố định bên cạnh) */}
          <div className="flex-1 flex flex-col gap-2 h-[235px]">
            {subBanners.map((banner) => (
              <a
                key={banner.id}
                href={banner.link}
                className="flex-1 relative overflow-hidden rounded-sm shadow-sm"
              >
                <img
                  src={banner.image}
                  alt={banner.alt}
                  className="w-full h-full object-cover rounded-sm"
                />
              </a>
            ))}
          </div>
        </section>



          {/* ======================================================================
              QUICK ACTIONS SECTION
              TODO: Add icons, make items clickable with proper routing
          ====================================================================== */}
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-4 mt-4">
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
        </section>

        <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <section className="bg-white rounded-sm p-6 shadow-sm">
          <h2 className="text-gray-500 text-sm mb-4 uppercase font-semibold">Danh Mục</h2>
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-10 gap-4">
            {categories.map((cat, i) => (
              <div 
                key={i}
                className="flex flex-col items-center gap-2 cursor-pointer group"
                onClick={() => handleCategoryClick(cat)}
              >
                <div className="w-16 h-16 bg-gray-50 border-2 border-gray-200 rounded-lg flex items-center justify-center text-2xl group-hover:border-orange-500 group-hover:shadow-md transition-all">
                  {cat.icon}
                </div>
                <span className="text-xs text-center text-gray-700 line-clamp-2 group-hover:text-orange-500 transition">
                  {cat.name}
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
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
            {shops.map((shop) => (
              <div key={shop.id} className="p-4 border rounded cursor-pointer">
                <img src={shop.logo || "/placeholder.png"} alt={shop.name} className="w-16 h-16 mb-2" />
                <h3 className="text-sm font-semibold">{shop.name}</h3>
                <p className="text-xs text-gray-500">Rating: {shop.rating.toFixed(1)}</p>
              </div>
            ))}
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
      <Footer/>
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
        {/* <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd"/>
        </svg> */}
        <span className="material-symbols-outlined">
          keyboard_control_key
        </span>
      </button>

      {/* Chat Widget */}
      <ChatWidget />
    
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