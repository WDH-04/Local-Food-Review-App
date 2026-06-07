# 밥터뷰 (Babterview) 🍽️

> "우리동네 맛평가단" - 중소 식품 사업자와 소비자를 잇는 솔직한 맛 평가 & 홍보 플랫폼

## ✨ 지금 바로 방문하기 **[🔗 Demo 바로가기](https://local-food-review-app.vercel.app/)**

<p align="center">

<img width="637" height="600" alt="스크린샷 2025-11-14 오후 8 23 49" src="https://github.com/user-attachments/assets/c4f8df4c-f029-40fb-a0d7-3ed4d3af4306" />
<br>
<img width="560" height="673" alt="스크린샷 2025-11-14 오후 8 24 08" src="https://github.com/user-attachments/assets/2216baa6-80cd-48bc-b24d-a9bfa2e455a4" />

-----

## 🤔 문제점 (Problem)

대기업 및 유명 상품이 마케팅을 독점하고 있어, 중소 식품 사업자(자영업자 포함)는 인지도를 쌓기 어렵고 마케팅 비용에 부담을 느낍니다.

기존 배달앱의 평점 시스템은 신뢰도가 부족하며, 상세한 피드백(장점, 단점, 개선점)을 받기 어렵습니다.

## 💡 솔루션 (Solution)

무신사, 화해와 같은 플랫폼의 체험단 모델에서 아이디어를 얻어, "우리동네 맛평가단" 컨셉의 '밥터뷰'를 기획했습니다.

판매자(사업자)는 신제품이나 주력 메뉴를 저렴하게(혹은 무료로) 제공하고, 소비자(리뷰어)로부터 광고가 아닌 솔직한 피드백을 수집하여 제품 개선과 홍보에 활용합니다.

소비자(리뷰어)는 저렴한 비용으로 새로운 식품을 경험하고, '숨겨진 맛집'을 발굴하며, 자신의 상세한 평가가 가게 발전에 기여하는 보람을 느낍니다.

## ✨ 주요 기능

밥터뷰는 사장님(B2B)과 맛평가단(B2C), 두 사용자 모두를 위한 완벽한 상호작용을 제공합니다.

### 🧑‍🍳 사장님 (B2B)

* 📢 체험단 모집: 간편하게 가게와 메뉴를 등록해 '맛평가단'을 모집합니다.
* ✅ 신청자 관리: 신청한 리뷰어의 정보를 확인하고, '선정' 또는 '거절' 처리를 합니다.
* 💬 리뷰 관리: 작성된 리뷰를 한곳에서 모아보고, 악성 리뷰는 '비공개' 처리할 수 있습니다.

### ✍️ 맛평가단 (B2C)

* 🔍 탐색 및 신청: '우리동네'의 새로운 맛집 체험단을 탐색하고, 찜하거나 바로 신청합니다.
* 📈 신청 현황: 마이페이지에서 내 신청 상태(대기중, 선정, 미선정)를 실시간으로 확인합니다.
* 🔔 실시간 알림: 체험단 선정/미선정 결과를 즉시 알림으로 받아볼 수 있습니다.
* 📝 상세 리뷰 작성: '선정'된 후, [장점/단점/개선점]으로 구분된 솔직한 피드백을 사진과 함께 남깁니다.
* 💰 포인트 보상: 리뷰를 작성하면 포인트가 적립되며, '포인트 상점'에서 기프티콘으로 교환할 수 있습니다.

## 🚀 프로토타입 핵심: localStorage를 활용한 데이터 영구 저장

이 프로젝트는 localStorage를 가상 데이터베이스로 활용하여, MVP(최소 기능 제품)가 실제 서비스처럼 작동하는 완전한 데이터 흐름을 구현했습니다.

useState와 useEffect를 결합하여 allProducts, applications, reviews, userInfo 등 9가지 핵심 데이터를 localStorage에 실시간으로 저장하고 불러옵니다.

이를 통해, 사용자가 앱을 새로고침하거나 로그아웃 후 다시 로그인해도 이전에 등록한 체험단이나 작성한 리뷰 데이터가 사라지지 않고 그대로 보존됩니다.

## 🛠️ 기술 스택

* Core: React, TypeScript, Vite
* Styling: Tailwind CSS, motion/react (애니메이션)
* Backend (API): Supabase (Edge Functions, Auth)
* Prototype DB: localStorage (브라우저 영구 저장)
* State Management: React Hooks (useState, useEffect) (컴포넌트 props drilling)

## 📂 폴더 구조

```
/
├─ public/              # favicon, 앱 로고 등 정적 에셋
├─ src/
│  ├─ api/               # Supabase 클라이언트 및 API 함수 (authApi, productApi)
│  ├─ assets/            # 로컬 이미지, 아이콘 등
│  ├─ components/        # 재사용 가능한 UI 컴포넌트
│  │  ├─ common/          # Header, Footer, Button, Modal 등 공용 컴포넌트
│  │  ├─ product/         # ProductCard, ProductForm 등 상품 관련
│  │  └─ review/          # ReviewItem, ReviewForm 등 리뷰 관련
│  ├─ hooks/             # 커스텀 훅 (예: useAuth, useLocalStorage)
│  ├─ pages/             # 라우팅 단위의 메인 페이지
│  │  ├─ auth/            # 로그인, 회원가입 페이지
│  │  ├─ business/        # 🧑‍🍳 사업자 전용 페이지 (체험단 등록, 신청자 관리 등)
│  │  ├─ reviewer/        # ✍️ 리뷰어 전용 페이지 (마이페이지, 신청 현황, 포인트 상점)
│  │  ├─ Home.tsx         # 🏠 메인 (체험단 리스트)
│  │  ├─ ProductDetail.tsx  # 🍴 상품 상세
│  │  └─ ReviewWrite.tsx    # 📝 리뷰 작성
│  ├─ types/             # 전역 TypeScript 타입 정의 (User, Product, Review 등)
│  ├─ utils/             # 날짜 포맷팅 등 순수 헬퍼 함수
│  ├─ App.tsx            # 메인 애플리케이션, 라우터(React Router) 설정
│  └─ main.tsx           # 애플리케이션 진입점
├─ .env.local           # Supabase API 키 등 환경 변수
├─ .gitignore
├─ package.json
├─ tailwind.config.js   # Tailwind CSS 설정
└─ vite.config.ts       # Vite 설정
```

## 📬 Contact

  - **GitHub:** [@Duckcchun](https://github.com/Duckcchun)
  - **Email:** (qasw1733@gmail.com)

