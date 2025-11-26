import { HomeLayout } from "../../components/layout/HomeLayout";
import { AlertCircle, HelpCircle, MessageCircle, ShieldCheck, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function SupportPage() {
  const navigate = useNavigate();

  return (
    <HomeLayout>
      <div className="bg-gradient-to-b from-orange-50/80 to-white">
        <div className="max-w-6xl mx-auto px-4 py-10 space-y-10">
          {/* Hero */}
          <header className="flex flex-col md:flex-row items-center gap-8">
            <div className="flex-1 space-y-4">
              <p className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-xs font-medium text-orange-600 shadow-sm border border-orange-100">
                <HelpCircle className="w-4 h-4" />
                Trung tâm hỗ trợ Shopee Clone
              </p>
              <h1 className="text-3xl md:text-4xl font-semibold text-gray-900 leading-tight">
                Gặp vấn đề với đơn hàng?
                <br />
                <span className="text-orange-500">Chúng tôi luôn sẵn sàng hỗ trợ.</span>
              </h1>
              <p className="text-sm md:text-base text-gray-600 max-w-xl">
                Trang này giúp bạn hiểu rõ cách tạo khiếu nại, theo dõi trạng thái xử lý và đọc phản hồi
                từ hệ thống. Tất cả đều ở dạng hướng dẫn, không yêu cầu bạn nhập thêm thông tin nhạy cảm.
              </p>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => navigate("/user/complaints")}
                  className="inline-flex items-center gap-2 rounded-full bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-orange-600 transition"
                >
                  <AlertCircle className="w-4 h-4" />
                  Quản lý khiếu nại
                </button>
                <button
                  onClick={() => navigate("/user/orders")}
                  className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white px-5 py-2.5 text-sm font-semibold text-orange-600 hover:bg-orange-50 transition"
                >
                  <FileText className="w-4 h-4" />
                  Xem đơn hàng của bạn
                </button>
              </div>
            </div>

            <div className="hidden md:flex flex-1 justify-center">
              <div className="relative w-72 h-56 rounded-3xl bg-white shadow-lg border border-orange-100 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-white to-blue-50" />
                <div className="relative h-full p-5 flex flex-col justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-gray-500">Trạng thái khiếu nại gần đây</p>
                    <p className="text-sm font-semibold text-gray-900">#KHL-2025-00128</p>
                  </div>
                  <div className="space-y-2 text-xs">
                    <StatusPill label="NEW" color="orange" description="Chờ tiếp nhận" />
                    <StatusPill label="IN_PROGRESS" color="blue" description="Đang xử lý" />
                    <StatusPill label="RESOLVED" color="green" description="Đã giải quyết" />
                    <StatusPill label="REJECTED" color="red" description="Từ chối (có lý do)" />
                  </div>
                  <p className="text-[11px] text-gray-400">
                    Giao diện mô phỏng nhằm giúp bạn hình dung quy trình. Dữ liệu thật hiển thị tại trang{" "}
                    <span className="font-medium text-gray-600">Khiếu nại &amp; Báo cáo</span>.
                  </p>
                </div>
              </div>
            </div>
          </header>

          {/* 3 quick cards */}
          <section className="grid gap-4 md:grid-cols-3">
            <InfoCard
              icon={AlertCircle}
              title="Khi nào nên tạo khiếu nại?"
              items={[
                "Đơn hàng giao sai, thiếu hàng hoặc sản phẩm bị lỗi/nát.",
                "Người bán không phản hồi sau nhiều lần liên hệ.",
                "Nghi ngờ hành vi lừa đảo hoặc vi phạm chính sách.",
              ]}
            />
            <InfoCard
              icon={MessageCircle}
              title="Các kênh hỗ trợ chính"
              items={[
                "Ưu tiên chat với người bán để trao đổi trực tiếp trước.",
                "Tạo khiếu nại nếu hai bên không tự giải quyết được.",
                "Theo dõi phản hồi và cập nhật từ hệ thống trong từng khiếu nại.",
              ]}
            />
            <InfoCard
              icon={ShieldCheck}
              title="Cam kết an toàn"
              items={[
                "Bảo vệ người mua khỏi các hành vi gian lận.",
                "Ưu tiên xử lý các trường hợp có đầy đủ bằng chứng.",
                "Tuân thủ chính sách bảo mật và điều khoản sử dụng.",
              ]}
            />
          </section>

          {/* Detailed sections */}
          <section className="grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border bg-white p-6 space-y-3 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-orange-100 text-orange-600 text-xs font-bold">
                  1
                </span>
                Cách tạo khiếu nại
              </h2>
              <ol className="list-decimal pl-6 text-sm text-gray-700 space-y-1">
                <li>
                  Vào mục <strong>Đơn mua</strong> hoặc trang <strong>Khiếu nại</strong> trong tài khoản.
                </li>
                <li>Chọn đơn hàng / sản phẩm gặp vấn đề.</li>
                <li>Mô tả chi tiết vấn đề, kèm hình ảnh/bằng chứng rõ ràng.</li>
                <li>Gửi khiếu nại và chờ hệ thống ghi nhận.</li>
              </ol>
              <p className="text-xs text-gray-500">
                Bạn có thể truy cập nhanh trang quản lý khiếu nại tại đường dẫn{" "}
                <span className="font-semibold">/user/complaints</span> hoặc qua menu tài khoản.
              </p>
            </div>

            <div className="rounded-2xl border bg-white p-6 space-y-3 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-blue-600 text-xs font-bold">
                  2
                </span>
                Theo dõi trạng thái &amp; phản hồi
              </h2>
              <ul className="list-disc pl-6 text-sm text-gray-700 space-y-1">
                <li>
                  Mỗi khiếu nại hiển thị trạng thái như <strong>NEW</strong>,{" "}
                  <strong>IN_PROGRESS</strong>, <strong>RESOLVED</strong>, <strong>REJECTED</strong>.
                </li>
                <li>Bạn có thể bổ sung ghi chú/bằng chứng trong vùng bình luận của từng khiếu nại.</li>
                <li>Mọi phản hồi từ hệ thống hoặc người bán sẽ hiển thị ngay dưới khiếu nại tương ứng.</li>
              </ul>
            </div>
          </section>

          {/* Safety section */}
          <section className="rounded-2xl border bg-white p-6 space-y-3 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-green-500" />
              Lưu ý an toàn
            </h2>
            <ul className="list-disc pl-6 text-sm text-gray-700 space-y-1">
              <li>Không chia sẻ mật khẩu, mã OTP hoặc thông tin thanh toán trong nội dung khiếu nại.</li>
              <li>Chỉ làm việc qua hệ thống chat &amp; khiếu nại của ứng dụng, tránh giao dịch ngoài.</li>
              <li>
                Nếu phát hiện dấu hiệu lừa đảo nghiêm trọng, hãy mô tả rõ ràng và cung cấp{" "}
                <strong>đầy đủ bằng chứng</strong> để được ưu tiên xử lý.
              </li>
            </ul>
          </section>
        </div>
      </div>
    </HomeLayout>
  );
}

type StatusColor = "orange" | "blue" | "green" | "red";

function StatusPill({
  label,
  description,
  color,
}: {
  label: string;
  description: string;
  color: StatusColor;
}) {
  const colorMap: Record<StatusColor, string> = {
    orange: "bg-orange-50 text-orange-700 border-orange-100",
    blue: "bg-blue-50 text-blue-700 border-blue-100",
    green: "bg-emerald-50 text-emerald-700 border-emerald-100",
    red: "bg-red-50 text-red-700 border-red-100",
  };

  return (
    <div className={`flex items-center justify-between rounded-full border px-3 py-1 ${colorMap[color]}`}>
      <span className="text-[11px] font-semibold">{label}</span>
      <span className="text-[11px] text-gray-500">{description}</span>
    </div>
  );
}

function InfoCard({
  icon: Icon,
  title,
  items,
}: {
  icon: typeof AlertCircle;
  title: string;
  items: string[];
}) {
  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm flex flex-col gap-3">
      <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
        <Icon className="w-5 h-5" />
      </div>
      <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      <ul className="list-disc pl-5 text-xs text-gray-700 space-y-1">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
