// @deno-types="npm:@types/hono"
import { Hono } from "npm:hono@4";
import { cors } from "npm:hono@4/cors";
import { logger } from "npm:hono@4/logger";
import { createClient } from "jsr:@supabase/supabase-js@2";
import * as kv from "./kv_store.ts";

declare const Deno: any;

const app = new Hono().basePath('/make-server-98b21042');

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Initialize Supabase Admin Client
const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
);

// Initialize Supabase Client for auth
const supabaseAuth = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_ANON_KEY') ?? '',
);

const isMissingKvTableError = (error: unknown): boolean => {
  const message = error instanceof Error ? error.message : String(error);
  return message.includes("kv_store_98b21042");
};

// Health check endpoint
// NOTE: Removed duplicate function name prefix from all routes.
app.get("/health", (c: { json: (arg0: { status: string; }) => any; }) => {
  return c.json({ status: "ok" });
});

// Sign up endpoint
app.post("/signup", async (c: { req: { json: () => any; }; json: (arg0: { error?: string; success?: boolean; user?: { id: any; email: any; name: any; phone: any; userType: any; businessName: any; businessNumber: any; businessAddress: any; createdAt: string; }; message?: string; }, arg1: number | undefined) => any; }) => {
  try {
    const body = await c.req.json();
    const { email, password, name, phone, userType, businessName, businessNumber, businessAddress } = body;

    if (!email || !password || !name || !phone || !userType) {
      return c.json({ error: "필수 정보를 모두 입력해주세요" }, 400);
    }

    // Check if user already exists (KV table may not exist on newly linked projects)
    let existingUser: any = null;
    try {
      existingUser = await kv.get(`user:${email}`);
    } catch (error) {
      if (!isMissingKvTableError(error)) {
        throw error;
      }
      console.log("KV table not found during signup; continuing without KV check");
    }
    if (existingUser) {
      return c.json({ error: "이미 존재하는 이메일입니다" }, 400);
    }

    // Create user with Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      user_metadata: { name, phone, userType },
      // Automatically confirm the user's email since an email server hasn't been configured.
      email_confirm: true
    });

    if (authError) {
      console.log(`Auth error during signup: ${authError.message}`);
      return c.json({ error: `회원가입 실패: ${authError.message}` }, 400);
    }

    // Store user data in KV store
    const userData = {
      id: authData.user.id,
      email,
      name,
      phone,
      userType,
      businessName: businessName || null,
      businessNumber: businessNumber || null,
      businessAddress: businessAddress || null,
      createdAt: new Date().toISOString(),
    };

    try {
      await kv.set(`user:${email}`, userData);
      await kv.set(`user:id:${authData.user.id}`, userData);
    } catch (error) {
      if (!isMissingKvTableError(error)) {
        throw error;
      }
      console.log("KV table not found during signup; returning auth-backed user data");
    }

    return c.json({ 
      success: true, 
      user: userData,
      message: "회원가입이 완료되었습니다" 
    }, 200);
  } catch (error: unknown) {
    console.log(`Error during signup:`, error);
    const message = error instanceof Error ? error.message : String(error);
    return c.json({ error: `서버 오류: ${message}` }, 500);
  }
});

// Sign in endpoint
interface SignInRequest {
  email: string;
  password: string;
}

interface SignInResponse {
  success: boolean;
  user: any;
  accessToken: string;
  message: string;
}

app.post("/signin", async (c: { req: { json: () => Promise<SignInRequest> }; json: (arg0: { error?: string; success?: boolean; user?: any; accessToken?: string; message?: string }, arg1: number) => any }) => {
  try {
    const body: SignInRequest = await c.req.json();
    const { email, password } = body;

    if (!email || !password) {
      return c.json({ error: "이메일과 비밀번호를 입력해주세요" }, 400);
    }

    // Sign in with Supabase Auth
    const { data: signInData, error: signInError } = await supabaseAuth.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      console.log(`Auth error during signin: ${signInError.message}`);
      return c.json({ error: "이메일 또는 비밀번호가 올바르지 않습니다" }, 401);
    }

    let userData: any = null;
    try {
      userData = await kv.get(`user:${email}`);
    } catch (error) {
      if (!isMissingKvTableError(error)) {
        throw error;
      }
      console.log("KV table not found during signin; using auth metadata fallback");
    }

    if (!userData) {
      const authUser = signInData.user;
      userData = {
        id: authUser.id,
        email: authUser.email,
        name: authUser.user_metadata?.name ?? "",
        phone: authUser.user_metadata?.phone ?? "",
        userType: authUser.user_metadata?.userType ?? "reviewer",
        businessName: null,
        businessNumber: null,
        businessAddress: null,
        createdAt: authUser.created_at,
      };
    }

    const response: SignInResponse = {
      success: true, 
      user: userData,
      accessToken: signInData.session.access_token,
      message: "로그인 성공" 
    };

    return c.json(response, 200);
  } catch (error: unknown) {
    console.log(`Error during signin:`, error);
    const message = error instanceof Error ? error.message : String(error);
    return c.json({ error: `서버 오류: ${message}` }, 500);
  }
});

// Get user profile endpoint (requires auth)
app.get("/profile", async (c: { req: { header: (arg0: string) => string; }; json: (arg0: { error?: string; success?: boolean; user?: any; }, arg1: number) => any; }) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: "인증 토큰이 필요합니다" }, 401);
    }

    const { data: { user }, error } = await supabaseAdmin.auth.getUser(accessToken);
    
    if (error || !user) {
      return c.json({ error: "유효하지 않은 토큰입니다" }, 401);
    }

    let userData: any = null;
    try {
      userData = await kv.get(`user:id:${user.id}`);
    } catch (error) {
      if (!isMissingKvTableError(error)) {
        throw error;
      }
      console.log("KV table not found during profile; using auth metadata fallback");
    }

    if (!userData) {
      userData = {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name ?? "",
        phone: user.user_metadata?.phone ?? "",
        userType: user.user_metadata?.userType ?? "reviewer",
        businessName: null,
        businessNumber: null,
        businessAddress: null,
        createdAt: user.created_at,
      };
    }

    return c.json({ success: true, user: userData }, 200);
  } catch (error: unknown) {
    console.log(`Error getting profile:`, error);
    const message = error instanceof Error ? error.message : String(error);
    return c.json({ error: `서버 오류: ${message}` }, 500);
  }
});

// Create or update product (체험단 등록)
app.post("/products", async (c: { req: { header: (arg0: string) => string; json: () => any }; json: (arg0: { error?: string; success?: boolean; product?: any }, arg1: number) => any }) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: "인증 토큰이 필요합니다" }, 401);
    }

    const { data: { user }, error } = await supabaseAdmin.auth.getUser(accessToken);
    
    if (error || !user) {
      return c.json({ error: "유효하지 않은 토큰입니다" }, 401);
    }

    const body = await c.req.json();
    const productData = {
      ...body,
      userId: user.id,
      createdAt: new Date().toISOString(),
    };

    await kv.set(`product:${productData.id}`, productData);
    
    // Add to user's products list
    const userProducts = await kv.get(`user:${user.id}:products`) || [];
    userProducts.push(productData.id);
    await kv.set(`user:${user.id}:products`, userProducts);

    return c.json({ success: true, product: productData }, 200);
  } catch (error: unknown) {
    console.log(`Error creating product:`, error);
    const message = error instanceof Error ? error.message : String(error);
    return c.json({ error: `서버 오류: ${message}` }, 500);
  }
});

// Get user's products
app.get("/products", async (c: { req: { header: (arg0: string) => string }; json: (arg0: { error?: string; success?: boolean; products?: any[] }, arg1: number) => any }) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: "인증 토큰이 필요합니다" }, 401);
    }

    const { data: { user }, error } = await supabaseAdmin.auth.getUser(accessToken);
    
    if (error || !user) {
      return c.json({ error: "유효하지 않은 토큰입니다" }, 401);
    }

    const productIds = await kv.get(`user:${user.id}:products`) || [];
    const products = await Promise.all(
      productIds.map((id: string) => kv.get(`product:${id}`))
    );

    return c.json({ success: true, products: products.filter(Boolean) }, 200);
  } catch (error: unknown) {
    console.log(`Error getting products:`, error);
    const message = error instanceof Error ? error.message : String(error);
    return c.json({ error: `서버 오류: ${message}` }, 500);
  }
});

// Create application (체험단 신청)
app.post("/applications", async (c: { req: { header: (arg0: string) => string; json: () => any }; json: (arg0: { error?: string; success?: boolean; application?: any }, arg1: number) => any }) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: "인증 토큰이 필요합니다" }, 401);
    }

    const { data: { user }, error } = await supabaseAdmin.auth.getUser(accessToken);
    
    if (error || !user) {
      return c.json({ error: "유효하지 않은 토큰입니다" }, 401);
    }

    const body = await c.req.json();
    const applicationData = {
      ...body,
      userId: user.id,
      appliedAt: new Date().toISOString(),
    };

    await kv.set(`application:${applicationData.id}`, applicationData);
    
    // Add to user's applications list
    const userApplications = await kv.get(`user:${user.id}:applications`) || [];
    userApplications.push(applicationData.id);
    await kv.set(`user:${user.id}:applications`, userApplications);

    return c.json({ success: true, application: applicationData }, 200);
  } catch (error: unknown) {
    console.log(`Error creating application:`, error);
    const message = error instanceof Error ? error.message : String(error);
    return c.json({ error: `서버 오류: ${message}` }, 500);
  }
});

// Get user's applications
app.get("/applications", async (c: { req: { header: (arg0: string) => string }; json: (arg0: { error?: string; success?: boolean; applications?: any[] }, arg1: number) => any }) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: "인증 토큰이 필요합니다" }, 401);
    }

    const { data: { user }, error } = await supabaseAdmin.auth.getUser(accessToken);
    
    if (error || !user) {
      return c.json({ error: "유효하지 않은 토큰입니다" }, 401);
    }

    const applicationIds = await kv.get(`user:${user.id}:applications`) || [];
    const applications = await Promise.all(
      applicationIds.map((id: string) => kv.get(`application:${id}`))
    );

    return c.json({ success: true, applications: applications.filter(Boolean) }, 200);
  } catch (error: unknown) {
    console.log(`Error getting applications:`, error);
    const message = error instanceof Error ? error.message : String(error);
    return c.json({ error: `서버 오류: ${message}` }, 500);
  }
});

// Update application status (사업자가 승인/거절)
app.put("/applications/:id", async (c: { req: { header: (arg0: string) => string; json: () => any; param: (arg0: string) => string }; json: (arg0: { error?: string; success?: boolean; application?: any }, arg1: number) => any }) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: "인증 토큰이 필요합니다" }, 401);
    }

    const { data: { user }, error } = await supabaseAdmin.auth.getUser(accessToken);
    
    if (error || !user) {
      return c.json({ error: "유효하지 않은 토큰입니다" }, 401);
    }

    const applicationId = c.req.param('id');
    const application = await kv.get(`application:${applicationId}`);
    
    if (!application) {
      return c.json({ error: "신청 정보를 찾을 수 없습니다" }, 404);
    }

    const body = await c.req.json();
    const updatedApplication = {
      ...application,
      ...body,
      reviewedAt: new Date().toISOString(),
    };

    await kv.set(`application:${applicationId}`, updatedApplication);

    return c.json({ success: true, application: updatedApplication }, 200);
  } catch (error: unknown) {
    console.log(`Error updating application:`, error);
    const message = error instanceof Error ? error.message : String(error);
    return c.json({ error: `서버 오류: ${message}` }, 500);
  }
});

// Add/Remove favorite (찜하기)
app.post("/favorites", async (c: { req: { header: (arg0: string) => string; json: () => any }; json: (arg0: { error?: string; success?: boolean; favorites?: string[] }, arg1: number) => any }) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: "인증 토큰이 필요합니다" }, 401);
    }

    const { data: { user }, error } = await supabaseAdmin.auth.getUser(accessToken);
    
    if (error || !user) {
      return c.json({ error: "유효하지 않은 토큰입니다" }, 401);
    }

    const body = await c.req.json();
    const { productId, action } = body; // action: 'add' or 'remove'

    let favorites = await kv.get(`user:${user.id}:favorites`) || [];
    
    if (action === 'add') {
      if (!favorites.includes(productId)) {
        favorites.push(productId);
      }
    } else if (action === 'remove') {
      favorites = favorites.filter((id: string) => id !== productId);
    }

    await kv.set(`user:${user.id}:favorites`, favorites);

    return c.json({ success: true, favorites }, 200);
  } catch (error: unknown) {
    console.log(`Error updating favorites:`, error);
    const message = error instanceof Error ? error.message : String(error);
    return c.json({ error: `서버 오류: ${message}` }, 500);
  }
});

// Get user's favorites
app.get("/favorites", async (c: { req: { header: (arg0: string) => string }; json: (arg0: { error?: string; success?: boolean; favorites?: string[] }, arg1: number) => any }) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: "인증 토큰이 필요합니다" }, 401);
    }

    const { data: { user }, error } = await supabaseAdmin.auth.getUser(accessToken);
    
    if (error || !user) {
      return c.json({ error: "유효하지 않은 토큰입니다" }, 401);
    }

    const favorites = await kv.get(`user:${user.id}:favorites`) || [];

    return c.json({ success: true, favorites }, 200);
  } catch (error: unknown) {
    console.log(`Error getting favorites:`, error);
    const message = error instanceof Error ? error.message : String(error);
    return c.json({ error: `서버 오류: ${message}` }, 500);
  }
});

// Create review (리뷰 작성)
app.post("/reviews", async (c: { req: { header: (arg0: string) => string; json: () => any }; json: (arg0: { error?: string; success?: boolean; review?: any }, arg1: number) => any }) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: "인증 토큰이 필요합니다" }, 401);
    }

    const { data: { user }, error } = await supabaseAdmin.auth.getUser(accessToken);
    
    if (error || !user) {
      return c.json({ error: "유효하지 않은 토큰입니다" }, 401);
    }

    const body = await c.req.json();
    const reviewData = {
      ...body,
      userId: user.id,
      createdAt: new Date().toISOString(),
    };

    await kv.set(`review:${reviewData.id}`, reviewData);
    
    // Add to user's reviews list
    const userReviews = await kv.get(`user:${user.id}:reviews`) || [];
    userReviews.push(reviewData.id);
    await kv.set(`user:${user.id}:reviews`, userReviews);

    return c.json({ success: true, review: reviewData }, 200);
  } catch (error: unknown) {
    console.log(`Error creating review:`, error);
    const message = error instanceof Error ? error.message : String(error);
    return c.json({ error: `서버 오류: ${message}` }, 500);
  }
});

// Get user's reviews
app.get("/reviews", async (c: { req: { header: (arg0: string) => string }; json: (arg0: { error?: string; success?: boolean; reviews?: any[] }, arg1: number) => any }) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: "인증 토큰이 필요합니다" }, 401);
    }

    const { data: { user }, error } = await supabaseAdmin.auth.getUser(accessToken);
    
    if (error || !user) {
      return c.json({ error: "유효하지 않은 토큰입니다" }, 401);
    }

    const reviewIds = await kv.get(`user:${user.id}:reviews`) || [];
    const reviews = await Promise.all(
      reviewIds.map((id: string) => kv.get(`review:${id}`))
    );

    return c.json({ success: true, reviews: reviews.filter(Boolean) }, 200);
  } catch (error: unknown) {
    console.log(`Error getting reviews:`, error);
    const message = error instanceof Error ? error.message : String(error);
    return c.json({ error: `서버 오류: ${message}` }, 500);
  }
});

// Create notification (알림 생성)
app.post("/notifications", async (c: { req: { header: (arg0: string) => string; json: () => any }; json: (arg0: { error?: string; success?: boolean; notification?: any }, arg1: number) => any }) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: "인증 토큰이 필요합니다" }, 401);
    }

    const { data: { user }, error } = await supabaseAdmin.auth.getUser(accessToken);
    
    if (error || !user) {
      return c.json({ error: "유효하지 않은 토큰입니다" }, 401);
    }

    const body = await c.req.json();
    const notificationData = {
      ...body,
      createdAt: new Date().toISOString(),
    };

    await kv.set(`notification:${notificationData.id}`, notificationData);
    
    // Add to target user's notifications list
    const targetUserId = body.targetUserId;
    const userNotifications = await kv.get(`user:${targetUserId}:notifications`) || [];
    userNotifications.push(notificationData.id);
    await kv.set(`user:${targetUserId}:notifications`, userNotifications);

    return c.json({ success: true, notification: notificationData }, 200);
  } catch (error: unknown) {
    console.log(`Error creating notification:`, error);
    const message = error instanceof Error ? error.message : String(error);
    return c.json({ error: `서버 오류: ${message}` }, 500);
  }
});

// Get user's notifications
app.get("/notifications", async (c: { req: { header: (arg0: string) => string }; json: (arg0: { error?: string; success?: boolean; notifications?: any[] }, arg1: number) => any }) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: "인증 토큰이 필요합니다" }, 401);
    }

    const { data: { user }, error } = await supabaseAdmin.auth.getUser(accessToken);
    
    if (error || !user) {
      return c.json({ error: "유효하지 않은 토큰입니다" }, 401);
    }

    const notificationIds = await kv.get(`user:${user.id}:notifications`) || [];
    const notifications = await Promise.all(
      notificationIds.map((id: string) => kv.get(`notification:${id}`))
    );

    return c.json({ success: true, notifications: notifications.filter(Boolean) }, 200);
  } catch (error: unknown) {
    console.log(`Error getting notifications:`, error);
    const message = error instanceof Error ? error.message : String(error);
    return c.json({ error: `서버 오류: ${message}` }, 500);
  }
});

// Mark notification as read
app.put("/notifications/:id", async (c: { req: { header: (arg0: string) => string; param: (arg0: string) => string }; json: (arg0: { error?: string; success?: boolean; notification?: any }, arg1: number) => any }) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: "인증 토큰이 필요합니다" }, 401);
    }

    const { data: { user }, error } = await supabaseAdmin.auth.getUser(accessToken);
    
    if (error || !user) {
      return c.json({ error: "유효하지 않은 토큰입니다" }, 401);
    }

    const notificationId = c.req.param('id');
    const notification = await kv.get(`notification:${notificationId}`);
    
    if (!notification) {
      return c.json({ error: "알림을 찾을 수 없습니다" }, 404);
    }

    const updatedNotification = {
      ...notification,
      read: true,
    };

    await kv.set(`notification:${notificationId}`, updatedNotification);

    return c.json({ success: true, notification: updatedNotification }, 200);
  } catch (error: unknown) {
    console.log(`Error updating notification:`, error);
    const message = error instanceof Error ? error.message : String(error);
    return c.json({ error: `서버 오류: ${message}` }, 500);
  }
});

// Export the Hono app as a Deno.serve handler
Deno.serve(app.fetch);