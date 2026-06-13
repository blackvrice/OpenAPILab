import Image from "next/image";
import {
  Activity,
  ArrowRight,
  ArrowUp,
  BookOpen,
  Building2,
  CloudSun,
  DatabaseZap,
  HeartPulse,
  Landmark,
  MapPinned,
  RadioTower,
  Route,
  Search,
  ShieldAlert,
  Sparkles,
  WalletCards,
  type LucideIcon,
} from "lucide-react";

type ApiGroup = {
  title: string;
  description: string;
  icon: LucideIcon;
  tone: string;
  items: Array<string | { label: string; href: string }>;
};

const quickStats = [
  { label: "API 후보", value: "36", detail: "2개 구현" },
  { label: "API 연결 방식", value: "REST", detail: "키 관리 준비" },
  { label: "화면 구조", value: "Hub", detail: "목록에서 확장" },
];

const apiGroups: ApiGroup[] = [
  {
    title: "공공데이터/행정",
    description: "국가·지자체 데이터와 주소, 통계, 행정 코드 API",
    icon: Building2,
    tone: "bg-[#EAF2FF] text-[#1452A4]",
    items: [
      { label: "공공데이터포털", href: "/apis/public-data" },
      { label: "행안부 주소", href: "/apis/address" },
      "서울 열린데이터광장",
      "KOSIS 통계",
    ],
  },
  {
    title: "날씨/환경",
    description: "예보, 미세먼지, 수질, 해양 데이터를 대시보드로 연결",
    icon: CloudSun,
    tone: "bg-[#EAF8EF] text-[#137246]",
    items: ["기상청 단기예보", "에어코리아", "환경공단 수질", "해양 조석"],
  },
  {
    title: "지도/교통",
    description: "위치 검색, 교통 흐름, 대중교통, 지도 레이어 메뉴",
    icon: MapPinned,
    tone: "bg-[#FFF4E5] text-[#A85A00]",
    items: ["VWorld 지도", "국토교통 교통정보", "서울 버스/지하철", "Kakao Local"],
  },
  {
    title: "금융/경제",
    description: "거시 지표와 금융 공공데이터를 한 곳에서 탐색",
    icon: WalletCards,
    tone: "bg-[#F1ECFF] text-[#6738B8]",
    items: ["한국은행 ECOS", "금융위원회", "수출입은행 환율", "예금보험공사"],
  },
  {
    title: "문화/관광",
    description: "관광지, 공연, 도서, 영화 정보를 콘텐츠 메뉴로 제공",
    icon: BookOpen,
    tone: "bg-[#FFEFF4] text-[#B62558]",
    items: ["TourAPI", "문화포털", "국립중앙도서관", "영화진흥위원회"],
  },
  {
    title: "보건/안전",
    description: "의료기관, 식품, 감염병, 재난 안전 정보를 빠르게 조회",
    icon: HeartPulse,
    tone: "bg-[#EFFFFC] text-[#08766C]",
    items: ["건강보험심사평가원", "식품안전나라", "질병관리청", "재난안전포털"],
  },
  {
    title: "교육/연구",
    description: "학교, 연구자료, 특허, 도서관 API를 학습 메뉴로 구성",
    icon: Landmark,
    tone: "bg-[#EEF1FF] text-[#3947A8]",
    items: ["나이스 교육정보", "RISS", "도서관정보나루", "특허청"],
  },
  {
    title: "검색/콘텐츠",
    description: "검색, 영상, 저장소, 라이선스 데이터를 탐색 기능으로 확장",
    icon: Search,
    tone: "bg-[#F3F6F8] text-[#344151]",
    items: ["네이버 검색", "YouTube Data", "GitHub REST", "공공누리"],
  },
  {
    title: "AI/개발자 도구",
    description: "AI 응답, 테스트 엔드포인트, 개발 생산성 API 실험실",
    icon: Sparkles,
    tone: "bg-[#FFF1EA] text-[#B94716]",
    items: ["OpenAI API", "Hugging Face", "Postman Echo", "JSONPlaceholder"],
  },
];

const workFlow = [
  { label: "수집", detail: "오픈 API 문서와 키 정책 정리", icon: DatabaseZap },
  { label: "연결", detail: "서버 라우트에서 인증값 보호", icon: ShieldAlert },
  { label: "시각화", detail: "메뉴별 조회 화면과 상태 표시", icon: Activity },
  { label: "배포", detail: "서비스별 사용량과 오류 추적", icon: RadioTower },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#F6F8FB] text-[#111827]">
      <header className="sticky top-0 z-20 border-b border-[#DDE5EF] bg-white/95">
        <nav
          className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 lg:px-8"
          aria-label="Primary navigation"
        >
          <a href="#" className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-lg bg-[#111827] text-white">
              <DatabaseZap className="size-5" aria-hidden="true" />
            </span>
            <span className="flex flex-col leading-none">
              <span className="text-base font-semibold">Open API Lab</span>
              <span className="mt-1 text-xs text-[#64748B]">React API Hub</span>
            </span>
          </a>
          <div className="hidden items-center gap-2 md:flex">
            <a
              href="#project"
              className="rounded-md px-3 py-2 text-sm font-medium text-[#475569] hover:bg-[#EEF2F7] hover:text-[#111827]"
            >
              프로젝트
            </a>
            <a
              href="#api-menu"
              className="rounded-md px-3 py-2 text-sm font-medium text-[#475569] hover:bg-[#EEF2F7] hover:text-[#111827]"
            >
              API 메뉴
            </a>
            <a
              href="#workflow"
              className="rounded-md px-3 py-2 text-sm font-medium text-[#475569] hover:bg-[#EEF2F7] hover:text-[#111827]"
            >
              연동 흐름
            </a>
          </div>
          <a
            href="#api-menu"
            className="inline-flex h-10 items-center gap-2 rounded-md bg-[#1E4FD7] px-4 text-sm font-semibold text-white hover:bg-[#193FAA]"
          >
            <Route className="size-4" aria-hidden="true" />
            메뉴 보기
          </a>
        </nav>
      </header>

      <section
        id="project"
        className="scroll-mt-24 border-b border-[#DDE5EF] bg-white"
      >
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-10 lg:grid-cols-[1fr_420px] lg:px-8 lg:py-14">
          <div className="flex flex-col justify-center">
            <p className="mb-5 inline-flex w-fit items-center gap-2 rounded-md border border-[#BFD0E8] bg-[#F4F8FF] px-3 py-2 text-sm font-semibold text-[#1E4FD7]">
              <Sparkles className="size-4" aria-hidden="true" />
              모든 오픈 API를 실험하고 연결하는 React 프로젝트
            </p>
            <h1 className="max-w-3xl text-4xl font-bold leading-[1.15] text-[#0F172A] sm:text-5xl">
              Open API Lab
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-[#475569]">
              공공데이터, 지도, 날씨, 금융, 문화, 보건, AI API를 하나의
              메뉴 허브에서 탐색하고 실제 React 화면으로 확장하는 실험실입니다.
              첫 화면은 프로젝트 소개와 전체 API 카탈로그의 진입점 역할을 합니다.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href="#api-menu"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-[#111827] px-5 text-sm font-semibold text-white hover:bg-[#263244]"
              >
                <DatabaseZap className="size-4" aria-hidden="true" />
                API 리스트 보기
              </a>
              <a
                href="#workflow"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-md border border-[#C8D3E0] bg-white px-5 text-sm font-semibold text-[#111827] hover:bg-[#F3F6FA]"
              >
                <ArrowRight className="size-4" aria-hidden="true" />
                연동 흐름 확인
              </a>
            </div>
            <dl className="mt-8 grid max-w-2xl gap-3 sm:grid-cols-3">
              {quickStats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-lg border border-[#DDE5EF] bg-[#FAFBFD] p-4"
                >
                  <dt className="text-sm font-medium text-[#64748B]">
                    {stat.label}
                  </dt>
                  <dd className="mt-3 text-2xl font-bold text-[#111827]">
                    {stat.value}
                  </dd>
                  <p className="mt-1 text-sm text-[#64748B]">{stat.detail}</p>
                </div>
              ))}
            </dl>
          </div>

          <div className="rounded-lg border border-[#CAD7E6] bg-[#F8FAFD] p-5 shadow-sm">
            <div className="flex items-center justify-between border-b border-[#DDE5EF] pb-4">
              <div>
                <p className="text-sm font-semibold text-[#1E4FD7]">
                  Live API Console
                </p>
                <h2 className="mt-1 text-xl font-bold text-[#0F172A]">
                  메뉴에서 호출까지
                </h2>
              </div>
              <Image
                src="/globe.svg"
                alt="Global open API network"
                width={42}
                height={42}
                priority
              />
            </div>
            <div className="mt-5 space-y-5">
              <div className="border-b border-[#DDE5EF] pb-5">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold text-[#64748B]">
                    Request
                  </span>
                  <span className="rounded-md bg-[#EAF8EF] px-2 py-1 text-xs font-bold text-[#137246]">
                    READY
                  </span>
                </div>
                <code className="mt-4 block overflow-x-auto rounded-md bg-[#0F172A] px-4 py-3 text-sm text-[#DDEBFF]">
                  GET /api/public-data-portal?q=날씨
                </code>
              </div>
              <div className="grid gap-5 border-b border-[#DDE5EF] pb-5 sm:grid-cols-2">
                <div>
                  <p className="text-sm font-semibold text-[#64748B]">
                    인증 정책
                  </p>
                  <p className="mt-2 text-lg font-bold text-[#111827]">
                    서버 라우트 보호
                  </p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#64748B]">
                    응답 상태
                  </p>
                  <p className="mt-2 text-lg font-bold text-[#137246]">
                    200 OK
                  </p>
                </div>
              </div>
              <div>
                <div className="mb-3 flex items-center justify-between text-sm">
                  <span className="font-semibold text-[#64748B]">
                    카탈로그 준비율
                  </span>
                  <span className="font-bold text-[#1E4FD7]">72%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-md bg-[#E2E8F0]">
                  <div className="h-full w-[72%] rounded-md bg-[#1E4FD7]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        id="api-menu"
        className="mx-auto max-w-7xl scroll-mt-24 px-5 py-14 lg:px-8"
      >
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-semibold text-[#1E4FD7]">
              Open API Menu
            </p>
            <h2 className="mt-3 text-3xl font-bold text-[#0F172A]">
              카테고리별 오픈 API 리스트
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-[#475569]">
              모든 API는 메뉴 단위로 연결될 수 있도록 설계했습니다. 실제 구현
              단계에서는 각 카드가 상세 페이지, 검색 필터, API 호출 화면으로
              확장됩니다.
            </p>
          </div>
          <a
            href="#"
            className="inline-flex h-11 w-fit items-center gap-2 rounded-md border border-[#C8D3E0] bg-white px-4 text-sm font-semibold text-[#111827] hover:bg-[#F3F6FA]"
          >
            <ArrowUp className="size-4" aria-hidden="true" />
            상단으로
          </a>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {apiGroups.map((group) => {
            const Icon = group.icon;

            return (
              <article
                key={group.title}
                className="rounded-lg border border-[#DDE5EF] bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-[#9DB2CF]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div
                      className={`mb-4 flex size-11 items-center justify-center rounded-lg ${group.tone}`}
                    >
                      <Icon className="size-5" aria-hidden="true" />
                    </div>
                    <h3 className="text-xl font-bold text-[#111827]">
                      {group.title}
                    </h3>
                    <p className="mt-3 min-h-14 text-sm leading-6 text-[#64748B]">
                      {group.description}
                    </p>
                  </div>
                  <span className="shrink-0 whitespace-nowrap rounded-md border border-[#DDE5EF] px-2 py-1 text-xs font-bold text-[#64748B]">
                    메뉴
                  </span>
                </div>
                <ul className="mt-5 grid gap-2">
                  {group.items.map((item) => {
                    const label = typeof item === "string" ? item : item.label;
                    const href = typeof item === "string" ? undefined : item.href;

                    return (
                      <li key={label}>
                        {href ? (
                          <a
                            href={href}
                            className="flex min-h-10 items-center justify-between gap-3 rounded-md border border-[#DDE5EF] bg-[#F4F8FF] px-3 py-2 text-sm font-bold text-[#1452A4] hover:border-[#9DB2CF]"
                          >
                            <span>{label}</span>
                            <ArrowRight
                              className="size-4 shrink-0"
                              aria-hidden="true"
                            />
                          </a>
                        ) : (
                          <span className="flex min-h-10 items-center justify-between gap-3 rounded-md border border-[#EEF2F7] bg-[#FAFBFD] px-3 py-2 text-sm font-medium text-[#334155]">
                            <span>{label}</span>
                            <ArrowRight
                              className="size-4 shrink-0 text-[#94A3B8]"
                              aria-hidden="true"
                            />
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </article>
            );
          })}
        </div>
      </section>

      <section
        id="workflow"
        className="scroll-mt-24 border-t border-[#DDE5EF] bg-white"
      >
        <div className="mx-auto max-w-7xl px-5 py-14 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
            <div>
              <p className="text-sm font-semibold text-[#1E4FD7]">
                Integration Flow
              </p>
              <h2 className="mt-3 text-3xl font-bold text-[#0F172A]">
                실제 API 붙이기 좋은 구조
              </h2>
              <p className="mt-4 text-base leading-7 text-[#475569]">
                API 키와 호출 로직은 서버 쪽으로 분리하고, 화면은 메뉴와 상태를
                중심으로 확장합니다.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {workFlow.map((step, index) => {
                const Icon = step.icon;

                return (
                  <article
                    key={step.label}
                    className="rounded-lg border border-[#DDE5EF] bg-[#FAFBFD] p-5"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="flex size-10 items-center justify-center rounded-lg bg-white text-[#1E4FD7]">
                        <Icon className="size-5" aria-hidden="true" />
                      </span>
                      <span className="text-sm font-bold text-[#94A3B8]">
                        0{index + 1}
                      </span>
                    </div>
                    <h3 className="mt-5 text-lg font-bold text-[#111827]">
                      {step.label}
                    </h3>
                    <p className="mt-3 text-sm leading-6 text-[#64748B]">
                      {step.detail}
                    </p>
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
