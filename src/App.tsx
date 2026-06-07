import { useState, useEffect, useCallback, useRef } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Toaster } from "./components/ui/sonner";
import { HomePage } from "./components/HomePage";
import { BusinessHomePage } from "./components/BusinessHomePage";
import { BusinessDashboard } from "./components/BusinessDashboard";
import { ProductDetailPage } from "./components/ProductDetailPage";
import { ReviewPage } from "./components/ReviewPage";
import { ReviewWritePage } from "./components/ReviewWritePage";
import { EditReviewPage } from "./components/EditReviewPage";
import { ProfilePage } from "./components/ProfilePage";
import { PointShop } from "./components/PointShop";
import { PointHistory } from "./components/PointHistory";
import { SignupPage } from "./components/SignupPage";
import { LoginPage } from "./components/LoginPage";
import { StoreRegistrationPage } from "./components/StoreRegistrationPage";
import { MyApplicationsPage } from "./components/MyApplicationsPage";
import { MyFavoritesPage } from "./components/MyFavoritesPage";
import { CreateProductPage } from "./components/CreateProductPage";
import { ManageApplicantsPage } from "./components/ManageApplicantsPage";
import { NotificationsPage } from "./components/NotificationsPage";
import { ReviewManagementPage } from "./components/ReviewManagementPage";
import { BottomNav } from "./components/BottomNav";
import { TermsPage } from "./components/TermsPage";
import { PrivacyPage } from "./components/PrivacyPage";
import type { Product } from "./data/mockData";
import type { PointProduct, PointTransaction } from "./data/pointShop";
import { mockProducts } from "./data/mockData";
import { toast } from "sonner";
// 서버 연동 활성화
import { productsApi, applicationsApi, favoritesApi, reviewsApi, notificationsApi, businessApplicationsApi } from "./utils/api";
import { getLevelInfo } from "./data/levelSystem";
import { projectId } from "./utils/supabase/info";

type Page = "home" | "product-detail" | "review" | "review-write" | "edit-review" | "profile" | "signup" | "login" | "store-registration" | "my-applications" | "my-favorites" | "create-product" | "manage-applicants" | "notifications" | "review-management" | "point-shop" | "point-history" | "business-dashboard" | "terms" | "privacy";

export interface UserInfo {
  name: string;
  email: string;
  phone: string;
  userType: "reviewer" | "business";
  businessName?: string;
  businessNumber?: string;
  businessAddress?: string;
}

export type NotificationType = "selection" | "rejection" | "review-request" | "review-received" | "application";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  productId?: string;
  productName?: string;
  productImage?: string;
  createdAt: string;
  read: boolean;
}

export type ApplicationStatus = "pending" | "accepted" | "rejected" | "review-completed";

export interface Application {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  userLevel: number;
  status: ApplicationStatus;
  appliedAt: string;
}

export interface Review {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  pros: string;
  cons: string;
  improvements: string;
  photos: string[];
  createdAt: string;
  userId?: string;
  userName?: string;
  status: "published" | "hidden";
  reported: boolean;
  reportReason?: string;
  reportedAt?: string;
}

const pageVariants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 }
};

const pageTransition: any = {
  type: "tween",
  ease: "easeInOut",
  duration: 0.3
};

export default function App() {

  const [currentPage, setCurrentPage] = useState<Page>("signup");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [accessToken, setAccessToken] = useState<string>(() => {
    // Restore access token from localStorage on first load
    try {
      return localStorage.getItem('accessToken') || "";
    } catch {
      return "";
    }
  });
  // Helpers: user-scoped localStorage access (namespace per email)
  const localKey = useCallback((key: string, email?: string | null) => {
    const id = (email || userInfo?.email || '').trim();
    return id ? `${key}:${id}` : key;
  }, [userInfo?.email]);

  const localGet = useCallback((key: string, email?: string | null) => {
    try {
      const raw = localStorage.getItem(localKey(key, email));
      return raw;
    } catch { return null; }
  }, [localKey]);

  const localSet = useCallback((key: string, value: string, email?: string | null) => {
    try { localStorage.setItem(localKey(key, email), value); } catch {}
  }, [localKey]);

  const localRemove = useCallback((key: string, email?: string | null) => {
    try { localStorage.removeItem(localKey(key, email)); } catch {}
  }, [localKey]);

  // Global localStorage helpers (not user-scoped) for shared data like products
  const globalGet = useCallback((key: string) => {
    try {
      return localStorage.getItem(key);
    } catch { return null; }
  }, []);

  const globalSet = useCallback((key: string, value: string) => {
    try { localStorage.setItem(key, value); } catch {}
  }, []);

  const globalRemove = useCallback((key: string) => {
    try { localStorage.removeItem(key); } catch {}
  }, []);
  const [applications, setApplications] = useState<Application[]>(() => {
    const saved = localGet('applications');
    return saved ? JSON.parse(saved) : [];
  });
  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localGet('favorites');
    return saved ? JSON.parse(saved) : [];
  });
  
  // Track product likes by user
  const [productLikes, setProductLikes] = useState<string[]>(() => {
    const saved = localGet('productLikes');
    return saved ? JSON.parse(saved) : [];
  });
  
  // Load business products from localStorage on mount (GLOBAL - shared across all users)
  const [businessProducts, setBusinessProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem('businessProducts');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [allProducts, setAllProducts] = useState<Product[]>(() => {
    return [...mockProducts, ...businessProducts];
  });

  // businessProducts 변경 시 allProducts를 동기화하되,
  // 기존 카운트(currentApplicants/likeCount/reviewCount)는 최대한 유지한다.
  useEffect(() => {
    setAllProducts(prev => {
      const prevById = new Map(prev.map(product => [product.id, product]));
      return [...mockProducts, ...businessProducts].map(product => {
        const prevProduct = prevById.get(product.id);
        if (!prevProduct) return product;
        return {
          ...product,
          currentApplicants: prevProduct.currentApplicants ?? product.currentApplicants,
          likeCount: prevProduct.likeCount ?? product.likeCount,
          reviewCount: prevProduct.reviewCount ?? product.reviewCount,
        };
      });
    });
  }, [businessProducts]);
  
  const [completedReviews, setCompletedReviews] = useState<Review[]>(() => {
    const saved = localGet('completedReviews');
    return saved ? JSON.parse(saved) : [];
  });
  const [notifications, setNotifications] = useState<Notification[]>(() => {
    const saved = localGet('notifications');
    return saved ? JSON.parse(saved) : [];
  });
  const [pointProducts, setPointProducts] = useState<PointProduct[]>([]);
  const [pointTransactions, setPointTransactions] = useState<PointTransaction[]>(() => {
    const saved = localGet('pointTransactions');
    return saved ? JSON.parse(saved) : [];
  });
  const [userPoints, setUserPoints] = useState<number>(() => {
    const saved = localGet('userPoints');
    return saved ? parseInt(saved) : 0;
  });
  const [userLevel, setUserLevel] = useState<number>(() => {
    const saved = localGet('userLevel');
    return saved ? parseInt(saved) : 1;
  });


  // Persist access token to localStorage
  useEffect(() => {
    try {
      if (accessToken) {
        localStorage.setItem('accessToken', accessToken);
      } else {
        localStorage.removeItem('accessToken');
      }
    } catch {
      // ignore storage errors
    }
  }, [accessToken]);

  // Restore user session using access token if present
  useEffect(() => {
    const restoreSession = async () => {
      if (!accessToken || userInfo) return;
      try {
        const resp = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-98b21042/profile`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });
        const data = await resp.json();
        if (resp.ok && data?.success && data.user) {
          const restored = {
            name: data.user.name,
            email: data.user.email,
            phone: data.user.phone,
            userType: data.user.userType,
            businessName: data.user.businessName || undefined,
            businessNumber: data.user.businessNumber || undefined,
            businessAddress: data.user.businessAddress || undefined,
          } as UserInfo;
          setUserInfo(restored);
          toast.success('세션이 복원되었습니다');
        } else {
          // invalid token – clear
          setAccessToken("");
        }
      } catch (e) {
        // Network failure – keep offline mode
      }
    };
    restoreSession();
  }, [accessToken, userInfo]);

  // Load user data from backend when user logs in
  const loadUserData = useCallback(async () => {
    if (!accessToken) return;

    // Helper: merge arrays by id with server taking precedence, preserve locals if server is empty
    const mergeById = <T extends { id: string }>(serverList: T[] | undefined, localList: T[]): T[] => {
      const server = serverList ?? [];
      if (server.length === 0) return localList; // don't wipe local data with empty server
      const map = new Map<string, T>();
      // local first
      for (const item of localList) map.set(item.id, item);
      // server overrides
      for (const item of server) map.set(item.id, item);
      return Array.from(map.values());
    };

    // Helper: merge string arrays (union)
    const mergeStrings = (serverList: string[] | undefined, localList: string[]): string[] => {
      const set = new Set<string>(localList);
      for (const id of serverList ?? []) set.add(id);
      return Array.from(set);
    };

    let anySuccess = false;

    // Applications
    try {
      const appsData = userInfo?.userType === "business"
        ? await businessApplicationsApi.getAll(accessToken)
        : await applicationsApi.getAll(accessToken);
      if (appsData?.success) {
        anySuccess = true;
        const localApps: Application[] = (() => {
          try { return JSON.parse(localGet('applications') || '[]'); } catch { return []; }
        })();
        const mergedApps = mergeById<Application>(appsData.applications, localApps);
        setApplications(mergedApps);
        localSet('applications', JSON.stringify(mergedApps));
      }
    } catch (e) { console.warn('Failed to load applications:', e); }

    // Favorites
    try {
      const favsData = await favoritesApi.getAll(accessToken);
      if (favsData.success) {
        anySuccess = true;
        const localFavs: string[] = (() => {
          try { return JSON.parse(localGet('favorites') || '[]'); } catch { return []; }
        })();
        const mergedFavs = mergeStrings(favsData.favorites, localFavs);
        setFavorites(mergedFavs);
        localSet('favorites', JSON.stringify(mergedFavs));
      }
    } catch (e) { console.warn('Failed to load favorites:', e); }

    // Reviews
    try {
      const reviewsData = await reviewsApi.getAll(accessToken);
      if (reviewsData.success) {
        anySuccess = true;
        const localReviews: Review[] = (() => {
          try { return JSON.parse(localGet('completedReviews') || '[]'); } catch { return []; }
        })();
        const mergedReviews = mergeById<Review>(reviewsData.reviews, localReviews);
        setCompletedReviews(mergedReviews);
        localSet('completedReviews', JSON.stringify(mergedReviews));
      }
    } catch (e) { console.warn('Failed to load reviews:', e); }

    // Notifications
    try {
      const notifsData = await notificationsApi.getAll(accessToken);
      if (notifsData.success) {
        anySuccess = true;
        const localNotifs: Notification[] = (() => {
          try { return JSON.parse(localGet('notifications') || '[]'); } catch { return []; }
        })();
        const mergedNotifs = mergeById<Notification>(notifsData.notifications, localNotifs);
        setNotifications(mergedNotifs);
        localSet('notifications', JSON.stringify(mergedNotifs));
      }
    } catch (e) { console.warn('Failed to load notifications:', e); }

    // Business products (load for ALL users, not just business)
    try {
      const productsData = await productsApi.getAll(accessToken);
      let useLocal = false;
      let mergedBiz: Product[] = [];
      if (!productsData.success || !Array.isArray(productsData.products) || productsData.products.length === 0) {
        // 서버 실패 또는 빈 배열이면 localStorage만 사용
        useLocal = true;
        mergedBiz = (() => {
          try { return JSON.parse(globalGet('businessProducts') || '[]'); } catch { return []; }
        })();
      } else {
        // 서버 데이터가 있으면 서버+로컬 병합
        anySuccess = true;
        const localBiz: Product[] = (() => {
          try { return JSON.parse(globalGet('businessProducts') || '[]'); } catch { return []; }
        })();
        mergedBiz = mergeById<Product>(productsData.products, localBiz);
        globalSet('businessProducts', JSON.stringify(mergedBiz));
      }
      setBusinessProducts(mergedBiz);
      // businessProducts가 비어있을 때만 mockProducts 추가
      let mergedAll: Product[];
      if (mergedBiz.length > 0) {
        mergedAll = mergedBiz;
      } else {
        mergedAll = [...mockProducts];
      }
      setAllProducts(mergedAll);
    } catch (e) {
      console.warn('Failed to load business products from server, using localStorage:', e);
      // 서버 완전 실패 시에도 localStorage만 사용
      const localBiz: Product[] = (() => {
        try { return JSON.parse(globalGet('businessProducts') || '[]'); } catch { return []; }
      })();
      setBusinessProducts(localBiz);
      let mergedAll: Product[];
      if (localBiz.length > 0) {
        mergedAll = localBiz;
      } else {
        mergedAll = [...mockProducts];
      }
      setAllProducts(mergedAll);
    }

    if (anySuccess) {
      toast.success("서버 데이터 로드 완료");
    }
  }, [accessToken, userInfo?.userType]);

  // Avoid duplicate loads/toasts when dependencies change rapidly
  const lastLoadKeyRef = useRef<string>("");

  useEffect(() => {
    if (!userInfo || !accessToken) return;
    const key = `${accessToken}:${userInfo.userType}`;
    if (lastLoadKeyRef.current === key) return; // already loaded for this session
    lastLoadKeyRef.current = key;
    loadUserData();
  }, [userInfo, accessToken, loadUserData]);

  // Update level when points change
  useEffect(() => {
    const levelInfo = getLevelInfo(userPoints);
    if (levelInfo.level !== userLevel) {
      setUserLevel(levelInfo.level);
      localSet('userLevel', levelInfo.level.toString());
      if (levelInfo.level > userLevel) {
        toast.success(`🎉 레벨 ${levelInfo.level}로 승급했습니다!`);
      }
    }
  }, [userPoints]);

  // Note: businessProducts는 추가/삭제 시 직접 globalSet으로 저장하므로
  // 여기서 useEffect로 저장하지 않음 (중복 저장 및 의도치 않은 덮어쓰기 방지)

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    setCurrentPage("product-detail");
  };

  const handleApply = async () => {
    if (selectedProduct) {
      // Add to applications if not already applied
      if (!applications.find(app => app.productId === selectedProduct.id && app.userEmail === userInfo?.email)) {
        const newApplication: Application = {
          id: `application-${Date.now()}`,
          productId: selectedProduct.id,
          productName: selectedProduct.name,
          productImage: selectedProduct.image,
          userId: userInfo?.email || "",
          userName: userInfo?.name || "",
          userEmail: userInfo?.email || "",
          userPhone: userInfo?.phone || "",
          userLevel: 1, // Default user level
          status: "pending",
          appliedAt: new Date().toISOString(),
        };

        setApplications(prev => [...prev, newApplication]);
        
        // Update product's currentApplicants count
        setAllProducts(prev => prev.map(p => 
          p.id === selectedProduct.id 
            ? { ...p, currentApplicants: p.currentApplicants + 1 }
            : p
        ));
        
        setBusinessProducts(prev => prev.map(p => 
          p.id === selectedProduct.id 
            ? { ...p, currentApplicants: p.currentApplicants + 1 }
            : p
        ));
        
        toast.success("체험단 신청이 완료되었습니다!");

        // Save to localStorage
        const updatedApplications = [...applications, newApplication];
        localSet('applications', JSON.stringify(updatedApplications));

        // Save to backend
        if (accessToken) {
          try {
            await applicationsApi.create(newApplication, accessToken);
          } catch (error) {
            console.log("Backend save failed (using localStorage):", error);
          }
        }
        
        // Go back to home after short delay
        setTimeout(() => {
          setSelectedProduct(null);
          setCurrentPage("home");
        }, 1500);
      } else {
        toast.error("이미 신청한 체험단입니다");
      }
    }
  };

  const handleCancelApplication = async (productId: string) => {
    const app = applications.find(a => a.productId === productId && a.userEmail === userInfo?.email);
    if (!app) {
      toast.error("신청 내역을 찾을 수 없습니다");
      return;
    }
    if (app.status !== "pending") {
      toast.error("대기 중 상태에서만 취소할 수 있습니다");
      return;
    }

    // Remove locally
    const updated = applications.filter(a => a.id !== app.id);
    setApplications(updated);
    localSet('applications', JSON.stringify(updated));

    // Decrement product applicants count
    setAllProducts(prev => prev.map(p => 
      p.id === productId ? { ...p, currentApplicants: Math.max(0, (p.currentApplicants || 0) - 1) } : p
    ));
    setBusinessProducts(prev => prev.map(p => 
      p.id === productId ? { ...p, currentApplicants: Math.max(0, (p.currentApplicants || 0) - 1) } : p
    ));

    toast.success("신청이 취소되었습니다");

    // Backend delete (optional)
    if (accessToken) {
      applicationsApi.delete(app.id, accessToken).catch(error => {
        console.log("Backend delete failed (using localStorage):", (error as any)?.message || error);
      });
    }
  };

  const handleToggleFavorite = async (productId: string) => {
    const isCurrentlyFavorite = favorites.includes(productId);
    
    const newFavorites = isCurrentlyFavorite
      ? favorites.filter(id => id !== productId)
      : [...favorites, productId];
    
    setFavorites(newFavorites);
    
    // Save to localStorage
    localSet('favorites', JSON.stringify(newFavorites));
    
    if (isCurrentlyFavorite) {
      toast.success("찜 목록에서 제거되었습니다");
    } else {
      toast.success("찜 목록에 추가되었습니다");
    }

    // Save to backend (optional - fails silently)
    if (accessToken) {
      if (isCurrentlyFavorite) {
        favoritesApi.remove(productId, accessToken).catch(error => {
          console.log("Backend save failed (using localStorage):", error.message);
        });
      } else {
        favoritesApi.add(productId, accessToken).catch(error => {
          console.log("Backend save failed (using localStorage):", error.message);
        });
      }
    }
  };

  const handleToggleProductLike = async (productId: string) => {
    const isCurrentlyLiked = productLikes.includes(productId);
    const delta = isCurrentlyLiked ? -1 : 1;
    
    const newLikes = isCurrentlyLiked
      ? productLikes.filter(id => id !== productId)
      : [...productLikes, productId];
    
    setProductLikes(newLikes);
    
    // Update product's likeCount
    setAllProducts(prev => prev.map(p => 
      p.id === productId 
        ? { ...p, likeCount: Math.max(0, (p.likeCount || 0) + delta) }
        : p
    ));
    
    setBusinessProducts(prev => prev.map(p => 
      p.id === productId 
        ? { ...p, likeCount: Math.max(0, (p.likeCount || 0) + delta) }
        : p
    ));

    // 상세 페이지에서 보여주는 selectedProduct도 즉시 동기화
    setSelectedProduct(prev => {
      if (!prev || prev.id !== productId) return prev;
      return { ...prev, likeCount: Math.max(0, (prev.likeCount || 0) + delta) };
    });
    
    // Save to localStorage
    localSet('productLikes', JSON.stringify(newLikes));
    
    if (isCurrentlyLiked) {
      toast.success("좋아요를 취소했습니다");
    } else {
      toast.success("좋아요를 눌렀습니다 👍");
    }
  };

  const handleCreateProduct = async (productData: Omit<Product, "id">) => {
    const newProduct: Product = {
      ...productData,
      id: `business-${Date.now()}`
    };
    
    const updatedBusinessProducts = [...businessProducts, newProduct];
    setBusinessProducts(updatedBusinessProducts);
    // allProducts는 businessProducts useEffect에서 자동 동기화
    // Save to localStorage (backup)
    globalSet('businessProducts', JSON.stringify(updatedBusinessProducts));

    // Save to backend (optional - fails silently)
    if (accessToken) {
      productsApi.create(newProduct, accessToken).catch(error => {
        console.log("Backend save failed (using localStorage):", error.message);
      });
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    console.log('🗑️ Deleting product:', productId);
    console.log('📦 Before delete - businessProducts:', businessProducts.length);
    
    // Remove from businessProducts
    const updatedBusinessProducts = businessProducts.filter(p => p.id !== productId);
    setBusinessProducts(updatedBusinessProducts);
    // allProducts는 businessProducts useEffect에서 자동 동기화
    // Remove related applications
    const updatedApplications = applications.filter(app => app.productId !== productId);
    setApplications(updatedApplications);
    // Save to localStorage
    globalSet('businessProducts', JSON.stringify(updatedBusinessProducts));
    console.log('💾 After delete - saved to localStorage:', updatedBusinessProducts.length);
    console.log('✅ localStorage check:', JSON.parse(localStorage.getItem('businessProducts') || '[]').length);
    localSet('applications', JSON.stringify(updatedApplications));
    toast.success("체험단이 삭제되었습니다");
    // Delete from backend (optional - fails silently)
    if (accessToken) {
      // Backend delete API would go here
      console.log("Backend delete not implemented yet");
    }
  };

  const handleLogout = () => {
    setUserInfo(null);
    setAccessToken("");
    setCurrentPage("signup");
    try { localStorage.removeItem('accessToken'); } catch {}
    // Don't clear data - keep in localStorage for persistence
    // setApplications([]);
    // setFavorites([]);
    // setCompletedReviews([]);
    // setNotifications([]);
    setSelectedProduct(null);
    toast.success("로그아웃 되었습니다");
  };

  const handleTabChange = (tab: "home" | "review" | "profile") => {
    setCurrentPage(tab);
    setSelectedProduct(null);
  };

  const handleBack = () => {
    if (currentPage === "product-detail") {
      setCurrentPage("home");
      setSelectedProduct(null);
    } else if (currentPage === "review-write") {
      setCurrentPage("review");
      setSelectedProduct(null);
    } else if (currentPage === "edit-review") {
      setCurrentPage("profile");
      setSelectedProduct(null);
    } else if (currentPage === "my-applications" || currentPage === "my-favorites" || currentPage === "terms" || currentPage === "privacy") {
      setCurrentPage("profile");
    } else if (currentPage === "create-product" || currentPage === "manage-applicants" || currentPage === "review-management") {
      setCurrentPage("home");
      setSelectedProduct(null);
    } else if (currentPage === "notifications") {
      setCurrentPage("home");
    }
  };

  // 공통 사용자 데이터 초기화 로직
  const resetUserData = useCallback((userData: UserInfo, token: string) => {
    // loadUserData 실행 방지를 위해 lastLoadKeyRef 초기화
    lastLoadKeyRef.current = "";
    
    // 사용자별 데이터만 삭제 (businessProducts는 전역 데이터이므로 유지)
    try {
      localStorage.removeItem('applications');
      localStorage.removeItem('favorites');
      localStorage.removeItem('completedReviews');
      localStorage.removeItem('notifications');
      localStorage.removeItem('productLikes');
      localStorage.removeItem('userPoints');
      localStorage.removeItem('userLevel');
      localStorage.removeItem('pointTransactions');
    } catch {}
    
    // businessProducts는 기존 값 유지 (전역 공유 데이터)
    const existingProducts = (() => {
      try { return JSON.parse(localStorage.getItem('businessProducts') || '[]'); } catch { return []; }
    })();
    setBusinessProducts(existingProducts);
    
    // 사용자별 상태 초기화
    setApplications([]);
    setFavorites([]);
    setProductLikes([]);
    setCompletedReviews([]);
    setNotifications([]);
    setUserPoints(0);
    setUserLevel(1);
    
    // userInfo와 accessToken 설정
    setUserInfo(userData);
    setAccessToken(token);
    // loadUserData가 실행되도록 lastLoadKeyRef 설정
    lastLoadKeyRef.current = `${token}:${userData.userType}`;
  }, []);

  const handleSignupComplete = (userData: UserInfo, token?: string) => {
    if (!token) {
      setUserInfo(userData);
      setCurrentPage("home");
      return;
    }
    resetUserData(userData, token);
    setCurrentPage("home");
  };

  const handleLoginComplete = (userData: UserInfo, token: string) => {
    resetUserData(userData, token);
    setCurrentPage("home");
  };

  const handleSelectProductForReview = (product: Product) => {
    setSelectedProduct(product);
    setCurrentPage("review-write");
  };

  const handleEditReview = (product: Product) => {
    setSelectedProduct(product);
    setCurrentPage("edit-review");
  };

  const handleSubmitReview = async (reviewData: Omit<Review, "id" | "createdAt">) => {
    const newReview: Review = {
      ...reviewData,
      id: `review-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    
    const updatedReviews = [...completedReviews, newReview];
    setCompletedReviews(updatedReviews);
    
    // Save to localStorage
    localSet('completedReviews', JSON.stringify(updatedReviews));
    
    // Update product's reviewCount
    setAllProducts(prev => prev.map(p => 
      p.id === reviewData.productId 
        ? { ...p, reviewCount: p.reviewCount + 1 }
        : p
    ));
    
    setBusinessProducts(prev => prev.map(p => 
      p.id === reviewData.productId 
        ? { ...p, reviewCount: p.reviewCount + 1 }
        : p
    ));
    
    // Calculate points based on level
    const basePoints = 500;
    const earnedPoints = basePoints; // Can add level bonus later
    
    // Update points
    const newPoints = userPoints + earnedPoints;
    setUserPoints(newPoints);
    localSet('userPoints', newPoints.toString());
    
    // Add transaction
    const transaction: PointTransaction = {
      id: `trans-${Date.now()}`,
      type: "earn",
      amount: earnedPoints,
      description: "리뷰 작성",
      date: new Date().toLocaleString('ko-KR'),
      category: "리뷰"
    };
    const updatedTransactions = [transaction, ...pointTransactions];
    setPointTransactions(updatedTransactions);
    localSet('pointTransactions', JSON.stringify(updatedTransactions));
    
    toast.success(`리뷰가 등록되었습니다! +${earnedPoints}P 적립`);

    // Save to backend (optional - fails silently)
    if (accessToken) {
      reviewsApi.create(newReview, accessToken).catch(error => {
        console.log("Backend save failed (using localStorage):", error.message);
      });
    }
    
    // Go back to review page
    setTimeout(() => {
      setSelectedProduct(null);
      setCurrentPage("review");
    }, 1500);
  };

  const handleUpdateApplicationStatus = async (applicationId: string, status: ApplicationStatus) => {
    const application = applications.find(app => app.id === applicationId);
    
    const updatedApplications = applications.map(app => 
      app.id === applicationId 
        ? { ...app, status, reviewedAt: new Date().toISOString() }
        : app
    );
    
    setApplications(updatedApplications);
    
    // Update product's currentApplicants count if rejected
    if (status === "rejected" && application) {
      setAllProducts(prev => prev.map(p => 
        p.id === application.productId && p.currentApplicants > 0
          ? { ...p, currentApplicants: p.currentApplicants - 1 }
          : p
      ));
      
      setBusinessProducts(prev => prev.map(p => 
        p.id === application.productId && p.currentApplicants > 0
          ? { ...p, currentApplicants: p.currentApplicants - 1 }
          : p
      ));
    }
    
    // Save to localStorage
    localSet('applications', JSON.stringify(updatedApplications));

    // Update in backend (optional - fails silently)
    if (accessToken) {
      applicationsApi.updateStatus(applicationId, status, accessToken).catch(error => {
        console.log("Backend save failed (using localStorage):", error.message);
      });
    }

    // Create notification for the user
    if (application) {
      let notification: Notification;
      
      if (status === "accepted") {
        notification = {
          id: `notif-${Date.now()}`,
          type: "selection",
          title: "🎉 체험단에 선정되었습니다!",
          message: "축하합니다! 체험단으로 선정되셨습니다. 체험 후 솔직한 리뷰를 작성해주세요.",
          productId: application.productId,
          productName: application.productName,
          productImage: application.productImage,
          createdAt: new Date().toISOString(),
          read: false,
        };
        toast.success("체험단으로 선정했습니다");
      } else if (status === "rejected") {
        notification = {
          id: `notif-${Date.now()}`,
          type: "rejection",
          title: "체험단 선정 결과 안내",
          message: "아쉽지만 이번 체험단에 선정되지 못했습니다. 다음 기회에 꼭 만나요!",
          productId: application.productId,
          productName: application.productName,
          productImage: application.productImage,
          createdAt: new Date().toISOString(),
          read: false,
        };
        toast.success("미선정 처리했습니다");
      } else {
        return;
      }

      const updatedNotifications = [notification, ...notifications];
      setNotifications(updatedNotifications);
      
      // Save to localStorage
      localSet('notifications', JSON.stringify(updatedNotifications));

      // Save notification to backend (optional - fails silently)
      if (accessToken) {
        notificationsApi.create({ ...notification, targetUserId: application.userId }, accessToken).catch(error => {
          console.log("Backend save failed (using localStorage):", error.message);
        });
      }
    }
  };

  const handleManageApplicants = (product: Product) => {
    setSelectedProduct(product);
    setCurrentPage("manage-applicants");
  };

  const handleReportReview = (reviewId: string, reason: string) => {
    setCompletedReviews(prev =>
      prev.map(review =>
        review.id === reviewId
          ? { ...review, reported: true, reportReason: reason, reportedAt: new Date().toISOString() }
          : review
      )
    );
    toast.success("리뷰가 신고되었습니다. 검토 후 조치하겠습니다");
  };

  const handleToggleReviewVisibility = (reviewId: string) => {
    setCompletedReviews(prev =>
      prev.map(review =>
        review.id === reviewId
          ? { ...review, status: review.status === "published" ? "hidden" : "published" }
          : review
      )
    );
    
    const review = completedReviews.find(r => r.id === reviewId);
    if (review) {
      if (review.status === "published") {
        toast.success("리뷰가 비공개 처리되었습니다");
      } else {
        toast.success("리뷰가 공개 처리되었습니다");
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#fffef5]">
      {/* Main Content */}
      <AnimatePresence mode="wait">
        {currentPage === "signup" && (
          <motion.div
            key="signup"
            initial="initial"
            animate="animate"
            exit="exit"
            variants={pageVariants}
            transition={pageTransition}
          >
            <SignupPage 
              onBack={() => setCurrentPage("home")} 
              onSignupComplete={handleSignupComplete}
              onSwitchToLogin={() => setCurrentPage("login")}
            />
          </motion.div>
        )}

        {currentPage === "login" && (
          <motion.div
            key="login"
            initial="initial"
            animate="animate"
            exit="exit"
            variants={pageVariants}
            transition={pageTransition}
          >
            <LoginPage 
              onBack={() => setCurrentPage("home")} 
              onLoginComplete={handleLoginComplete}
              onSwitchToSignup={() => setCurrentPage("signup")}
            />
          </motion.div>
        )}

        {currentPage === "store-registration" && userInfo && (
          <motion.div
            key="store-registration"
            initial="initial"
            animate="animate"
            exit="exit"
            variants={pageVariants}
            transition={pageTransition}
          >
            <StoreRegistrationPage 
              onBack={() => setCurrentPage("home")} 
              onComplete={() => setCurrentPage("home")}
              userId={userInfo.email}
              accessToken={accessToken}
            />
          </motion.div>
        )}

        {currentPage === "home" && userInfo && (
          userInfo.userType === "business" ? (
            <motion.div
              key="business-home"
              initial="initial"
              animate="animate"
              exit="exit"
              variants={pageVariants}
              transition={pageTransition}
            >
              <BusinessHomePage 
                userInfo={userInfo} 
                onProductClick={handleProductClick}
                myProducts={businessProducts}
                onCreateProduct={() => setCurrentPage("create-product")}
                onManageApplicants={handleManageApplicants}
                onManageReviews={() => setCurrentPage("review-management")}
                onViewDashboard={() => setCurrentPage("business-dashboard")}
                onDeleteProduct={handleDeleteProduct}
              />
            </motion.div>
          ) : (
            <motion.div
              key="home"
              initial="initial"
              animate="animate"
              exit="exit"
              variants={pageVariants}
              transition={pageTransition}
            >
              <HomePage 
                onProductClick={handleProductClick} 
                userName={userInfo.name}
                favorites={favorites}
                onToggleFavorite={handleToggleFavorite}
                products={allProducts}
                onNotificationsClick={() => setCurrentPage("notifications")}
                unreadNotifications={notifications.filter(n => !n.read).length}
              />
            </motion.div>
          )
        )}

        {currentPage === "create-product" && userInfo && userInfo.userType === "business" && (
          <motion.div
            key="create-product"
            initial="initial"
            animate="animate"
            exit="exit"
            variants={pageVariants}
            transition={pageTransition}
          >
            <CreateProductPage
              onBack={handleBack}
              onCreateProduct={handleCreateProduct}
              userInfo={userInfo}
            />
          </motion.div>
        )}

        {currentPage === "product-detail" && selectedProduct && (
          <motion.div
            key="product-detail"
            initial="initial"
            animate="animate"
            exit="exit"
            variants={pageVariants}
            transition={pageTransition}
          >
            <ProductDetailPage
              product={selectedProduct}
              onBack={handleBack}
              onApply={handleApply}
              isFavorite={favorites.includes(selectedProduct.id)}
              onToggleFavorite={() => handleToggleFavorite(selectedProduct.id)}
              isLiked={productLikes.includes(selectedProduct.id)}
              onToggleLike={() => handleToggleProductLike(selectedProduct.id)}
              reviews={completedReviews}
              hasApplied={applications.some(a => a.productId === selectedProduct.id && a.userEmail === userInfo?.email)}
              canCancel={applications.some(a => a.productId === selectedProduct.id && a.userEmail === userInfo?.email && a.status === "pending")}
              onCancel={() => handleCancelApplication(selectedProduct.id)}
            />
          </motion.div>
        )}

        {currentPage === "review" && userInfo && userInfo.userType === "reviewer" && (
          <motion.div
            key="review"
            initial="initial"
            animate="animate"
            exit="exit"
            variants={pageVariants}
            transition={pageTransition}
          >
            <ReviewPage
              applications={applications}
              completedReviews={completedReviews}
              onSelectProduct={handleSelectProductForReview}
              userName={userInfo.name}
            />
          </motion.div>
        )}

        {currentPage === "review-write" && selectedProduct && userInfo && (
          <motion.div
            key="review-write"
            initial="initial"
            animate="animate"
            exit="exit"
            variants={pageVariants}
            transition={pageTransition}
          >
            <ReviewWritePage
              product={selectedProduct}
              onBack={handleBack}
              userName={userInfo.name}
              onSubmit={handleSubmitReview}
            />
          </motion.div>
        )}

        {currentPage === "edit-review" && selectedProduct && userInfo && (
          <motion.div
            key="edit-review"
            initial="initial"
            animate="animate"
            exit="exit"
            variants={pageVariants}
            transition={pageTransition}
          >
            <EditReviewPage
              review={{
                id: selectedProduct.id,
                productName: selectedProduct.name,
                productImage: selectedProduct.image,
                comment: selectedProduct.description,
                date: "2025.11.08"
              }}
              onBack={handleBack}
            />
          </motion.div>
        )}

        {currentPage === "my-applications" && userInfo && (
          <motion.div
            key="my-applications"
            initial="initial"
            animate="animate"
            exit="exit"
            variants={pageVariants}
            transition={pageTransition}
          >
            <MyApplicationsPage
              onBack={handleBack}
              applications={applications}
              onProductClick={handleProductClick}
            />
          </motion.div>
        )}

        {currentPage === "my-favorites" && userInfo && (
          <motion.div
            key="my-favorites"
            initial="initial"
            animate="animate"
            exit="exit"
            variants={pageVariants}
            transition={pageTransition}
          >
            <MyFavoritesPage
              onBack={handleBack}
              favorites={favorites.map(id => allProducts.find(p => p.id === id)).filter(Boolean) as Product[]}
              onProductClick={handleProductClick}
              onToggleFavorite={handleToggleFavorite}
            />
          </motion.div>
        )}

        {currentPage === "profile" && userInfo && (
          <motion.div
            key="profile"
            initial="initial"
            animate="animate"
            exit="exit"
            variants={pageVariants}
            transition={pageTransition}
          >
            <ProfilePage 
              userInfo={userInfo}
              completedReviews={completedReviews}
              userPoints={userPoints}
              userLevel={userLevel}
              onNavigateToApplications={() => setCurrentPage("my-applications")}
              onNavigateToFavorites={() => setCurrentPage("my-favorites")}
              onNavigateToPointShop={() => setCurrentPage("point-shop")}
              onNavigateToPointHistory={() => setCurrentPage("point-history")}
              onEditReview={handleEditReview}
              onNavigateToDashboard={() => setCurrentPage("business-dashboard")}
              onNavigateToTerms={() => setCurrentPage("terms")}
              onNavigateToPrivacy={() => setCurrentPage("privacy")}
              onLogout={handleLogout}
            />
          </motion.div>
        )}

        {currentPage === "terms" && userInfo && (
          <motion.div
            key="terms"
            initial="initial"
            animate="animate"
            exit="exit"
            variants={pageVariants}
            transition={pageTransition}
          >
            <TermsPage onBack={handleBack} />
          </motion.div>
        )}

        {currentPage === "privacy" && userInfo && (
          <motion.div
            key="privacy"
            initial="initial"
            animate="animate"
            exit="exit"
            variants={pageVariants}
            transition={pageTransition}
          >
            <PrivacyPage onBack={handleBack} />
          </motion.div>
        )}

        {currentPage === "manage-applicants" && userInfo && selectedProduct && (
          <motion.div
            key="manage-applicants"
            initial="initial"
            animate="animate"
            exit="exit"
            variants={pageVariants}
            transition={pageTransition}
          >
            <ManageApplicantsPage
              onBack={handleBack}
              applications={applications}
              onProductClick={handleProductClick}
              onUpdateStatus={handleUpdateApplicationStatus}
              selectedProduct={selectedProduct}
              product={selectedProduct}
            />
          </motion.div>
        )}

        {currentPage === "notifications" && userInfo && (
          <motion.div
            key="notifications"
            initial="initial"
            animate="animate"
            exit="exit"
            variants={pageVariants}
            transition={pageTransition}
          >
            <NotificationsPage
              onBack={handleBack}
              notifications={notifications}
              onMarkAsRead={async (id) => {
                setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
                if (accessToken) {
                  notificationsApi.markAsRead(id, accessToken).catch(error => {
                    console.log("Backend save failed (using localStorage):", error.message);
                  });
                }
              }}
            />
          </motion.div>
        )}

        {currentPage === "review-management" && userInfo && (
          <motion.div
            key="review-management"
            initial="initial"
            animate="animate"
            exit="exit"
            variants={pageVariants}
            transition={pageTransition}
          >
            <ReviewManagementPage
              onBack={handleBack}
              reviews={completedReviews}
              onToggleVisibility={handleToggleReviewVisibility}
              onReportReview={handleReportReview}
            />
          </motion.div>
        )}

        {currentPage === "point-shop" && userInfo && (
          <motion.div
            key="point-shop"
            initial="initial"
            animate="animate"
            exit="exit"
            variants={pageVariants}
            transition={pageTransition}
          >
            <PointShop
              onBack={() => {
                setCurrentPage("profile");
              }}
              userPoints={userPoints}
              userLevel={userLevel}
              onPurchase={(product) => {
                // Deduct points
                const newPoints = userPoints - product.price;
                setUserPoints(newPoints);
                localSet('userPoints', newPoints.toString());
                
                // Add transaction
                const transaction: PointTransaction = {
                  id: `trans-${Date.now()}`,
                  type: "spend",
                  amount: product.price,
                  description: product.name,
                  date: new Date().toLocaleString('ko-KR'),
                  category: product.category,
                };
                const updatedTransactions = [transaction, ...pointTransactions];
                setPointTransactions(updatedTransactions);
                localSet('pointTransactions', JSON.stringify(updatedTransactions));
                
                toast.success(`${product.name} 구매가 완료되었습니다!`);
              }}
            />
          </motion.div>
        )}

        {currentPage === "point-history" && userInfo && (
          <motion.div
            key="point-history"
            initial="initial"
            animate="animate"
            exit="exit"
            variants={pageVariants}
            transition={pageTransition}
          >
            <PointHistory
              onBack={() => {
                setCurrentPage("profile");
              }}
              transactions={pointTransactions}
              currentPoints={userPoints}
            />
          </motion.div>
        )}

        {currentPage === "business-dashboard" && userInfo && userInfo.userType === "business" && (
          <motion.div
            key="business-dashboard"
            initial="initial"
            animate="animate"
            exit="exit"
            variants={pageVariants}
            transition={pageTransition}
          >
            <BusinessDashboard
              onBack={() => setCurrentPage("home")}
              products={businessProducts}
              applications={applications}
              reviews={completedReviews}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Navigation */}
      {userInfo && currentPage !== "signup" && currentPage !== "login" && currentPage !== "product-detail" && currentPage !== "review-write" && currentPage !== "edit-review" && currentPage !== "my-applications" && currentPage !== "my-favorites" && currentPage !== "create-product" && currentPage !== "manage-applicants" && currentPage !== "notifications" && currentPage !== "review-management" && currentPage !== "point-shop" && currentPage !== "point-history" && currentPage !== "business-dashboard" && currentPage !== "terms" && currentPage !== "privacy" && (
        <BottomNav 
          activeTab={currentPage as "home" | "review" | "profile"} 
          onTabChange={handleTabChange}
          userType={userInfo.userType}
        />
      )}

      {/* Toast Notifications */}
      <Toaster position="top-center" />
    </div>
  );
}