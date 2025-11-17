import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

interface FlashSaleProduct {
  id: string;
  title: string;
  price: number;
  discount: number;
  sold: number; // % đã bán
  images?: string[];
}

export default function FlashSalePage() {
  const [flashSaleProducts, setFlashSaleProducts] = useState<FlashSaleProduct[]>([]);
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const navigate = useNavigate();

  // Giả lập API call
  useEffect(() => {
    // TODO: thay bằng fetch từ API thật
    setFlashSaleProducts([
      { id: "1", title: "Điện thoại Apple iPhone 17 Pro Max", price: 39000000, discount: 10, sold: 70 },
      { id: "2", title: "Laptop Dell XPS 13", price: 25000000, discount: 15, sold: 40 },
      { id: "3", title: "Tai nghe Sony WH-1000XM5", price: 7500000, discount: 20, sold: 90 },
    ]);
  }, []);

  // Countdown giả lập Flash Sale
  useEffect(() => {
    const endTime = new Date();
    endTime.setHours(endTime.getHours() + 5); // Flash sale kết thúc sau 5 giờ
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const distance = endTime.getTime() - now;
      if (distance <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
        clearInterval(interval);
        return;
      }
      const hours = Math.floor((distance / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((distance / (1000 * 60)) % 60);
      const seconds = Math.floor((distance / 1000) % 60);
      setTimeLeft({ hours, minutes, seconds });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleProductClick = (id: string) => {
    navigate(`/product/${id}`);
  };

  const formatPrice = (price: number) => price.toLocaleString();

  return (
    <section className="bg-white rounded-sm shadow-sm">
      <div className="flex items-center justify-between px-6 py-4 border-b">
        <div className="flex items-center gap-4">
          <h2 className="text-orange-500 text-xl font-bold uppercase tracking-wide">
            ⚡ Flash Sale
          </h2>
          
          <div className="flex items-center gap-2">
            <div className="bg-black text-white text-sm px-2.5 py-1 rounded font-mono">
              {String(timeLeft.hours).padStart(2, '0')}
            </div>
            <span className="text-black font-bold">:</span>
            <div className="bg-black text-white text-sm px-2.5 py-1 rounded font-mono">
              {String(timeLeft.minutes).padStart(2, '0')}
            </div>
            <span className="text-black font-bold">:</span>
            <div className="bg-black text-white text-sm px-2.5 py-1 rounded font-mono">
              {String(timeLeft.seconds).padStart(2, '0')}
            </div>
          </div>
        </div>

        <button className="text-orange-500 hover:text-orange-600 flex items-center gap-1 font-medium transition">
          Xem tất cả
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"/>
          </svg>
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-px bg-gray-100 p-px">
        {flashSaleProducts.map((product) => (
          <div 
            key={product.id}
            className="bg-white p-4 hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer"
            onClick={() => handleProductClick(product.id)}
          >
            <div className="relative">
              <div className="w-full aspect-square bg-gradient-to-br from-gray-100 to-gray-200 rounded mb-2">
                {product.images && product.images[0] && (
                  <img src={product.images[0]} alt={product.title} className="w-full h-full object-cover rounded"/>
                )}
              </div>

              <div className="absolute top-0 right-0 bg-yellow-400 text-xs font-bold px-2 py-1 rounded-bl shadow">
                -{product.discount}%
              </div>
            </div>

            <div className="flex items-center gap-2 mb-2">
              <span className="text-orange-500 text-lg font-bold">
                ₫{formatPrice(product.price)}
              </span>
            </div>

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
  );
}
