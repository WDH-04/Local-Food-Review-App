import { useState } from "react";
import type { ImgHTMLAttributes } from "react";
import { ArrowLeft, Upload, X, ThumbsUp, ThumbsDown, Lightbulb } from "lucide-react";
import { toast } from "sonner";
import type { Product } from "../data/mockData";
import type { Review } from "../App";

type ImageWithFallbackProps = ImgHTMLAttributes<HTMLImageElement> & {
  src?: string | undefined;
  alt?: string;
  fallbackSrc?: string;
  className?: string;
};

export function ImageWithFallback({
  src,
  alt,
  className,
  fallbackSrc = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300'><rect width='100%' height='100%' fill='%23f5f0dc'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%239ca89d' font-family='Arial' font-size='20'>이미지 없음</text></svg>",
  ...rest
}: ImageWithFallbackProps) {
  const [imgSrc, setImgSrc] = useState<string | undefined>(src);

  return (
    // eslint-disable-next-line jsx-a11y/alt-text
    <img
      src={imgSrc}
      alt={alt}
      className={className}
      onError={() => setImgSrc(fallbackSrc)}
      {...rest}
    />
  );
}

interface ReviewWritePageProps {
  product: Product;
  onBack: () => void;
  userName?: string;
  onSubmit: (reviewData: Omit<Review, "id" | "createdAt">) => void;
}

export function ReviewWritePage({ product, onBack, userName = "회원", onSubmit }: ReviewWritePageProps) {
  const [pros, setPros] = useState("");
  const [cons, setCons] = useState("");
  const [suggestions, setSuggestions] = useState("");
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);

  const handleImageUpload = () => {
    // Mock image upload - in real app, would handle file upload
    const mockImages = [
      "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400",
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

  const handleSubmitReview = () => {
    if (!pros.trim() && !cons.trim() && !suggestions.trim()) {
      toast.error("최소 한 가지 항목은 작성해주세요");
      return;
    }

    const reviewData: Omit<Review, "id" | "createdAt"> = {
      productId: product.id,
      productName: product.name,
      productImage: product.image,
      pros: pros.trim(),
      cons: cons.trim(),
      improvements: suggestions.trim(),
      photos: uploadedImages,
      userId: userName,
      userName: userName,
      status: "published",
      reported: false,
    };

    onSubmit(reviewData);
  };

  return (
    <div className="min-h-screen bg-[#fffef5] pb-24">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b-2 border-[#d4c5a0] z-10">
        <div className="max-w-md mx-auto px-6 py-4 flex items-center justify-between">
          <button onClick={onBack} className="text-[#2d3e2d] hover:text-[#6b8e6f] transition-colors">
            <ArrowLeft size={24} />
          </button>
          <h4 className="text-[#2d3e2d]">리뷰 작성</h4>
          <div className="w-6"></div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-6 py-6">
        {/* Product Info */}
        <div className="bg-white rounded-[1.5rem] p-5 mb-6 border-2 border-[#d4c5a0]">
          <div className="flex gap-4">
            <div className="w-20 h-20 rounded-[1rem] overflow-hidden bg-[#f5f0dc] shrink-0">
              <ImageWithFallback
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1">
              <h3 className="text-[#2d3e2d] mb-1">{product.name}</h3>
              <p className="text-sm text-[#9ca89d] mb-2">{product.seller}</p>
              <span className="text-xs px-3 py-1 rounded-full bg-[#6b8e6f] text-white">
                체험 완료
              </span>
            </div>
          </div>
        </div>

        {/* Guide */}
  <div className="bg-linear-to-r from-[#6b8e6f] to-[#8fa893] rounded-[1.5rem] p-6 mb-6 text-white">
          <h3 className="mb-3">솔직한 평가를 부탁드려요</h3>
          <p className="text-sm opacity-90">
            중소 사업자님들이 더 나은 제품을 만들 수 있도록 장점, 단점, 개선점을 솔직하게 작성해주세요.
          </p>
        </div>

        {/* Image Upload */}
        <div className="bg-white rounded-[1.5rem] p-6 mb-4 border-2 border-[#d4c5a0]">
          <h4 className="text-[#2d3e2d] mb-4 flex items-center gap-2">
            <Upload size={20} className="text-[#6b8e6f]" />
            음식 사진 업로드
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
            onChange={(e) => setPros(e.target.value.slice(0, 500))}
            placeholder="이 제품의 좋았던 점을 작성해주세요&#10;&#10;예시:&#10;- 신선한 재료를 사용해서 맛이 좋았어요&#10;- 양이 푸짐해서 만족스러웠습니다&#10;- 포장이 깔끔하고 배달도 빨랐어요"
            className="w-full h-32 p-4 rounded-[1rem] border-2 border-[#d4c5a0] bg-[#f5f0dc] focus:border-[#6b8e6f] focus:outline-none resize-none transition-colors"
          />
          <div className="flex justify-end mt-2">
            <span className={`text-xs ${pros.length > 450 ? 'text-[#e63946]' : 'text-[#9ca89d]'}`}>
              {pros.length}/500
            </span>
          </div>
        </div>

        {/* Cons */}
        <div className="bg-white rounded-[1.5rem] p-6 mb-4 border-2 border-[#d4c5a0]">
          <h4 className="text-[#2d3e2d] mb-4 flex items-center gap-2">
            <ThumbsDown size={20} className="text-[#f5a145]" />
            단점
          </h4>
          <textarea
            value={cons}
            onChange={(e) => setCons(e.target.value.slice(0, 500))}
            placeholder="아쉬웠던 점을 솔직하게 작성해주세요&#10;&#10;예시:&#10;- 조금 짜서 간 조절이 필요할 것 같아요&#10;- 가격 대비 양이 적었어요&#10;- 배달 시간이 예상보다 오래 걸렸어요"
            className="w-full h-32 p-4 rounded-[1rem] border-2 border-[#d4c5a0] bg-[#f5f0dc] focus:border-[#f5a145] focus:outline-none resize-none transition-colors"
          />
          <div className="flex justify-end mt-2">
            <span className={`text-xs ${cons.length > 450 ? 'text-[#e63946]' : 'text-[#9ca89d]'}`}>
              {cons.length}/500
            </span>
          </div>
        </div>

        {/* Suggestions */}
        <div className="bg-white rounded-[1.5rem] p-6 mb-6 border-2 border-[#d4c5a0]">
          <h4 className="text-[#2d3e2d] mb-4 flex items-center gap-2">
            <Lightbulb size={20} className="text-[#f5a145]" />
            개선점 제안
          </h4>
          <textarea
            value={suggestions}
            onChange={(e) => setSuggestions(e.target.value.slice(0, 500))}
            placeholder="사업자님께 도움이 될 개선 아이디어를 제안해주세요&#10;&#10;예시:&#10;- 소스를 별도로 제공하면 좋을 것 같아요&#10;- 포장 용기가 더 튼튼했으면 해요&#10;- 매운맛 단계를 선택할 수 있으면 좋겠어요"
            className="w-full h-32 p-4 rounded-[1rem] border-2 border-[#d4c5a0] bg-[#f5f0dc] focus:border-[#f5a145] focus:outline-none resize-none transition-colors"
          />
          <div className="flex justify-end mt-2">
            <span className={`text-xs ${suggestions.length > 450 ? 'text-[#e63946]' : 'text-[#9ca89d]'}`}>
              {suggestions.length}/500
            </span>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-center">
          <button
            onClick={handleSubmitReview}
            className="w-full bg-linear-to-r from-[#6b8e6f] to-[#8fa893] text-white py-4 rounded-[1.5rem] hover:opacity-90 transition-opacity text-center"
          >
            리뷰 등록하기
          </button>
        </div>
      </div>
    </div>
  );
}