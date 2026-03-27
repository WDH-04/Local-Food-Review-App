import { CATEGORIES } from "../data/categories";

interface CategoryFilterProps {
  selectedCategory: string;
  onSelectCategory: (categoryId: string) => void;
}

export function CategoryFilter({ selectedCategory, onSelectCategory }: CategoryFilterProps) {
  return (
    <div className="">
      {/* Horizontal Scrollable Categories */}
      <div className="overflow-x-auto pb-2 -mx-6 px-6 scrollbar-hide">
        <div className="flex gap-2 min-w-max">
          {CATEGORIES.map((category) => {
            const isSelected = selectedCategory === category.id;
            
            return (
              <button
                key={category.id}
                onClick={() => onSelectCategory(category.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-full whitespace-nowrap transition-all ${
                  isSelected
                    ? "shadow-md transform scale-105"
                    : "border-2 border-[#d4c5a0] hover:border-[#6b8e6f]"
                }`}
                style={{
                  backgroundColor: isSelected ? category.color : "white",
                  color: isSelected ? "white" : category.color,
                  borderColor: isSelected ? category.color : undefined
                }}
              >
                <span className="text-lg">{category.icon}</span>
                <span className="text-sm font-medium">{category.name}</span>
              </button>
            );
          })}
        </div>
      </div>
      
      {/* Gradient Fade Effect */}
  <div className="absolute top-0 right-0 w-8 h-full bg-linear-to-l from-[#fffef5] to-transparent pointer-events-none"></div>
    </div>
  );
}
