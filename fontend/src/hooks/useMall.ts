import { useEffect, useState } from "react";
import type { MallShop } from "../api/userapi/client";
import { getMallShops } from "../api/userapi/client";

export function useMallShops() {
  const [shops, setShops] = useState<MallShop[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMallShops()
      .then(setShops)
      .catch((err) => {
        console.error("Error fetching mall shops:", err);
        setShops([]);
      })
      .finally(() => setLoading(false));
  }, []);

  return { shops, loading };
}
