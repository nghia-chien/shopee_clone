import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Footer } from "../../components/layout/Footer";
import { Header } from "../../components/layout/Header";
import { getFlashSaleProducts } from "../../api/userapi/client";
import type { FlashSaleProduct } from "../../api/userapi/client";

export default function FlashSalePage() {
  const navigate = useNavigate();
  const [flashSaleProducts, setFlashSaleProducts] = useState<FlashSaleProduct[]>([]);
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [activeTab, setActiveTab] = useState("all");
  const [loading, setLoading] = useState(true);
  const [flashSaleEndTime, setFlashSaleEndTime] = useState<Date | null>(null);

  // Fetch flash sale products
  useEffect(() => {
    const fetchFlashSaleProducts = async () => {
      try {
        setLoading(true);
        const shopStatus = activeTab === "all" ? undefined : activeTab;
        const response = await getFlashSaleProducts({ shop_status: shopStatus });
        setFlashSaleProducts(response.products);

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
        setLoading(false);
      }
    };

    fetchFlashSaleProducts();
  }, [activeTab]);

  // Countdown timer - SỬA LẠI TÍNH TOÁN THỜI GIAN
  useEffect(() => {
    if (!flashSaleEndTime) {
      setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
      return;
    }

    const updateCountdown = () => {
      const now = new Date().getTime();
      const end = flashSaleEndTime.getTime();
      const distance = end - now;

      if (distance <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      // Tính toán chính xác - SỬA LẠI PHẦN NÀY
      const hours = Math.floor(distance / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);
      
      setTimeLeft({ hours, minutes, seconds });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [flashSaleEndTime]);

  const handleProductClick = (id: string) => navigate(`/products/${id}`);

  const formatPrice = (price: number) => price.toLocaleString("vi-VN");

  const tabs = [
    { id: "all", label: "TOP BÁN CHẠY SẤT SẮC" },
    { id: "mall", label: "SHOPEE SIÊU HẺ" },
    { id: "like", label: "SHOP YÊU THÍCH" },
  ];

  // 3h slot logic
  const getTimeSlots = () => {
    const now = new Date();
    const slots = [];
    const currentHour = now.getHours();
    const currentSlotStart = currentHour - (currentHour % 3);

    // Current slot
    if (flashSaleEndTime && flashSaleEndTime > now) {
      slots.push({
        hour: `${String(currentSlotStart).padStart(2, "0")}:00`,
        label: "Đang Diễn Ra",
        isActive: true,
        endTime: flashSaleEndTime,
      });
    }

    // Next slots (4 slots, 3h increment)
    for (let i = 1; i <= 4; i++) {
      const futureHour = (currentSlotStart + i * 3) % 24;
      slots.push({
        hour: `${String(futureHour).padStart(2, "0")}:00`,
        label: "Sắp Diễn Ra",
        isActive: false,
        endTime: null,
      });
    }

    return slots;
  };

  const timeSlots = getTimeSlots();

  return (
    <section className="bg-white">
      <Header />
      
      {/* Countdown trên banner - cách 2 */}
      {flashSaleEndTime && (
        <div className="flex justify-center items-center gap-2 bg-white text-black py-3 px-4">
          <span className="font-semibold">FLASH SALE kết thúc trong</span>
          <div className="bg-black text-white text-sm px-2.5 py-1 rounded font-mono font-bold">{String(timeLeft.hours).padStart(2, "0")}</div>
          <span className="font-bold">:</span>
          <div className="bg-black text-white text-sm px-2.5 py-1 rounded font-mono font-bold">{String(timeLeft.minutes).padStart(2, "0")}</div>
          <span className="font-bold">:</span>
          <div className="bg-black text-white text-sm px-2.5 py-1 rounded font-mono font-bold">{String(timeLeft.seconds).padStart(2, "0")}</div>
        </div>
      )}

      {/* Banner */}
      <div className="w-full">
        <img src="/bannerbig2.png" alt="Flash Sale Banner" className="w-full object-cover" />

        {/* Time slots bar */}
        <div className="bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 px-8 py-5 shadow-xl mt-2">
          <div className="flex items-center justify-center max-w-4xl mx-auto gap-3 overflow-x-auto">
            {timeSlots.map((slot, index) => (
              <div
                key={index}
                className={`relative px-6 py-3 rounded-lg cursor-pointer transition-all duration-300 transform hover:scale-105 ${
                  slot.isActive
                    ? "bg-gradient-to-br from-orange-500 to-red-600 shadow-lg shadow-orange-500/50"
                    : "bg-gray-600 bg-opacity-60 hover:bg-opacity-80"
                }`}
              >
                {slot.isActive && <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-ping"></div>}
                <div className="text-center">
                  <div className={`text-2xl font-black mb-1 ${slot.isActive ? "text-white" : "text-gray-300"}`}>{slot.hour}</div>
                  <div className={`text-xs font-semibold ${slot.isActive ? "text-yellow-200" : "text-gray-400"}`}>{slot.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b sticky top-0 bg-white z-10 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-8 overflow-x-auto">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-2 text-sm font-medium border-b-2 transition ${
                  activeTab === tab.id ? "border-red-600 text-red-600" : "border-transparent text-gray-600"
                }`}
              >
                {tab.label}
              </button>
            ))}
            <button className="ml-auto py-4 px-2 text-sm font-medium text-orange-600 flex items-center gap-1">Thêm</button>
          </div>
        </div>
      </div>

{/* Product grid */}
<div className="container mx-auto px-4 py-4">
  {loading ? (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="bg-white border border-gray-200 rounded-lg p-3 animate-pulse">
          <div className="w-full aspect-square bg-gray-200 rounded-lg mb-3"></div>
          <div className="h-4 bg-gray-200 rounded mb-2"></div>
          <div className="h-3 bg-gray-200 rounded mb-3"></div>
          <div className="h-8 bg-gray-200 rounded"></div>
        </div>
      ))}
    </div>
  ) : flashSaleProducts.filter(product => product.status !== "inactive").length === 0 ? (
    <div className="text-center py-12 text-gray-500">Không có sản phẩm flash sale nào</div>
  ) : (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
      {flashSaleProducts.filter(product => product.status !== "inactive").map(product => {
        const soldPercent = product.stock > 0 ? Math.min(100, Math.round((product.sold / (product.sold + product.stock)) * 100)) : 0;
        return (
          <div 
            key={product.id} 
            className="bg-white border border-gray-200 rounded-lg hover:shadow-xl hover:-translate-y-1 hover:border-red-500 transition-all duration-300 cursor-pointer flex flex-col"
            onClick={() => handleProductClick(product.id)}
          >
            <div className="p-3 flex-1 flex flex-col">
              {/* IMAGE */}
              <div className="relative w-full aspect-square bg-gray-100 rounded-lg mb-3 overflow-hidden">
                {product.images && product.images.length > 0 ? (
                  <img 
                    src={product.images[0]} 
                    alt={product.title} 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-300">
                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
                {/* DISCOUNT */}
                <div className="absolute top-0 left-0 bg-yellow-400 text-red-600 text-xs font-bold px-2 py-1 rounded-br-lg">
                  {product.discount}% GIẢM
                </div>
              </div>

              {/* TITLE - ĐÃ SỬA ĐỂ GIỚI HẠN TỐT HƠN */}
              <h3 className="text-xs text-gray-800 line-clamp-2 mb-3 leading-tight min-h-[2.5rem] flex items-start">
                {product.title}
              </h3>

              {/* PRICE */}
              <div className="text-center mb-3 mt-auto">
                <span className="text-red-600 font-bold text-lg block">
                  ₫{formatPrice(product.price)}
                </span>
                {product.originalPrice > product.price && (
                  <div className="text-gray-400 text-xs line-through mt-1">
                    ₫{formatPrice(product.originalPrice)}
                  </div>
                )}
              </div>

              {/* PROGRESS BAR */}
              <div className="h-5 bg-red-100 rounded-full overflow-hidden border border-red-200 mb-3">
                <div className="h-full bg-red-500 flex items-center justify-center text-white text-[10px] font-bold transition-all" style={{ width: `${soldPercent}%` }}>
                  ĐÃ BÁN {soldPercent}%
                </div>
              </div>

              {/* BUY BUTTON */}

            </div>
          </div>
        );
      })}
    </div>
  )}

  {/* VIEW ALL BUTTON */}
  <div className="text-center mt-8">
    <button className="border-2 border-red-600 text-red-600 hover:bg-red-600 hover:text-white px-10 py-3 rounded-lg font-semibold transition-colors duration-200">
      XEM TẤT CẢ
    </button>
  </div>
</div>

      <Footer />
    </section>
  );
}