import { Refine } from "@refinedev/core";
import routerProvider from "@refinedev/react-router-v6";
import { dataProvider } from "../providers/refine/dataProvider";
import { authProvider } from "../providers/refine/authProvider";
import { AdminLayout } from "../components/admin/AdminLayout";
import { AdminGuard } from "../components/admin/AdminGuard";
import { AdminLogin } from "../components/admin/AdminLogin";
import { AdminDashboard } from "../screens/admin/actions/AdminDashboard";
import { AdminComplaints } from "../screens/admin/actions/AdminComplaints";
import { AdminMessages } from "../screens/admin/actions/AdminMessages";
// Data Management Pages (Refine-based CRUD)
import { ProductList, ProductShow, ProductEdit } from "../screens/admin/data/ProductList";
import { CategoryList, CategoryShow, CategoryCreate, CategoryEdit } from "../screens/admin/data/CategoryList";
import { OrderList, OrderShow, OrderEdit } from "../screens/admin/data/OrderList";
import { ReviewList, ReviewShow } from "../screens/admin/data/ReviewList";
import { UserList, UserShow, UserCreate, UserEdit } from "../screens/admin/data/UserList";
import { SellerList, SellerShow, SellerCreate, SellerEdit } from "../screens/admin/data/SellerList";
import { VoucherList, VoucherShow, VoucherCreate, VoucherEdit } from "../screens/admin/data/VoucherList";
import { Routes, Route, Navigate } from "react-router-dom";

/**
 * RefineApp - Manages admin panel routing
 * 
 * Structure:
 * - Data Management: Products, Categories, Orders, Reviews, Users, Sellers, Vouchers (Refine CRUD)
 * - Action Management: Dashboard, Complaints, Analytics, Settings (Custom pages)
 */
export function RefineApp() {
  return (
    <Routes>
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route
        path="/admin/*"
        element={
          <Refine
            dataProvider={dataProvider}
            authProvider={authProvider}
            routerProvider={routerProvider}
            resources={[
              // Data Management Resources (CRUD operations via Refine)
              {
                name: "products",
                list: "/admin/products",
                show: "/admin/products/show/:id",
                edit: "/admin/products/edit/:id",
                meta: { label: "Sản Phẩm" },
              },
              {
                name: "categories",
                list: "/admin/categories",
                show: "/admin/categories/show/:id",
                create: "/admin/categories/create",
                edit: "/admin/categories/edit/:id",
                meta: { label: "Danh Mục" },
              },
              {
                name: "orders",
                list: "/admin/orders",
                show: "/admin/orders/show/:id",
                edit: "/admin/orders/edit/:id",
                meta: { label: "Đơn Hàng" },
              },
              {
                name: "users",
                list: "/admin/users",
                show: "/admin/users/show/:id",
                create: "/admin/users/create",
                edit: "/admin/users/edit/:id",
                meta: { label: "Người Dùng" },
              },
              {
                name: "sellers",
                list: "/admin/sellers",
                show: "/admin/sellers/show/:id",
                create: "/admin/sellers/create",
                edit: "/admin/sellers/edit/:id",
                meta: { label: "Sellers" },
              },
                    {
                      name: "vouchers",
                      list: "/admin/vouchers",
                      show: "/admin/vouchers/show/:id",
                      create: "/admin/vouchers/create",
                      edit: "/admin/vouchers/edit/:id",
                      meta: { label: "Voucher" },
                    },
              {
                name: "reviews",
                list: "/admin/reviews",
                show: "/admin/reviews/show/:id",
                meta: { label: "Đánh Giá" },
              },
            ]}
            options={{
              syncWithLocation: true,
              warnWhenUnsavedChanges: true,
            }}
          >
            <AdminGuard>
              <AdminLayout>
                <Routes>
                  {/* Action Management Pages (Custom, not Refine-based) */}
                  <Route path="dashboard" element={<AdminDashboard />} />
                  <Route path="complaints" element={<AdminComplaints />} />
                  <Route path="messages" element={<AdminMessages />} />
                  
                  {/* Data Management Pages (Refine-based CRUD) */}
                  {/* Products */}
                  <Route path="products" element={<ProductList />} />
                  <Route path="products/show/:id" element={<ProductShow />} />
                  <Route path="products/edit/:id" element={<ProductEdit />} />
                  
                  {/* Categories */}
                  <Route path="categories" element={<CategoryList />} />
                  <Route path="categories/show/:id" element={<CategoryShow />} />
                  <Route path="categories/create" element={<CategoryCreate />} />
                  <Route path="categories/edit/:id" element={<CategoryEdit />} />
                  
                  {/* Orders */}
                  <Route path="orders" element={<OrderList />} />
                  <Route path="orders/show/:id" element={<OrderShow />} />
                  <Route path="orders/edit/:id" element={<OrderEdit />} />
                  
                  {/* Users */}
                  <Route path="users" element={<UserList />} />
                  <Route path="users/show/:id" element={<UserShow />} />
                  <Route path="users/create" element={<UserCreate />} />
                  <Route path="users/edit/:id" element={<UserEdit />} />
                  
                  {/* Sellers */}
                  <Route path="sellers" element={<SellerList />} />
                  <Route path="sellers/show/:id" element={<SellerShow />} />
                  <Route path="sellers/create" element={<SellerCreate />} />
                  <Route path="sellers/edit/:id" element={<SellerEdit />} />
                  
                        {/* Vouchers */}
                        <Route path="vouchers" element={<VoucherList />} />
                        <Route path="vouchers/show/:id" element={<VoucherShow />} />
                        <Route path="vouchers/create" element={<VoucherCreate />} />
                        <Route path="vouchers/edit/:id" element={<VoucherEdit />} />
                  
                  {/* Reviews */}
                  <Route path="reviews" element={<ReviewList />} />
                  <Route path="reviews/show/:id" element={<ReviewShow />} />
                  
                  <Route path="" element={<Navigate to="/admin/dashboard" replace />} />
                </Routes>
              </AdminLayout>
            </AdminGuard>
          </Refine>
        }
      />
    </Routes>
  );
}
