import { Logo } from "./Logo";
import { ChevronRight, Download, TrendingUp, Award, Store, BarChart3, Settings, LogOut, Star, Info, ShoppingBag, History } from "lucide-react";

/**
 * Lightweight ImageWithFallback component to avoid dependency on ../figma/ImageWithFallback.
 * Uses a simple onError handler to swap to a local placeholder when image loading fails.
 */
function ImageWithFallback({ src, alt, className }: { src?: string; alt?: string; className?: string }) {
  return (
    <img
      src={src || "/images/placeholder.png"}
      alt={alt || ""}
      className={className}
      onError={(e) => {
        // swap to placeholder if original src fails
        (e.currentTarget as HTMLImageElement).src = "/images/placeholder.png";
      }}
    />
  );
}
import type { UserInfo, Review } from "../App";
import type { Product } from "../data/mockData";
import { getLevelInfo, getLevelProgress, getPointsToNextLevel, LEVELS } from "../data/levelSystem";
import { LevelBadge } from "./LevelBadge";
import { LevelSystemModal } from "./LevelSystemModal";
import { useState } from "react";

interface ProfilePageProps {
  userInfo: UserInfo;
  completedReviews?: Review[];
  userPoints?: number;
  userLevel?: number;
  onNavigateToApplications: () => void;
  onNavigateToFavorites: () => void;
  onNavigateToPointShop?: () => void;
  onNavigateToPointHistory?: () => void;
  onEditReview?: (product: Product) => void;
  onNavigateToDashboard?: () => void;
  onNavigateToTerms?: () => void;
  onNavigateToPrivacy?: () => void;
  onLogout: () => void;
}

export function ProfilePage({ 
  userInfo, 
  completedReviews = [], 
  userPoints = 0, 
  userLevel = 1, 
  onNavigateToApplications, 
  onNavigateToFavorites, 
  onNavigateToPointShop, 
  onNavigateToPointHistory, 
  onEditReview, 
  onNavigateToDashboard,
  onNavigateToTerms,
  onNavigateToPrivacy,
  onLogout 
}: ProfilePageProps) {
  const isBusinessUser = userInfo.userType === "business";
  const [isLevelSystemModalOpen, setIsLevelSystemModalOpen] = useState(false);

  if (isBusinessUser) {
    return (
      <div className="min-h-screen bg-[#fffef5] pb-24">
        {/* Header */}
  <div className="bg-[#6b8e6f] bg-linear-to-br from-[#6b8e6f] to-[#8fa893] pt-8 pb-12">
          <div className="max-w-md mx-auto px-6">
            <Logo className="mb-6" variant="white" />
            <h1 className="text-white mb-2">
              사업자 프로필
            </h1>
            <p className="text-white opacity-90">
              내 체험단과 통계를 확인하세요
            </p>
          </div>
        </div>

        <div className="max-w-md mx-auto px-6 -mt-6">
          {/* Business Profile Card */}
          <div className="bg-white rounded-[1.5rem] p-6 mb-6 border-2 border-[#d4c5a0] shadow-lg">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-full bg-linear-to-br from-[#6b8e6f] to-[#8fa893] flex items-center justify-center">
                <Store size={32} className="text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-[#2d3e2d] mb-1">{userInfo.businessName || userInfo.name}</h3>
                <div className="inline-flex items-center gap-1.5 bg-[#6b8e6f] text-white px-3 py-1 rounded-full text-sm">
                  <Award size={14} />
                  <span>인증 사업자</span>
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-4 border-t border-[#d4c5a0]">
              <div className="flex justify-between text-sm">
                <span className="text-[#9ca89d]">사업자 번호</span>
                <span className="text-[#2d3e2d]">{userInfo.businessNumber || "-"}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#9ca89d]">주소</span>
                <span className="text-[#2d3e2d]">{userInfo.businessAddress || "-"}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#9ca89d]">담당자</span>
                <span className="text-[#2d3e2d]">{userInfo.name}</span>
              </div>
            </div>
          </div>

          {/* Business Stats */}
          <div className="bg-white rounded-[1.5rem] p-6 mb-6 border-2 border-[#d4c5a0]">
            <h3 className="text-[#2d3e2d] mb-4">이번 달 통계</h3>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-[#f5a145] mb-1">2</div>
                <div className="text-sm text-[#9ca89d]">진행중</div>
              </div>
              <div className="text-center">
                <div className="text-[#6b8e6f] mb-1">89</div>
                <div className="text-sm text-[#9ca89d]">총 신청</div>
              </div>
              <div className="text-center">
                <div className="text-[#2d3e2d] mb-1">40</div>
                <div className="text-sm text-[#9ca89d]">받은 리뷰</div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-[1.5rem] p-6 mb-6 border-2 border-[#d4c5a0]">
            <h3 className="text-[#2d3e2d] mb-4">빠른 메뉴</h3>
            
            <button 
              onClick={onNavigateToDashboard}
              className="w-full flex items-center justify-between p-4 bg-[#f5f0dc] rounded-[1rem] mb-3 hover:bg-[#ebe5cc] transition-colors"
            >
              <div className="flex items-center gap-3">
                <BarChart3 size={20} className="text-[#6b8e6f]" />
                <span className="text-[#2d3e2d]">통계 보기</span>
              </div>
              <ChevronRight size={20} className="text-[#6b8e6f]" />
            </button>

            <button 
              onClick={() => alert('가게 정보 수정 기능은 준비중입니다')}
              className="w-full flex items-center justify-between p-4 bg-[#f5f0dc] rounded-[1rem] mb-3 hover:bg-[#ebe5cc] transition-colors"
            >
              <div className="flex items-center gap-3">
                <Store size={20} className="text-[#6b8e6f]" />
                <span className="text-[#2d3e2d]">가게 정보 수정</span>
              </div>
              <ChevronRight size={20} className="text-[#6b8e6f]" />
            </button>

            <button 
              onClick={() => alert('설정 기능은 준비중입니다')}
              className="w-full flex items-center justify-between p-4 bg-[#f5f0dc] rounded-[1rem] hover:bg-[#ebe5cc] transition-colors"
            >
              <div className="flex items-center gap-3">
                <Settings size={20} className="text-[#6b8e6f]" />
                <span className="text-[#2d3e2d]">설정</span>
              </div>
              <ChevronRight size={20} className="text-[#6b8e6f]" />
            </button>

            <div className="border-t border-[#d4c5a0] my-3"></div>

            <button className="w-full flex items-center justify-between p-4 bg-[#f5f0dc] rounded-[1rem] hover:bg-[#ebe5cc] transition-colors" onClick={onLogout}>
              <div className="flex items-center gap-3">
                <LogOut size={20} className="text-[#6b8e6f]" />
                <span className="text-[#2d3e2d]">로그아웃</span>
              </div>
              <ChevronRight size={20} className="text-[#6b8e6f]" />
            </button>
          </div>

          {/* Performance */}
          <div className="bg-linear-to-r from-[#6b8e6f] to-[#8fa893] rounded-[1.5rem] p-6 mb-6 text-white">
            <div className="flex items-start gap-4 mb-4">
              <div className="bg-white/20 rounded-full p-3">
                <TrendingUp size={24} />
              </div>
              <div className="flex-1">
                <h4 className="mb-2">고객 만족도</h4>
                <p className="text-sm opacity-90">평균 만족도가 높습니다!</p>
              </div>
            </div>
            <div className="bg-white/20 rounded-[1rem] p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm">종합 점수</span>
                <span>88/100</span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-2 overflow-hidden">
                <div className="bg-white h-full rounded-full" style={{ width: '88%' }}></div>
              </div>
            </div>
          </div>

          {/* Recent Reviews */}
          <div className="mb-6">
            <h3 className="text-[#2d3e2d] mb-4">최근 받은 리뷰</h3>
            <div className="space-y-4">
              <div className="bg-white rounded-[1.5rem] p-4 border-2 border-[#d4c5a0]">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-linear-to-br from-[#f5a145] to-[#e89535] flex items-center justify-center text-white">
                    김
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm text-[#2d3e2d]">김맛평</span>
                      <span className="text-xs text-[#9ca89d]">2025.11.08</span>
                    </div>
                    <p className="text-sm text-[#6b8e6f]">음식이 정말 맛있었어요. 재방문 의사 있습니다!</p>
                  </div>
                </div>
                <button className="w-full text-sm text-[#6b8e6f] text-left hover:text-[#5a7a5e]">
                  자세히 보기 →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Reviewer Profile
  const currentLevel = getLevelInfo(userPoints);
  const progress = getLevelProgress(userPoints);
  const pointsToNext = getPointsToNextLevel(userPoints);
  const nextLevel = LEVELS[currentLevel.level];
  const [showLevelModal, setShowLevelModal] = useState(false);

  return (
    <div className="min-h-screen bg-[#fffef5] pb-24">
      {/* Header */}
  <div className="bg-[#6b8e6f] bg-linear-to-br from-[#6b8e6f] to-[#8fa893] pt-8 pb-12">
        <div className="max-w-md mx-auto px-6">
          <Logo className="mb-6" variant="white" />
          <h1 className="text-white mb-2">
            마이페이지
          </h1>
          <p className="text-white opacity-90">
            내 활동과 포인트를 확인하세요
          </p>
        </div>
      </div>

      <div className="max-w-md mx-auto px-6 -mt-6">
        {/* User Profile Card */}
        <div className="bg-white rounded-[1.5rem] p-6 mb-6 border-2 border-[#d4c5a0] shadow-lg">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-full bg-linear-to-br from-[#f5a145] to-[#e89535] flex items-center justify-center">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <circle cx="16" cy="12" r="6" fill="white" />
                <path d="M8 26c0-4.4 3.6-8 8-8s8 3.6 8 8" fill="white" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-[#2d3e2d] mb-1">{userInfo.name}</h3>
              <LevelBadge level={userLevel} showName={true} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-[#d4c5a0]">
            <div className="text-center">
              <div className="text-[#2d3e2d] mb-1">{completedReviews.length}</div>
              <div className="text-sm text-[#9ca89d]">리뷰</div>
            </div>
            <div className="text-center">
              <div className="text-[#2d3e2d] mb-1">0</div>
              <div className="text-sm text-[#9ca89d]">받은 좋아요</div>
            </div>
            <div className="text-center">
              <div className="text-[#f5a145] mb-1">{userPoints.toLocaleString()}P</div>
              <div className="text-sm text-[#9ca89d]">포인트</div>
            </div>
          </div>
        </div>

        {/* Level Progress Dashboard */}
        <div 
          className="rounded-[1.5rem] p-6 mb-6 border-2 shadow-lg"
          style={{
            backgroundColor: currentLevel.bgColor,
            borderColor: currentLevel.color
          }}
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-3xl">{currentLevel.icon}</span>
                <div>
                  <h3 style={{ color: currentLevel.color }}>{currentLevel.name}</h3>
                  <p className="text-sm text-[#6b8e6f]">{currentLevel.description}</p>
                </div>
              </div>
            </div>
            <button className="text-sm text-[#6b8e6f] hover:text-[#5a7a5e]" onClick={() => setShowLevelModal(true)}>
              <Info size={16} />
            </button>
          </div>

          {/* Progress Bar */}
          {currentLevel.level < LEVELS.length && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2 text-sm">
                <span className="text-[#6b8e6f]">다음 등급까지</span>
                <span style={{ color: currentLevel.color }}>
                  {pointsToNext}P 남음
                </span>
              </div>
              <div className="w-full bg-white rounded-full h-3 overflow-hidden border-2" style={{ borderColor: currentLevel.color }}>
                <div 
                  className="h-full rounded-full transition-all duration-500" 
                  style={{ 
                    width: `${progress}%`,
                    backgroundColor: currentLevel.color
                  }}
                />
              </div>
              {nextLevel && (
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-[#9ca89d]">
                    현재: {userPoints}P
                  </span>
                  <span className="text-xs" style={{ color: nextLevel.color }}>
                    {nextLevel.icon} {nextLevel.name}: {nextLevel.minPoints}P
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Benefits */}
          <div className="bg-white/80 rounded-[1rem] p-4">
            <h4 className="text-sm mb-2" style={{ color: currentLevel.color }}>
              <Star size={14} className="inline mr-1" />
              현재 등급 혜택
            </h4>
            <ul className="space-y-1">
              {currentLevel.benefits.map((benefit, index) => (
                <li key={index} className="text-sm text-[#6b8e6f] flex items-start gap-2">
                  <span className="text-[#6b8e6f] mt-0.5">•</span>
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Point Actions */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <button 
            onClick={onNavigateToPointShop}
            className="bg-linear-to-r from-[#f5a145] to-[#e89535] rounded-[1.5rem] p-5 text-white hover:opacity-90 transition-opacity"
          >
            <div className="flex flex-col items-center text-center">
              <div className="bg-white/20 rounded-full p-3 mb-3">
                <ShoppingBag size={24} />
              </div>
              <h4 className="mb-1">포인트 샵</h4>
              <p className="text-sm opacity-90">혜택 구매하기</p>
            </div>
          </button>

          <button 
            onClick={onNavigateToPointHistory}
            className="bg-linear-to-r from-[#6b8e6f] to-[#8fa893] rounded-[1.5rem] p-5 text-white hover:opacity-90 transition-opacity"
          >
            <div className="flex flex-col items-center text-center">
              <div className="bg-white/20 rounded-full p-3 mb-3">
                <History size={24} />
              </div>
              <h4 className="mb-1">포인트 내역</h4>
              <p className="text-sm opacity-90">적립/사용 내역</p>
            </div>
          </button>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-[1.5rem] p-6 mb-6 border-2 border-[#d4c5a0]">
          <h3 className="text-[#2d3e2d] mb-4">내 활동</h3>
          
          <button className="w-full flex items-center justify-between p-4 bg-[#f5f0dc] rounded-[1rem] mb-3 hover:bg-[#ebe5cc] transition-colors" onClick={onNavigateToApplications}>
            <span className="text-[#2d3e2d]">신청한 체험단</span>
            <ChevronRight size={20} className="text-[#6b8e6f]" />
          </button>

          <button className="w-full flex items-center justify-between p-4 bg-[#f5f0dc] rounded-[1rem] mb-3 hover:bg-[#ebe5cc] transition-colors" onClick={onNavigateToFavorites}>
            <span className="text-[#2d3e2d]">찜한 체험단</span>
            <ChevronRight size={20} className="text-[#6b8e6f]" />
          </button>

          <div className="border-t border-[#d4c5a0] my-3"></div>

          <button className="w-full flex items-center justify-between p-4 bg-[#f5f0dc] rounded-[1rem] mb-3 hover:bg-[#ebe5cc] transition-colors" onClick={onNavigateToTerms}>
            <span className="text-[#2d3e2d]">이용약관</span>
            <ChevronRight size={20} className="text-[#6b8e6f]" />
          </button>
          <button className="w-full flex items-center justify-between p-4 bg-[#f5f0dc] rounded-[1rem] mb-3 hover:bg-[#ebe5cc] transition-colors" onClick={onNavigateToPrivacy}>
            <span className="text-[#2d3e2d]">개인정보 처리방침</span>
            <ChevronRight size={20} className="text-[#6b8e6f]" />
          </button>

          <button className="w-full flex items-center justify-between p-4 bg-[#f5f0dc] rounded-[1rem] hover:bg-[#ebe5cc] transition-colors" onClick={onLogout}>
            <div className="flex items-center gap-3">
              <LogOut size={20} className="text-[#6b8e6f]" />
              <span className="text-[#2d3e2d]">로그아웃</span>
            </div>
            <ChevronRight size={20} className="text-[#6b8e6f]" />
          </button>
        </div>

        {/* Benefits Section */}
  <div className="bg-linear-to-r from-[#6b8e6f] to-[#8fa893] rounded-[1.5rem] p-6 mb-6 text-white">
          <div className="flex items-start gap-4 mb-4">
            <div className="bg-white/20 rounded-full p-3">
              <Download size={24} />
            </div>
            <div className="flex-1">
              <h4 className="mb-2">포인트 사용하기</h4>
              <p className="text-sm opacity-90">적립한 포인트로 할인 받으세요</p>
            </div>
          </div>
        </div>

        {/* Excellence Recommendation */}
        <div className="bg-white rounded-[1.5rem] p-6 mb-6 border-2 border-[#d4c5a0]">
          <div className="flex items-start gap-4">
            <div className="bg-[#6b8e6f] rounded-full p-3">
              <TrendingUp size={24} className="text-white" />
            </div>
            <div className="flex-1">
              <h4 className="text-[#2d3e2d] mb-2">우수 평가단 등급</h4>
              <p className="text-sm text-[#6b8e6f] mb-4">
                솔직한 리뷰로 더 많은 체험 기회를 받아보세요
              </p>
            </div>
          </div>
          
          <div className="bg-[#f5f0dc] rounded-[1rem] p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-[#6b8e6f]">신뢰도 점수</span>
              <span className="text-[#2d3e2d]">92/100</span>
            </div>
            <div className="w-full bg-white rounded-full h-2 overflow-hidden">
              <div className="bg-[#6b8e6f] h-full rounded-full" style={{ width: '92%' }}></div>
            </div>
          </div>
        </div>

        {/* My Reviews */}
        <div className="mb-6">
          <h3 className="text-[#2d3e2d] mb-4">내가 작성한 리뷰</h3>
          <div className="space-y-4">
            {completedReviews.length === 0 ? (
              <div className="text-center py-8 bg-white rounded-[1.5rem] border-2 border-[#d4c5a0]">
                <p className="text-sm text-[#9ca89d]">작성한 리뷰가 없습니다</p>
              </div>
            ) : (
              completedReviews.map((review) => {
                // Format date
                const date = new Date(review.createdAt);
                const formattedDate = `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
                
                // Find the matching product
                const reviewProduct: Product = {
                  id: review.productId,
                  name: review.productName,
                  image: review.productImage,
                  seller: "동네식당",
                  category: "korean",
                  location: "서울시 마포구",
                  reviewCount: 32,
                  description: review.pros || review.cons || review.improvements,
                  applicationDeadline: "12.20(금) - 12.25(수)",
                  requiredReviewers: 50,
                  currentApplicants: 38,
                  likeCount: 124,
                  distance: "0.5km",
                  calculatedDistance: undefined
                };
                
                return (
                  <div key={review.id} className="bg-white rounded-[1.5rem] p-4 border-2 border-[#d4c5a0]">
                    <div className="flex gap-4">
                      <div className="w-20 h-20 rounded-[1rem] overflow-hidden bg-[#f5f0dc] shrink-0">
                        <ImageWithFallback
                          src={review.productImage}
                          alt={review.productName}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-[#2d3e2d] mb-2 truncate">{review.productName}</h4>
                        <p className="text-sm text-[#6b8e6f] line-clamp-2">
                          {review.pros && `장점: ${review.pros}`}
                          {review.cons && ` / 단점: ${review.cons}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#d4c5a0]">
                      <span className="text-xs text-[#9ca89d]">{formattedDate}</span>
                      <button 
                        className="text-sm text-[#6b8e6f] hover:text-[#5a7a5e]" 
                        onClick={() => onEditReview && onEditReview(reviewProduct)}
                      >
                        수정
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Level System Modal */}
      <LevelSystemModal
        isOpen={showLevelModal}
        onClose={() => setShowLevelModal(false)}
        currentLevel={userLevel}
      />
    </div>
  );
}