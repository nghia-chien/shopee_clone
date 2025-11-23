import type { DataProvider, DeleteOneParams, DeleteOneResponse } from "@refinedev/core";
import simpleRestProvider from "@refinedev/simple-rest";
import { useAdminAuthStore } from "../../store/AdminAuth";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api";

// Data Management Resources (CRUD operations only)
// These resources are managed through Refine for standard CRUD operations
const DATA_ENDPOINT_MAP: Record<string, string> = {
  users: "/admin/users",
  sellers: "/admin/sellers",
  products: "/admin/products",
  categories: "/admin/categories",
  orders: "/admin/orders",
  vouchers: "/admin/vouchers",
  reviews: "/admin/reviews",
};

// Custom data provider that handles admin API endpoints for data management
export const dataProvider: DataProvider = {
  ...simpleRestProvider(API_URL),
  
  getList: async ({ resource, pagination, filters, sorters, meta }) => {
    const endpoint = DATA_ENDPOINT_MAP[resource];
    if (!endpoint) {
      throw new Error(`Resource "${resource}" is not a data management resource`);
    }

    const { current = 1, pageSize = 20 } = pagination ?? {};
    
    // Build query params
    const params = new URLSearchParams();
    params.set("page", current.toString());
    params.set("limit", pageSize.toString());

    // Add search filter if exists
    const searchFilter = filters?.find((f: any) => f.field === "q" || f.field === "search");
    if (searchFilter && "value" in searchFilter) {
      params.set("search", searchFilter.value as string);
    }

    // Add source filter for vouchers
    if (resource === "vouchers") {
      const sourceFilter = filters?.find((f: any) => f.field === "source");
      if (sourceFilter && "value" in sourceFilter) {
        params.set("source", sourceFilter.value as string);
      }
    }

    // Add sorters
    if (sorters && sorters.length > 0) {
      const sorter = sorters[0];
      params.set("sort", sorter.field);
      if (sorter.order === "asc") {
        params.set("order", "asc");
      } else {
        params.set("order", "desc");
      }
    }

    // Get token from Zustand store
    const token = useAdminAuthStore.getState().token;
    if (!token) {
      throw new Error("Admin not authenticated");
    }

    const response = await fetch(`${API_URL}${endpoint}?${params.toString()}`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    // Transform response to Refine format
    // Backend returns different formats:
    // - { items, total, pagination: { total } } for products, categories, orders, reviews, vouchers
    // - { users, pagination: { total } } for users
    // - { sellers, pagination: { total } } for sellers
    let items: any[] = [];
    let totalCount = 0;

    if (data.items) {
      // Standard format: products, categories, orders, reviews, vouchers
      items = data.items;
      totalCount = data.total || data.pagination?.total || items.length;
    } else if (data.users) {
      // Users format
      items = data.users;
      totalCount = data.pagination?.total || items.length;
    } else if (data.sellers) {
      // Sellers format
      items = data.sellers;
      totalCount = data.pagination?.total || items.length;
    } else if (data.vouchers) {
      // Legacy vouchers format (fallback)
      items = data.vouchers;
      totalCount = items.length;
    } else if (data[resource]) {
      // Generic fallback
      items = data[resource];
      totalCount = data.total || data.pagination?.total || items.length;
    }

    return {
      data: items,
      total: totalCount,
    };
  },

  getOne: async ({ resource, id, meta }) => {
    const endpoint = DATA_ENDPOINT_MAP[resource];
    if (!endpoint) {
      throw new Error(`Resource "${resource}" is not a data management resource`);
    }

    const token = useAdminAuthStore.getState().token;
    if (!token) {
      throw new Error("Admin not authenticated");
    }

    const response = await fetch(`${API_URL}${endpoint}/${id}`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[DataProvider] getOne error for ${resource}/${id}:`, response.status, errorText);
      throw new Error(`API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log(`[DataProvider] getOne response for ${resource}/${id}:`, { dataKeys: Object.keys(data), data });
    
    // Backend returns { voucher }, { user }, { seller }, { order }, etc.
    // Check for specific resource keys first
    let resultData;
    if (data.order) {
      resultData = data.order;
    } else if (data.voucher) {
      resultData = data.voucher;
    } else if (data.user) {
      resultData = data.user;
    } else if (data.seller) {
      resultData = data.seller;
    } else if (data.product) {
      resultData = data.product;
    } else if (data.category) {
      resultData = data.category;
    } else if (data.review) {
      resultData = data.review;
    } else {
      // Fallback to data itself if it's already the resource object
      resultData = data;
    }
    
    const result = { data: resultData };
    console.log(`[DataProvider] getOne transformed for ${resource}/${id}:`, { hasData: !!result.data, resultKeys: result.data ? Object.keys(result.data) : [] });
    return result;
  },

  create: async ({ resource, variables, meta }) => {
    const endpoint = DATA_ENDPOINT_MAP[resource];
    if (!endpoint) {
      throw new Error(`Resource "${resource}" is not a data management resource`);
    }

    const token = useAdminAuthStore.getState().token;
    if (!token) {
      throw new Error("Admin not authenticated");
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(variables),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || error.message || `API error: ${response.status}`);
    }

    const data = await response.json();
    return {
      data: data.user || data.seller || data.product || data.category || data.order || data.voucher || data.review || data,
    };
  },

  update: async ({ resource, id, variables, meta }) => {
    const endpoint = DATA_ENDPOINT_MAP[resource];
    if (!endpoint) {
      throw new Error(`Resource "${resource}" is not a data management resource`);
    }

    const token = useAdminAuthStore.getState().token;
    if (!token) {
      throw new Error("Admin not authenticated");
    }

    const response = await fetch(`${API_URL}${endpoint}/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(variables),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || error.message || `API error: ${response.status}`);
    }

    const data = await response.json();
    return {
      data: data.user || data.seller || data.product || data.category || data.order || data.voucher || data.review || data,
    };
  },

  deleteOne: async ({ resource, id, meta }: DeleteOneParams<any>): Promise<DeleteOneResponse<any>> => {
    const endpoint = DATA_ENDPOINT_MAP[resource];
    if (!endpoint) {
      throw new Error(`Resource "${resource}" is not a data management resource`);
    }

    const token = useAdminAuthStore.getState().token;
    if (!token) {
      throw new Error("Admin not authenticated");
    }

    const response = await fetch(`${API_URL}${endpoint}/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || error.message || `API error: ${response.status}`);
    }

    return {
      data: { id },
    };
  },
};
