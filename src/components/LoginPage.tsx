import { useState } from "react";
import { Mail, Lock, ArrowLeft } from "lucide-react";
import { Logo } from "./Logo";
import { toast } from "sonner";
import type { UserInfo } from "../App";
import { publicAnonKey } from "../utils/supabase/info";
import { requestJson } from "../utils/request";

interface LoginPageProps {
  onBack: () => void;
  onLoginComplete: (userData: UserInfo, accessToken: string) => void;
  onSwitchToSignup: () => void;
}

export function LoginPage({ onBack, onLoginComplete, onSwitchToSignup }: LoginPageProps) {
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      toast.error("이메일과 비밀번호를 입력해주세요");
      return;
    }

    if (isLoading) return;
    setIsLoading(true);

    try {
      const { response, data } = await requestJson<{ email: string; password: string }, any>({
        path: "/signin",
        method: "POST",
        body: { email: formData.email, password: formData.password },
        timeoutMs: 12000,
      });

      // Explicitly handle cases where 계정이 없음/비밀번호 불일치 등
      if (!response.ok) {
        // HTTP 404 or backend provided error means account not found or invalid
        const message =
          data?.error === 'USER_NOT_FOUND' || response.status === 404
            ? '해당 이메일의 계정을 찾을 수 없습니다'
            : data?.error === 'INVALID_CREDENTIALS' || response.status === 401
            ? '이메일 또는 비밀번호가 올바르지 않습니다'
            : data?.error?.includes?.('non-JSON response')
            ? '서버가 응답하지 않습니다. 나중에 다시 시도해주세요'
            : data?.error || '로그인에 실패했습니다';
        toast.error(message);
        return;
      }

      // Validate presence of user object and token
      if (!data?.user || !data?.user?.email) {
        toast.error('계정 정보를 찾을 수 없습니다');
        return;
      }
      if (!data?.accessToken) {
        toast.error('인증 토큰이 없습니다. 다시 시도해주세요');
        return;
      }

      toast.success(data.message || '로그인 성공!');

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

      onLoginComplete(userData, data.accessToken);
    } catch (error: any) {
      // If request was intentionally aborted (timeout or navigation), avoid noisy error
      if (error?.name === "AbortError") {
        toast.warning("요청이 시간 초과되었습니다. 네트워크 상태를 확인해주세요.");
      } else {
        console.error("Login error:", error);
        toast.error("서버 연결에 실패했습니다");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fffef5]">
      {/* Header */}
  <div className="bg-linear-to-br from-[#6b8e6f] to-[#8fa893] pt-8 pb-16">
        <div className="max-w-md mx-auto px-6">
          <button onClick={onBack} className="text-white mb-6 hover:opacity-80">
            <ArrowLeft size={24} />
          </button>
          
          <Logo className="mb-6" variant="white" />
          
          <h1 className="text-white mb-2">
            로그인
          </h1>
          <p className="text-white opacity-90">
            밥터뷰에 오신 것을 환영합니다
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-md mx-auto px-6 -mt-8">
        <div className="bg-white rounded-[1.5rem] p-6 border-2 border-[#d4c5a0] shadow-lg">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-[#2d3e2d] mb-2">
                이메일 <span className="text-[#f5a145]">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9ca89d]" size={20} />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="example@email.com"
                  className="w-full pl-12 pr-4 py-3 rounded-[1rem] border-2 border-[#d4c5a0] bg-white focus:border-[#f5a145] focus:outline-none"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-[#2d3e2d] mb-2">
                비밀번호 <span className="text-[#f5a145]">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9ca89d]" size={20} />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="비밀번호를 입력하세요"
                  className="w-full pl-12 pr-4 py-3 rounded-[1rem] border-2 border-[#d4c5a0] bg-white focus:border-[#f5a145] focus:outline-none"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-linear-to-r from-[#6b8e6f] to-[#8fa893] text-white py-4 rounded-[1.5rem] hover:opacity-90 transition-all disabled:opacity-60 text-center flex items-center justify-center gap-2"
            >
              {isLoading && (
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                </svg>
              )}
              {isLoading ? "로그인 중..." : "로그인"}
            </button>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#d4c5a0]"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-[#9ca89d]">또는</span>
              </div>
            </div>

            {/* Switch to Signup */}
            <button
              type="button"
              onClick={onSwitchToSignup}
              className="w-full border-2 border-[#6b8e6f] text-[#6b8e6f] py-4 rounded-[1.5rem] hover:bg-[#6b8e6f] hover:text-white transition-colors text-center"
            >
              회원가입
            </button>
          </form>
        </div>

        {/* Info */}
        <div className="mt-6 text-center">
          <p className="text-sm text-[#9ca89d]">
            처음이신가요? 회원가입하고 다양한 체험단에 참여하세요!
          </p>
        </div>
      </div>
    </div>
  );
}