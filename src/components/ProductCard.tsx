import { useState } from "react";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import { MapPin, Heart, ThumbsUp, Clock } from "lucide-react";
import type { Product } from "../data/mockData";
import { getProductStats } from "../utils/sortUtils";

interface ProductCardProps {
  product: Product;
  onClick: () => void;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
}

export function ProductCard({ product, onClick, isFavorite = false, onToggleFavorite }: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggleFavorite) {
      onToggleFavorite();
    }
  };

  const { daysUntilDeadline, fillingRate } = getProductStats(product);
  const isUrgent = daysUntilDeadline <= 3 && daysUntilDeadline > 0; // 3일 이하 남았을 때만 표시
  const isAlmostFull = fillingRate >= 80;

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="bg-white rounded-[1.5rem] overflow-hidden cursor-pointer border-2 border-[#d4c5a0] transition-all duration-300 hover:border-[#6b8e6f] hover:shadow-xl hover:-translate-y-1 active:scale-[0.98]"
    >
      <div className="aspect-4/3 relative overflow-hidden bg-[#f5f0dc]">
        {/* Skeleton shimmer while image loads */}
        {!imageLoaded && (
          <div className="absolute inset-0 bg-[#f5f0dc] animate-pulse">
            <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/40 to-transparent animate-shimmer" />
          </div>
        )}
        <ImageWithFallback
          src={product.image}
          alt={product.name}
          className={`w-full h-full object-cover transition-all duration-500 ${
            isHovered ? 'scale-110' : 'scale-100'
          } ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => setImageLoaded(true)}
        />

        {/* Top Left Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {product.badge && (
            <div className="bg-linear-to-r from-[#6b8e6f] to-[#8fa893] text-white px-3 py-1.5 rounded-full text-sm flex items-center gap-1.5 shadow-lg">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="animate-spin-slow">
                <path d="M8 2L10 6L14 7L11 10L12 14L8 12L4 14L5 10L2 7L6 6L8 2Z" fill="white"/>
              </svg>
              <span>{product.badge}</span>
            </div>
          )}
          {isUrgent && (
            <div className="bg-linear-to-r from-[#e63946] to-[#f25c54] text-white px-3 py-1.5 rounded-full text-sm flex items-center gap-1.5 shadow-lg animate-pulse">
              <Clock size={14} />
              <span>마감 {daysUntilDeadline}일 전</span>
            </div>
          )}
          {isAlmostFull && (
            <div className="bg-linear-to-r from-[#f77f00] to-[#fcbf49] text-white px-3 py-1.5 rounded-full text-sm flex items-center gap-1.5 shadow-lg">
              <span className="inline-block animate-wiggle">🔥</span>
              <span>{Math.round(fillingRate)}% 달성</span>
            </div>
          )}
        </div>
      </div>
      
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-[1.25rem] text-[#2d3e2d] transition-colors duration-200">
            {product.name}
          </h3>
          {onToggleFavorite && (
            <button 
              onClick={handleFavoriteClick}
              className="text-[#f5a145] hover:scale-125 transition-all duration-200 active:scale-90"
            >
              <Heart 
                size={24} 
                fill={isFavorite ? "#f5a145" : "none"} 
                stroke="#f5a145"
                className={isFavorite ? "animate-heartbeat" : ""}
              />
            </button>
          )}
        </div>
        
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[#6b8e6f] text-sm bg-[#f5f0dc] px-3 py-1 rounded-full inline-flex items-center gap-1.5">
            <span className="text-xs">📝</span>
            리뷰 {product.reviewCount}개
          </span>
        </div>
        
        <p className="text-[#2d3e2d] text-sm mb-3 line-clamp-2">
          {product.description}
        </p>
        
        {/* Progress bar */}
        <div className="mb-3">
          <div className="flex justify-between text-xs text-[#9ca89d] mb-1">
            <span>모집 현황</span>
            <span>{Math.round(fillingRate)}%</span>
          </div>
          <div className="h-2 bg-[#f5f0dc] rounded-full overflow-hidden">
            <div 
              className="h-full bg-linear-to-r from-[#f5a145] to-[#e89535] rounded-full transition-all duration-500 ease-out relative overflow-hidden"
              style={{ width: `${Math.min(fillingRate, 100)}%` }}
            >
              <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-between text-sm pt-3 border-t border-[#d4c5a0]">
          <div className="flex items-center gap-1.5 text-[#6b8e6f] hover:text-[#4a7c59] transition-colors">
            <MapPin size={16} />
            <span>{product.distance}</span>
          </div>
          <div className="flex items-center gap-3 text-[#9ca89d]">
            <div className="flex items-center gap-1 hover:text-[#6b8e6f] transition-colors group">
              <ThumbsUp 
                size={16} 
                fill="#6b8e6f" 
                stroke="#6b8e6f"
                className="group-hover:scale-110 transition-transform"
              />
              <span>{product.likeCount}</span>
            </div>
            <div className="text-[#f5a145] font-medium">
              {product.currentApplicants}/{product.requiredReviewers}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
