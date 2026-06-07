import { useState } from "react";
import { ArrowLeft, Upload, X, ThumbsUp, ThumbsDown, Lightbulb } from "lucide-react";
import { toast } from "sonner@2.0.3";
import { ImageWithFallback } from "../figma/ImageWithFallback";

/**
 * Lightweight summary of a review used only for the edit-page header.
 * Intentionally narrower than the canonical `Review` type in App.tsx —
 * EditReviewPage only needs to display product info and a date, so we
 * keep this local to avoid pulling in the full review shape.
 */
interface EditReviewSummary {
  id: string;
  productName: string;
  productImage: string;
  comment: string;
  date: string;
}

interface EditReviewPageProps {
  review: EditReviewSummary;
  onBack: () => void;
}

export function EditReviewPage({ review, onBack }: EditReviewPageProps) {
  const [pros, setPros] = useState("재료가 신선하고 맛이 좋았어요");
  const [cons, setCons] = useState("양이 조금 적었어요");
  const [suggestions, setSuggestions] = useState("포장을 더 튼튼하게 해주시면 좋겠어요");
  const [uploadedImages, setUploadedImages] = useState<string[]>([
    "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400"
  ]);

  const handleImageUpload = () => {
    const mockImages = [
      "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400",
      "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400",
    ];
    
    if (uploadedImages.length >= 5) {
      toast.error("최대 5장까지 업로드 가능합니다");
      return;
    }

    const randomImage = mockImages[Math.floor(Math.random() * mockImages.length)];
    setUploadedImages(prev => [...prev, randomImage]);
    toast.success("이미지가 추가되었습니다");
  };

  const handleRemoveImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
    toast.success("이미지가 삭제되었습니다");
  };

  const handleSubmit = () => {
    if (!pros.trim() && !cons.trim() && !suggestions.trim()) {
      toast.error("최소 한 가지 항목은 작성해주세요");
      return;
    }

    toast.success("리뷰가 수정되었습니다!");
    setTimeout(() => {
      onBack();
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#fffef5] pb-24">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b-2 border-[#d4c5a0] z-10">
        <div className="max-w-md mx-auto px-6 py-4 flex items-center justify-between">
          <button onClick={onBack} className="text-[#2d3e2d] hover:text-[#6b8e6f] transition-colors">
            <ArrowLeft size={24} />
          </button>
          <h4 className="text-[#2d3e2d]">리뷰 수정</h4>
          <div className="w-6"></div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-6 py-6">
        {/* Product Info */}
        <div className="bg-white rounded-[1.5rem] p-5 mb-6 border-2 border-[#d4c5a0]">
          <div className="flex gap-4">
            <div className="w-20 h-20 rounded-[1rem] overflow-hidden bg-[#f5f0dc] shrink-0">
              <ImageWithFallback
                src={review.productImage}
                alt={review.productName}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1">
              <h3 className="text-[#2d3e2d] mb-1">{review.productName}</h3>
              <p className="text-sm text-[#9ca89d] mb-2">{review.date} 작성</p>
              <span className="text-xs px-3 py-1 rounded-full bg-[#6b8e6f] text-white">
                수정 중
              </span>
            </div>
          </div>
        </div>

        {/* Image Upload */}
        <div className="bg-white rounded-[1.5rem] p-6 mb-4 border-2 border-[#d4c5a0]">
          <h4 className="text-[#2d3e2d] mb-4 flex items-center gap-2">
            <Upload size={20} className="text-[#6b8e6f]" />
            음식 사진
          </h4>

          {uploadedImages.length > 0 && (
            <div className="grid grid-cols-3 gap-3 mb-4">
              {uploadedImages.map((image, index) => (
                <div key={index} className="relative aspect-square">
                  <ImageWithFallback
                    src={image}
                    alt={`Uploaded ${index + 1}`}
                    className="w-full h-full object-cover rounded-[1rem]"
                  />
                  <button
                    onClick={() => handleRemoveImage(index)}
                    className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow-lg hover:bg-[#f5f0dc]"
                  >
                    <X size={16} className="text-[#2d3e2d]" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={handleImageUpload}
            disabled={uploadedImages.length >= 5}
            className={`w-full py-3 rounded-[1rem] border-2 border-dashed transition-colors ${
              uploadedImages.length >= 5
                ? "border-[#9ca89d] text-[#9ca89d] cursor-not-allowed"
                : "border-[#d4c5a0] text-[#6b8e6f] hover:border-[#f5a145] hover:bg-[#f5f0dc]"
            }`}
          >
            {uploadedImages.length >= 5 ? "최대 5장까지 업로드 가능" : `사진 추가 (${uploadedImages.length}/5)`}
          </button>
        </div>

        {/* Pros */}
        <div className="bg-white rounded-[1.5rem] p-6 mb-4 border-2 border-[#d4c5a0]">
          <h4 className="text-[#2d3e2d] mb-4 flex items-center gap-2">
            <ThumbsUp size={20} className="text-[#6b8e6f]" />
            장점
          </h4>
          <textarea
            value={pros}
            onChange={(e) => setPros(e.target.value)}
            placeholder="이 제품의 좋았던 점을 작성해주세요"
            className="w-full h-32 p-4 rounded-[1rem] border-2 border-[#d4c5a0] bg-[#f5f0dc] focus:border-[#6b8e6f] focus:outline-none resize-none"
          />
        </div>

        {/* Cons */}
        <div className="bg-white rounded-[1.5rem] p-6 mb-4 border-2 border-[#d4c5a0]">
          <h4 className="text-[#2d3e2d] mb-4 flex items-center gap-2">
            <ThumbsDown size={20} className="text-[#f5a145]" />
            단점
          </h4>
          <textarea
            value={cons}
            onChange={(e) => setCons(e.target.value)}
            placeholder="아쉬웠던 점을 솔직하게 작성해주세요"
            className="w-full h-32 p-4 rounded-[1rem] border-2 border-[#d4c5a0] bg-[#f5f0dc] focus:border-[#f5a145] focus:outline-none resize-none"
          />
        </div>

        {/* Suggestions */}
        <div className="bg-white rounded-[1.5rem] p-6 mb-6 border-2 border-[#d4c5a0]">
          <h4 className="text-[#2d3e2d] mb-4 flex items-center gap-2">
            <Lightbulb size={20} className="text-[#f5a145]" />
            개선점 제안
          </h4>
          <textarea
            value={suggestions}
            onChange={(e) => setSuggestions(e.target.value)}
            placeholder="사업자님께 도움이 될 개선 아이디어를 제안해주세요"
            className="w-full h-32 p-4 rounded-[1rem] border-2 border-[#d4c5a0] bg-[#f5f0dc] focus:border-[#f5a145] focus:outline-none resize-none"
          />
        </div>

        {/* Submit Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onBack}
            className="flex-1 bg-[#f5f0dc] text-[#6b8e6f] py-4 rounded-[1.5rem] hover:bg-[#ebe5cc] transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 bg-linear-to-r from-[#6b8e6f] to-[#8fa893] text-white py-4 rounded-[1.5rem] hover:opacity-90 transition-opacity"
          >
            수정 완료
          </button>
        </div>
      </div>
    </div>
  );
}
