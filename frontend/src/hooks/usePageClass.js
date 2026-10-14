import { useLocation } from "react-router-dom";

export function usePageClass() {
  const location = useLocation();
  const tabRoutes = ["/", "/orders", "/wallet", "/profile"];
  const isTab = tabRoutes.includes(location.pathname);
  return isTab ? "page page-fade" : "page page-enter";
}
