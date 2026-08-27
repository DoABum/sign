This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

> ⚠️ `/`, `/admin` (전자 서명부)는 `better-sqlite3`로 로컬 파일에 저장하므로, 서버리스 배포(Vercel)에서는 기록이
> 안정적으로 남지 않습니다. 지속적인 디스크를 제공하는 호스팅(Railway, Render, Fly.io, 자체 서버 등)에 배포하세요.

## `/eval` (수학 수업 관찰 기록) 배포 가이드

이 기능은 구글 시트를 데이터 저장소로 사용하므로 Vercel 같은 서버리스 호스팅에 올려도 기록이 안전하게 보존됩니다.

### 1. 구글 시트 + Apps Script 배포

1. 새 구글 시트를 만듭니다. (탭 이름은 스크립트가 알아서 생성하므로 신경 쓰지 않아도 됩니다)
2. 상단 메뉴 **확장 프로그램 > Apps Script** 를 열고, 기본 `Code.gs` 내용을 지운 뒤 이 저장소의
   [`appsscript/Code.gs`](./appsscript/Code.gs) 내용을 붙여넣습니다.
3. Apps Script 편집기 왼쪽 **프로젝트 설정(톱니바퀴)** > **스크립트 속성**에서
   `APP_TOKEN` 키로 임의의 긴 문자열(예: 비밀번호 생성기로 만든 값)을 등록합니다.
4. 우측 상단 **배포 > 새 배포**를 클릭합니다.
   - 유형: **웹 앱**
   - 실행 계정: **나**
   - 액세스 권한: **모든 사용자**
5. 배포 후 나오는 **웹 앱 URL**(`.../exec`로 끝남)을 복사해둡니다.

### 2. Vercel(또는 다른 호스팅)에 Next.js 배포

1. Vercel에서 이 GitHub 저장소(`DoABum/sign`)를 New Project로 연결합니다. (Next.js 프로젝트는 자동 인식됩니다)
2. 프로젝트 환경변수(Environment Variables)에 아래 두 값을 등록합니다. (`.env.example` 참고)
   - `GOOGLE_SCRIPT_URL`: 위에서 복사한 Apps Script 웹 앱 URL
   - `GOOGLE_SCRIPT_TOKEN`: 위에서 등록한 `APP_TOKEN`과 동일한 값
3. Deploy를 누르면 `https://<프로젝트명>.vercel.app` 형태의 주소가 생성됩니다.
4. 이후 `claude/student-presentation-eval-i26w2l` 브랜치(또는 병합된 main)에 새 커밋을 푸시할 때마다
   Vercel이 자동으로 재배포합니다.

배포된 주소의 `/eval`, `/eval/admin` 경로에서 바로 사용할 수 있습니다.
