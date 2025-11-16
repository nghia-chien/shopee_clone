// AdminRoutes.tsx
import { Routes, Route } from "react-router-dom";
import { CategoryPage } from "../screens/admin/CategoryPage";
//import { ProductPage } from "../pages/admin/ProductPage";
// import thêm các trang admin khác

export function AdminRoutes() {
  return (
    <Routes>
      <Route path="/admin/categories" element={<CategoryPage />} />
      {/* <Route path="/admin/products" element={<ProductPage />} /> */}
      {/* các route admin khác */}
    </Routes>
  );
}
