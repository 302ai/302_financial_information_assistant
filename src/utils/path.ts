import { APP_ROUTE_MENU } from "@/constants";

export const isAuthPath = (pathname: string): boolean => {
  return pathname.includes("/auth");
};

export const removeParams = (pathname: string): void => {
  if (typeof window !== "undefined" && pathname) {
    window.history.replaceState({}, "", pathname);
  }
};
