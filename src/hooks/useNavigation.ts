import { useState, useCallback } from "react";

export type Page =
  | "home"
  | "product-detail"
  | "review"
  | "review-write"
  | "edit-review"
  | "profile"
  | "signup"
  | "login"
  | "store-registration"
  | "my-applications"
  | "my-favorites"
  | "create-product"
  | "manage-applicants"
  | "notifications"
  | "review-management"
  | "point-shop"
  | "point-history"
  | "business-dashboard"
  | "terms"
  | "privacy";

/**
 * Pages where the bottom navigation bar should be hidden.
 * Extracted here so both the hook and rendering logic share the same source of truth.
 */
export const PAGES_WITHOUT_BOTTOM_NAV: Page[] = [
  "signup",
  "login",
  "product-detail",
  "review-write",
  "edit-review",
  "my-applications",
  "my-favorites",
  "create-product",
  "manage-applicants",
  "notifications",
  "review-management",
  "point-shop",
  "point-history",
  "business-dashboard",
  "terms",
  "privacy",
];

/**
 * Maps a page to its "parent" page for back-navigation.
 * If the current page isn't listed, back() does nothing.
 */
const BACK_MAP: Partial<Record<Page, Page>> = {
  "product-detail": "home",
  "review-write": "review",
  "edit-review": "profile",
  "my-applications": "profile",
  "my-favorites": "profile",
  "terms": "profile",
  "privacy": "profile",
  "create-product": "home",
  "manage-applicants": "home",
  "review-management": "home",
  "notifications": "home",
};

/**
 * Centralized navigation state + helpers.
 *
 * This is a stepping stone toward React Router — all page transitions go
 * through this hook. When we eventually adopt a router, we replace the
 * internals here without touching consumers.
 */
export function useNavigation(initialPage: Page = "signup") {
  const [currentPage, setCurrentPage] = useState<Page>(initialPage);

  const navigate = useCallback((page: Page) => {
    setCurrentPage(page);
  }, []);

  const goBack = useCallback(() => {
    const target = BACK_MAP[currentPage];
    if (target) {
      setCurrentPage(target);
    }
  }, [currentPage]);

  const handleTabChange = useCallback((tab: "home" | "review" | "profile") => {
    setCurrentPage(tab);
  }, []);

  const showBottomNav = !PAGES_WITHOUT_BOTTOM_NAV.includes(currentPage);

  return {
    currentPage,
    navigate,
    goBack,
    handleTabChange,
    showBottomNav,
  };
}
