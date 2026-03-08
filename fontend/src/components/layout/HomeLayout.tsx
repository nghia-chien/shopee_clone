import type { ReactNode } from "react";
import { useEffect, useState,useRef } from "react";
import { useNavigate } from "react-router-dom";
import "slick-carousel/slick/slick.css"; 
import "slick-carousel/slick/slick-theme.css";
import Slider from "react-slick";
import { Footer } from "./Footer";
import { Header } from "./Header";
import { ChatWidget } from "../chat/ChatWidget";
import {useMallShops} from "../../hooks/useMall";
import { getFlashSaleProducts ,getCategories  } from "../../api/userapi/client";
import type { FlashSaleProduct,Category } from "../../api/userapi/client";
import { ChevronRight, ChevronLeft } from "lucide-react";


interface HomeLayoutProps {
  children?: ReactNode;
}

export function HomeLayout({ children }: HomeLayoutProps) {

  const navigate = useNavigate();
  const { shops } = useMallShops();
  
  const [categories, setCategories] = useState<Category[]>([]);

  const scrollRef = useRef<HTMLDivElement>(null);
   const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(true);

  const scroll = (direction: 'left' | 'right') => {
    const element = scrollRef.current;
    if (element) {
      const scrollAmount = 1000;
      
      if (direction === 'left') {
        element.scrollLeft -= scrollAmount;
        setShowRight(true);
        setTimeout(() => {
          setShowLeft(element.scrollLeft > 0);
        }, 100);
      } else {
        element.scrollLeft += scrollAmount;
        setShowLeft(true);
        setTimeout(() => {
          const isAtEnd = element.scrollLeft >= element.scrollWidth - element.clientWidth - 10;
          setShowRight(!isAtEnd);
        }, 100);
      }
    }
  };

  // ============================================================================
  // DATA SECTION - TODO: Replace with API calls
  // ============================================================================
 useEffect(() => {
    const fetchCategories = async () => {
      try {
        const categoriesData = await getCategories();
        setCategories(categoriesData);
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      } 
    };

    fetchCategories();
  }, []);



  // Flash Sale Products State
  const [flashSaleProducts, setFlashSaleProducts] = useState<FlashSaleProduct[]>([]);
  const [flashSaleLoading, setFlashSaleLoading] = useState(true);
  const [flashSaleEndTime, setFlashSaleEndTime] = useState<Date | null>(null);

  // TODO: API Integration - GET /api/banners?position=main
  const mainBanners = [
    { id: 1, image: "/bannerbig1.png", link: "/flash-sale", alt: "Banner 1" },
    { id: 2, image: "/bannerbig2.png", link: "/flash-sale", alt: "Banner 2" },
    { id: 3, image: "/bannerbig3.png", link: "/flash-sale", alt: "Banner 3" }
  ];
  const subBanners = [
    { id: 1, image: "/banner1.png", link: "/event", alt: "Voucher 50K" },
    { id: 2, image: "/banner2.png", link: "/event", alt: "Miễn Phí Vận Chuyển" }
  ];
  // Quick action items - can be made dynamic via API
  const quickActions = [
    { name: "Ngày hội săn sale", icon: "💰", link: "/event" },
    { name: "Shopee Mall", icon: "🏪", link: "/mall" },
    { name: "Bắt Deal 0Đ", icon: "⚡", link: "/flash-sale" },
    { name: "Miễn Phí Ship", icon: "🚚", link: "/freeship" },
    { name: "Voucher 50%", icon: "🎟️", link: "/vouchers" },
    { name: "khách Hàng thân thiết", icon: "💰", link: "/cheap" },
    
  ];

  const formatPrice = (price: number) => {
    return price.toLocaleString("vi-VN");
  };

  // Fetch Flash Sale Products
  useEffect(() => {
    const fetchFlashSaleProducts = async () => {
      try {
        setFlashSaleLoading(true);
        const response = await getFlashSaleProducts({ limit: 6 });
        setFlashSaleProducts(response.products);
        
        // Tìm thời gian kết thúc sớm nhất từ các vouchers
        if (response.products.length > 0) {
          const endTimes = response.products
            .map(p => new Date(p.voucher.end_at))
            .filter(d => !isNaN(d.getTime()));
          if (endTimes.length > 0) {
            const earliestEnd = new Date(Math.min(...endTimes.map(d => d.getTime())));
            setFlashSaleEndTime(earliestEnd);
          }
        }
      } catch (error) {
        console.error("Error fetching flash sale products:", error);
      } finally {
        setFlashSaleLoading(false);
      }
    };
    
    fetchFlashSaleProducts();
  }, []);

  // Real-time countdown timer
  const getFlashSaleCountdown = () => {
    if (!flashSaleEndTime) {
      return { hours: 0, minutes: 0, seconds: 0 };
    }
    
    const now = new Date().getTime();
    const end = flashSaleEndTime.getTime();
    const distance = end - now;
    
    if (distance <= 0) {
      return { hours: 0, minutes: 0, seconds: 0 };
    }
    
    const hours = Math.floor((distance / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((distance / (1000 * 60)) % 60);
    const seconds = Math.floor((distance / 1000) % 60);
    
    return { hours, minutes, seconds };
  };

  // Update countdown every second
  const [countdown, setCountdown] = useState(getFlashSaleCountdown());
  useEffect(() => {
    if (!flashSaleEndTime) return;
    
    const interval = setInterval(() => {
      setCountdown(getFlashSaleCountdown());
    }, 1000);
    
    return () => clearInterval(interval);
  }, [flashSaleEndTime]);

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================



  function handleCategoryClick(cat: { slug: string }) {
  navigate(`/category/${cat.slug}`);
}

  const handleProductClick = (product_id: string) => {
    // TODO: Navigate to product detail page
    navigate(`/products/${product_id}`);
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
    <div className="bg-gray-50 ">  
    <Header/>
      <section className="bg-white rounded-sm shadow-sm mt-4 pb-6">

        
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
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-4 mt-4 justify-items-center px-16 mx-auto">

          {quickActions.slice(0, 6).map((action) => (
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
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <section className="bg-white rounded-lg p-6">
          <h2 className="text-gray-900 text-xl  text-left mb-6">DANH MỤC</h2>

          <div className="relative">
            {showLeft && (
              <button
                onClick={() => scroll('left')}
                className="absolute top-1/2 -left-8 transform -translate-y-1/2 z-10 bg-white p-1 rounded-full shadow-md hover:bg-gray-50 transition-all -ml-2"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
            )}

            {showRight && (
              <button
                onClick={() => scroll('right')}
                className="absolute top-1/2 -right-10 transform -translate-y-1/2 z-10 bg-white p-1 rounded-full shadow-md hover:bg-gray-50 transition-all"
              >
                <ChevronRight className="w-5 h-5 text-gray-600" />
              </button>
            )}

            {/* Container với overflow-hidden để ẩn thanh cuộn */}
            <div
              ref={scrollRef}
              className="overflow-hidden py-2"
            >
              <div className="grid grid-rows-2 grid-flow-col gap-x-8 gap-y-4 whitespace-nowrap">
                {categories
                  .filter(cat => cat.level === 1) // Lọc chỉ những category có level === 1
                  .sort((a, b) => b.name.localeCompare(a.name))
                  .map((cat, i) => (
                  <div
                    key={i}
                    className="flex flex-col items-center gap-2 cursor-pointer group min-w-[100px] inline-block"
                    onClick={() => handleCategoryClick(cat)}
                  >
                    <div className="w-20 h-20 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <img 
                        src={cat.image} 
                        className="w-full h-full object-contain" 
                        alt={cat.name}
                      />
                    </div>
                    <span className="block w-full text-xs text-center text-gray-800 break-words whitespace-normal group-hover:text-orange-500 transition-colors">
  {cat.name}
</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* FLASH SALE SECTION */}
        <section className="bg-white rounded-sm shadow-sm">
          <div className="flex items-center justify-between px-6 py-4 border-b">
            <div className="flex items-center gap-4">
              <h2 className="text-orange-500 text-xl font-bold uppercase tracking-wide">
                ⚡ Flash Sale
              </h2>
              
              {/* Countdown Timer */}
              <div className="flex items-center gap-2">
                <div className="bg-black text-white text-sm px-2.5 py-1 rounded font-mono">
                  {String(countdown.hours).padStart(2, '0')}
                </div>
                <span className="text-black font-bold">:</span>
                <div className="bg-black text-white text-sm px-2.5 py-1 rounded font-mono">
                  {String(countdown.minutes).padStart(2, '0')}
                </div>
                <span className="text-black font-bold">:</span>
                <div className="bg-black text-white text-sm px-2.5 py-1 rounded font-mono">
                  {String(countdown.seconds).padStart(2, '0')}
                </div>
              </div>
            </div>
            
            <button 
              onClick={() => navigate("/flash-sale")}
              className="text-orange-500 hover:text-orange-600 flex items-center gap-1 font-medium transition"
            >
              Xem tất cả
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"/>
              </svg>
            </button>
          </div>
          
          {/* Flash Sale Products Grid */}
          {flashSaleLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-px bg-gray-100 p-px">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white p-4 animate-pulse">
                  <div className="w-full aspect-square bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          ) : flashSaleProducts.filter(product => product.status !== "inactive").length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              Không có sản phẩm flash sale nào
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-px bg-gray-100 p-px">
              {flashSaleProducts
                .filter(product => product.status !== "inactive")
                .map((product) => {
                  const soldPercent = product.stock > 0 
                    ? Math.min(100, Math.round((product.sold / (product.sold + product.stock)) * 100))
                    : 0;
                  
                  return (
                    <div 
                      key={product.id}
                      className="bg-white p-4 hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer"
                      onClick={() => handleProductClick(product.id)}
                    >
                      {/* Product Image */}
                      <div className="relative">
                        {product.images && product.images.length > 0 ? (
                          <img 
                            src={product.images[0]} 
                            alt={product.title}
                            className="w-full aspect-square object-cover rounded mb-2"
                          />
                        ) : (
                          <div className="w-full aspect-square bg-gradient-to-br from-gray-100 to-gray-200 rounded mb-2"></div>
                        )}
                        
                        {/* Discount Badge */}
                        <div className="absolute top-0 right-0 bg-yellow-400 text-xs font-bold px-2 py-1 rounded-bl shadow">
                          -{product.discount}%
                        </div>
                        {/* Discount Badge */}
                        <div className="absolute top-2 left-0 bg-red-600 text-white text-xs font-bold px-1 py-1 rounded-bl shadow">
                          {product.seller.shop_mall}
                        </div>
                      </div>
                      
                      {/* Price */}
                      <div className="flex flex-col gap-1 mb-2">
                        
                        <span className="text-orange-500 text-lg font-bold">
                          ₫{formatPrice(product.price)}
                        </span>
                      </div>
                      
                      {/* Sold Progress Bar */}
                      <div className="relative mt-3">
                        <div className="h-4 bg-pink-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-orange-500 to-pink-500 transition-all duration-300"
                            style={{ width: `1${soldPercent}%` }}
                          >
                            {/* Đã xóa span khỏi đây */}
                          </div>
                        </div>
                        {/* Thêm span tuyệt đối ở giữa */}
                        <span className="absolute top-0 left-1/2 transform -translate-x-1/2 text-xs text-center text-white font-bold w-full">
                          ĐÃ BÁN {soldPercent}%
                        </span>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </section>

        {/*SHOPEE MALL SECTION */}
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
              <div 
                key={shop.id} 
                className="cursor-pointer flex flex-col items-center"
              >
                <div className="w-full aspect-square overflow-hidden rounded-2xl md:rounded-3xl border border-gray-300">
                  <img 
                    src={shop.avatar || "/placeholder.png"} 
                    alt={shop.name} 
                    className="w-full h-full object-cover"
                    onClick={() => handleShopClick(shop.id)}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
        {children}
      </main>
      </div>
      <Footer/>
      <button 
        className="fixed bottom-6 right-6 w-12 h-12 bg-orange-500 text-white rounded-full shadow-lg hover:bg-orange-600 transition flex items-center justify-center z-50"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      >
        <span className="material-symbols-outlined">
          keyboard_control_key
        </span>
      </button>
      {/* Chat Widget */}
      <ChatWidget />
    </div>
  );
}
