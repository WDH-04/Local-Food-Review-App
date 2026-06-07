import { Home, FileText, User } from "lucide-react";

interface BottomNavProps {
  activeTab: "home" | "review" | "profile";
  onTabChange: (tab: "home" | "review" | "profile") => void;
  userType?: "reviewer" | "business";
}

export function BottomNav({ activeTab, onTabChange, userType }: BottomNavProps) {
  const isBusiness = userType === "business";

  const NavButton = ({ tab, icon: Icon, label }: { tab: "home" | "review" | "profile"; icon: typeof Home; label: string }) => {
    const isActive = activeTab === tab;
    return (
      <button
        onClick={() => onTabChange(tab)}
        className={`relative flex flex-col items-center gap-1 px-4 py-2 rounded-2xl transition-all duration-200 active:scale-90 ${
          isActive 
            ? "text-[#6b8e6f] bg-[#6b8e6f]/10" 
            : "text-[#9ca89d] hover:text-[#6b8e6f]"
        }`}
      >
        {/* 상단 인디케이터 바 */}
        <div className={`absolute -top-1 left-1/2 -translate-x-1/2 h-[3px] rounded-full transition-all duration-300 ${
          isActive ? "w-6 bg-[#6b8e6f]" : "w-0 bg-transparent"
        }`} />
        <Icon size={22} fill={isActive ? "#6b8e6f" : "none"} strokeWidth={isActive ? 2.5 : 2} />
        <span className={`text-xs transition-all ${isActive ? "font-semibold" : "font-normal"}`}>{label}</span>
      </button>
    );
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#d4c5a0] rounded-t-[1.5rem] shadow-[0_-4px_20px_rgba(0,0,0,0.08)] z-50 pb-[env(safe-area-inset-bottom)]">
      <div className="max-w-md mx-auto px-4 py-3">
        <div className="flex items-center justify-around">
          <NavButton tab="home" icon={Home} label="홈" />
          {!isBusiness && (
            <NavButton tab="review" icon={FileText} label="리뷰" />
          )}
          <NavButton tab="profile" icon={User} label="MY" />
        </div>
      </div>
    </nav>
  );
}