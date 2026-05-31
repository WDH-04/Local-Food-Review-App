import { useState } from "react";
import { ArrowLeft, User, Store, Mail, Lock, Phone, Building } from "lucide-react";
import { Logo } from "./Logo";
import { toast } from "sonner";
import type { UserInfo } from "../App";
import { publicAnonKey } from "../utils/supabase/info";
import { requestJson } from "../utils/request";

interface SignupPageProps {
  onBack: () => void;
  onSignupComplete: (userData: UserInfo, accessToken?: string) => void;
  onSwitchToLogin: () => void;
}

type UserType = "reviewer" | "business" | null;

export function SignupPage({ onBack, onSignupComplete, onSwitchToLogin }: SignupPageProps) {
  const [userType, setUserType] = useState<UserType>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    passwordConfirm: "",
    phone: "",
    businessName: "",
    businessNumber: "",
    businessAddress: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.password || !formData.phone) {
      toast.error("필수 정보를 모두 입력해주세요");
      return;
    }
    
    if (formData.password !== formData.passwordConfirm) {
      toast.error("비밀번호가 일치하지 않습니다");
      return;
    }

    if (userType === "business" && (!formData.businessName || !formData.businessNumber)) {
      toast.error("사업자 정보를 모두 입력해주세요");
      return;
    }

    if (isLoading) return;
    setIsLoading(true);

    try {
      // Signup with timeout
      const { response, data } = await requestJson<any, any>({
        path: "/signup",
        method: "POST",
        body: {
          email: formData.email,
          password: formData.password,
          name: formData.name,
          phone: formData.phone,
          userType: userType,
          businessName: formData.businessName || null,
          businessNumber: formData.businessNumber || null,
          businessAddress: formData.businessAddress || null,
        },
        timeoutMs: 15000,
      });

      if (!response.ok) {
        toast.error(data.error || "회원가입에 실패했습니다");
        return;
      }

      toast.success(data.message || "회원가입이 완료되었습니다!");
      
      // Auto login after signup
      try {
        // Auto login with timeout
        const { response: loginResponse, data: loginData } = await requestJson<{ email: string; password: string }, any>({
          path: "/signin",
          method: "POST",
          body: { email: formData.email, password: formData.password },
          timeoutMs: 12000,
        });

        if (loginResponse.ok && loginData.accessToken) {
          // Convert backend user data to UserInfo format
          const userData: UserInfo = {
            name: data.user.name,
            email: data.user.email,
            phone: data.user.phone,
            userType: data.user.userType,
            businessName: data.user.businessName || undefined,
            businessNumber: data.user.businessNumber || undefined,
            businessAddress: data.user.businessAddress || undefined,
          };

          onSignupComplete(userData, loginData.accessToken);
        } else {
          // Fallback without token
          const userData: UserInfo = {
            name: data.user.name,
            email: data.user.email,
            phone: data.user.phone,
            userType: data.user.userType,
            businessName: data.user.businessName || undefined,
            businessNumber: data.user.businessNumber || undefined,
            businessAddress: data.user.businessAddress || undefined,
          };
          onSignupComplete(userData);
        }
      } catch (loginError) {
        console.error("Auto login failed:", loginError);
        // Fallback without token
        const userData: UserInfo = {
          name: data.user.name,
          email: data.user.email,
          phone: data.user.phone,
          userType: data.user.userType,
          businessName: data.user.businessName || undefined,
          businessNumber: data.user.businessNumber || undefined,
          businessAddress: data.user.businessAddress || undefined,
        };
        onSignupComplete(userData);
      }
    } catch (error) {
      console.error("Signup error:", error);
      toast.error("서버 연결에 실패했습니다");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (userType === null) {
    return (
      <div className="min-h-screen bg-[#fffef5]">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b-2 border-[#d4c5a0] z-10">
          <div className="max-w-md mx-auto px-6 py-4 flex items-center justify-between">
            <button onClick={onBack} className="text-[#2d3e2d] hover:text-[#6b8e6f] transition-colors">
              <ArrowLeft size={24} />
            </button>
            <h4 className="text-[#2d3e2d]">회원가입</h4>
            <div className="w-6"></div>
          </div>
        </div>

        <div className="max-w-md mx-auto px-6 py-8">
          <div className="text-center mb-8">
            <Logo className="justify-center mb-6" />
            <h2 className="text-[#2d3e2d] mb-3">환영합니다!</h2>
            <p className="text-[#6b8e6f]">
              어떤 유형으로 가입하시겠어요?
            </p>
          </div>

          <div className="space-y-4">
            {/* Reviewer Type */}
            <button
              onClick={() => setUserType("reviewer")}
              className="w-full bg-white rounded-[1.5rem] p-6 border-2 border-[#d4c5a0] hover:border-[#f5a145] transition-all group"
            >
              <div className="flex items-start gap-4">
                <div className="bg-[#f5a145] rounded-full p-4 group-hover:scale-110 transition-transform">
                  <User size={32} className="text-white" />
                </div>
                <div className="flex-1 text-left">
                  <h3 className="text-[#2d3e2d] mb-2">체험단 회원</h3>
                  <p className="text-sm text-[#6b8e6f] mb-3">
                    다양한 맛집을 저렴하게 체험하고<br />
                    솔직한 리뷰를 작성해보세요
                  </p>
                  <ul className="text-xs text-[#9ca89d] space-y-1">
                    <li>• 저렴한 가격에 맛집 체험</li>
                    <li>• 리뷰 작성으로 포인트 적립</li>
                    <li>• 우수 평가단 혜택</li>
                  </ul>
                </div>
              </div>
            </button>

            {/* Business Type */}
            <button
              onClick={() => setUserType("business")}
              className="w-full bg-white rounded-[1.5rem] p-6 border-2 border-[#d4c5a0] hover:border-[#6b8e6f] transition-all group"
            >
              <div className="flex items-start gap-4">
                <div className="bg-[#6b8e6f] rounded-full p-4 group-hover:scale-110 transition-transform">
                  <Store size={32} className="text-white" />
                </div>
                <div className="flex-1 text-left">
                  <h3 className="text-[#2d3e2d] mb-2">사업자 회원</h3>
                  <p className="text-sm text-[#6b8e6f] mb-3">
                    체험단을 모집하고<br />
                    솔직한 피드백을 받아보세요
                  </p>
                  <ul className="text-xs text-[#9ca89d] space-y-1">
                    <li>• 체험단 모집 및 관리</li>
                    <li>• 상세한 피드백 리포트</li>
                    <li>• 저렴한 홍보 비용</li>
                  </ul>
                </div>
              </div>
            </button>
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm text-[#9ca89d]">
              이미 계정이 있으신가요?{" "}
              <button className="text-[#6b8e6f] hover:text-[#5a7a5e]" onClick={onSwitchToLogin}>
                로그인
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fffef5]">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b-2 border-[#d4c5a0] z-10">
        <div className="max-w-md mx-auto px-6 py-4 flex items-center justify-between">
          <button onClick={() => setUserType(null)} className="text-[#2d3e2d] hover:text-[#6b8e6f] transition-colors">
            <ArrowLeft size={24} />
          </button>
          <h4 className="text-[#2d3e2d]">
            {userType === "reviewer" ? "체험단 회원가입" : "사업자 회원가입"}
          </h4>
          <div className="w-6"></div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-6 py-8 pb-32">
        <div className="text-center mb-8">
          <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${
            userType === "reviewer" ? "bg-[#f5a145]" : "bg-[#6b8e6f]"
          }`}>
            {userType === "reviewer" ? (
              <User size={32} className="text-white" />
            ) : (
              <Store size={32} className="text-white" />
            )}
          </div>
          <h2 className="text-[#2d3e2d] mb-2">
            {userType === "reviewer" ? "체험단으로 시작하기" : "사업자로 시작하기"}
          </h2>
          <p className="text-sm text-[#6b8e6f]">
            {userType === "reviewer" 
              ? "맛집을 체험하고 리뷰를 작성해보세요" 
              : "체험단을 모집하고 피드백을 받아보세요"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div className="bg-white rounded-[1.5rem] p-6 border-2 border-[#d4c5a0]">
            <label className="text-sm text-[#6b8e6f] mb-2 block">이름 *</label>
            <div className="flex items-center gap-3">
              <User size={20} className="text-[#9ca89d]" />
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="이름을 입력하세요"
                className="flex-1 bg-transparent outline-none text-[#2d3e2d] placeholder:text-[#9ca89d]"
              />
            </div>
          </div>

          {/* Email */}
          <div className="bg-white rounded-[1.5rem] p-6 border-2 border-[#d4c5a0]">
            <label className="text-sm text-[#6b8e6f] mb-2 block">이메일 *</label>
            <div className="flex items-center gap-3">
              <Mail size={20} className="text-[#9ca89d]" />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                placeholder="example@email.com"
                className="flex-1 bg-transparent outline-none text-[#2d3e2d] placeholder:text-[#9ca89d]"
              />
            </div>
          </div>

          {/* Phone */}
          <div className="bg-white rounded-[1.5rem] p-6 border-2 border-[#d4c5a0]">
            <label className="text-sm text-[#6b8e6f] mb-2 block">전화번호 *</label>
            <div className="flex items-center gap-3">
              <Phone size={20} className="text-[#9ca89d]" />
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                placeholder="010-0000-0000"
                className="flex-1 bg-transparent outline-none text-[#2d3e2d] placeholder:text-[#9ca89d]"
              />
            </div>
          </div>

          {/* Password */}
          <div className="bg-white rounded-[1.5rem] p-6 border-2 border-[#d4c5a0]">
            <label className="text-sm text-[#6b8e6f] mb-2 block">비밀번호 *</label>
            <div className="flex items-center gap-3">
              <Lock size={20} className="text-[#9ca89d]" />
              <input
                type="password"
                value={formData.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
                placeholder="비밀번호를 입력하세요"
                className="flex-1 bg-transparent outline-none text-[#2d3e2d] placeholder:text-[#9ca89d]"
              />
            </div>
          </div>

          {/* Password Confirm */}
          <div className="bg-white rounded-[1.5rem] p-6 border-2 border-[#d4c5a0]">
            <label className="text-sm text-[#6b8e6f] mb-2 block">비밀번호 확인 *</label>
            <div className="flex items-center gap-3">
              <Lock size={20} className="text-[#9ca89d]" />
              <input
                type="password"
                value={formData.passwordConfirm}
                onChange={(e) => handleInputChange("passwordConfirm", e.target.value)}
                placeholder="비밀번호를 다시 입력하세요"
                className="flex-1 bg-transparent outline-none text-[#2d3e2d] placeholder:text-[#9ca89d]"
              />
            </div>
          </div>

          {/* Business Fields */}
          {userType === "business" && (
            <>
              <div className="bg-white rounded-[1.5rem] p-6 border-2 border-[#6b8e6f]">
                <label className="text-sm text-[#6b8e6f] mb-2 block">상호명 *</label>
                <div className="flex items-center gap-3">
                  <Store size={20} className="text-[#9ca89d]" />
                  <input
                    type="text"
                    value={formData.businessName}
                    onChange={(e) => handleInputChange("businessName", e.target.value)}
                    placeholder="상호명을 입력하세요"
                    className="flex-1 bg-transparent outline-none text-[#2d3e2d] placeholder:text-[#9ca89d]"
                  />
                </div>
              </div>

              <div className="bg-white rounded-[1.5rem] p-6 border-2 border-[#6b8e6f]">
                <label className="text-sm text-[#6b8e6f] mb-2 block">사업자 등록번호 *</label>
                <div className="flex items-center gap-3">
                  <Building size={20} className="text-[#9ca89d]" />
                  <input
                    type="text"
                    value={formData.businessNumber}
                    onChange={(e) => handleInputChange("businessNumber", e.target.value)}
                    placeholder="000-00-00000"
                    className="flex-1 bg-transparent outline-none text-[#2d3e2d] placeholder:text-[#9ca89d]"
                  />
                </div>
              </div>

              <div className="bg-white rounded-[1.5rem] p-6 border-2 border-[#6b8e6f]">
                <label className="text-sm text-[#6b8e6f] mb-2 block">사업장 주소</label>
                <div className="flex items-center gap-3">
                  <Building size={20} className="text-[#9ca89d]" />
                  <input
                    type="text"
                    value={formData.businessAddress}
                    onChange={(e) => handleInputChange("businessAddress", e.target.value)}
                    placeholder="사업장 주소를 입력하세요"
                    className="flex-1 bg-transparent outline-none text-[#2d3e2d] placeholder:text-[#9ca89d]"
                  />
                </div>
              </div>
            </>
          )}

          {/* Terms */}
          <div className="bg-[#f5f0dc] rounded-[1rem] p-4">
            <p className="text-xs text-[#6b8e6f] mb-3">
              회원가입 시 다음 사항에 동의하게 됩니다:
            </p>
            <ul className="text-xs text-[#9ca89d] space-y-1">
              <li>• 이용약관 동의</li>
              <li>• 개인정보 처리방침 동의</li>
              {userType === "reviewer" && <li>• 리뷰 작성 의무 준수</li>}
              {userType === "business" && <li>• 사업자 정보 제공 동의</li>}
            </ul>
          </div>
        </form>
      </div>

      {/* Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-[#6b8e6f] z-20">
        <div className="max-w-md mx-auto px-6 py-4">
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className={`w-full text-white py-4 rounded-[1rem] transition-all text-center flex items-center justify-center gap-2 disabled:opacity-60 ${
              userType === "reviewer" 
                ? "bg-[#f5a145] hover:bg-[#e89535]" 
                : "bg-[#6b8e6f] hover:bg-[#5a7a5e]"
            }`}
            disabled={isLoading}
          >
            {isLoading && (
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
              </svg>
            )}
            {isLoading ? "회원가입 중..." : "회원가입 완료"}
          </button>
        </div>
      </div>
    </div>
  );
}