"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Building2,
  Copy,
  Loader2,
  MapPin,
  Navigation,
  RefreshCw,
  Search,
  ShieldCheck,
} from "lucide-react";

type AddressRecord = {
  id: string;
  roadAddress: string;
  roadAddressPart1: string;
  roadAddressPart2: string;
  jibunAddress: string;
  englishAddress: string;
  zipCode: string;
  sido: string;
  sigungu: string;
  eupmyeondong: string;
  roadName: string;
  buildingName: string;
  adminCode: string;
  roadCode: string;
  buildingCode: string;
};

type AddressResponse = {
  source: "live" | "fallback" | "missing-key";
  keyword: string;
  notice?: string;
  currentCount: number;
  totalCount: number;
  errorCode: string;
  errorMessage: string;
  updatedAt: string;
  addresses: AddressRecord[];
};

const initialData: AddressResponse = {
  source: "missing-key",
  keyword: "",
  currentCount: 0,
  totalCount: 0,
  errorCode: "INIT",
  errorMessage: "초기 상태",
  updatedAt: new Date(0).toISOString(),
  addresses: [],
};

function formatDateTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getSourceLabel(source: AddressResponse["source"]) {
  if (source === "live") {
    return "Live";
  }

  if (source === "missing-key") {
    return "Key 필요";
  }

  return "Sample";
}

export default function AddressClient() {
  const [data, setData] = useState<AddressResponse>(initialData);
  const [keyword, setKeyword] = useState("서울특별시청");
  const [submittedKeyword, setSubmittedKeyword] = useState("서울특별시청");
  const [countPerPage, setCountPerPage] = useState("10");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);

  const requestPath = useMemo(() => {
    const params = new URLSearchParams();
    params.set("keyword", submittedKeyword.trim() || "서울특별시청");
    params.set("countPerPage", countPerPage);
    return `/api/juso-address?${params.toString()}`;
  }, [countPerPage, submittedKeyword]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadAddresses() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(requestPath, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`주소 조회 실패: ${response.status}`);
        }

        const payload = (await response.json()) as AddressResponse;
        setData(payload);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          return;
        }

        setError(err instanceof Error ? err.message : "주소를 불러오지 못했습니다.");
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    loadAddresses();

    return () => controller.abort();
  }, [requestPath, refreshToken]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmittedKeyword(keyword);
  }

  async function copyAddress(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedText(value);
      window.setTimeout(() => setCopiedText(null), 1400);
    } catch {
      setCopiedText(null);
    }
  }

  return (
    <main className="min-h-screen bg-[#F6F8FB] text-[#111827]">
      <header className="border-b border-[#DDE5EF] bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-6 lg:px-8">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <Link
              href="/"
              className="inline-flex w-fit items-center gap-2 rounded-md border border-[#C8D3E0] bg-white px-3 py-2 text-sm font-semibold text-[#334155] hover:bg-[#F3F6FA]"
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              메인으로
            </Link>
            <span className="inline-flex w-fit items-center gap-2 rounded-md bg-[#FFF4E5] px-3 py-2 text-sm font-bold text-[#A85A00]">
              <ShieldCheck className="size-4" aria-hidden="true" />
              승인키는 서버 환경변수에서만 사용
            </span>
          </div>

          <div className="grid gap-8 lg:grid-cols-[1fr_360px] lg:items-end">
            <div>
              <p className="inline-flex items-center gap-2 rounded-md border border-[#BFD0E8] bg-[#F4F8FF] px-3 py-2 text-sm font-semibold text-[#1E4FD7]">
                <MapPin className="size-4" aria-hidden="true" />
                두 번째 Open API
              </p>
              <h1 className="mt-5 text-4xl font-bold leading-tight text-[#0F172A] sm:text-5xl">
                행안부 도로명주소 검색
              </h1>
              <p className="mt-5 max-w-3xl text-base leading-7 text-[#475569]">
                주소기반산업지원서비스의 도로명주소 API를 연결해 도로명주소,
                지번주소, 우편번호, 영문주소를 한 번에 확인하는 페이지입니다.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg border border-[#DDE5EF] bg-[#FAFBFD] p-4">
                <p className="text-xs font-semibold text-[#64748B]">표시</p>
                <p className="mt-2 text-2xl font-bold text-[#111827]">
                  {data.currentCount}
                </p>
              </div>
              <div className="rounded-lg border border-[#DDE5EF] bg-[#FAFBFD] p-4">
                <p className="text-xs font-semibold text-[#64748B]">전체</p>
                <p className="mt-2 text-2xl font-bold text-[#111827]">
                  {data.totalCount}
                </p>
              </div>
              <div className="rounded-lg border border-[#DDE5EF] bg-[#FAFBFD] p-4">
                <p className="text-xs font-semibold text-[#64748B]">모드</p>
                <p className="mt-2 text-xl font-bold text-[#1E4FD7]">
                  {getSourceLabel(data.source)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <section className="border-b border-[#DDE5EF] bg-white">
        <div className="mx-auto max-w-7xl px-5 py-5 lg:px-8">
          <form
            onSubmit={handleSubmit}
            className="grid gap-3 lg:grid-cols-[1fr_150px_auto_auto]"
          >
            <label className="flex min-h-12 items-center gap-3 rounded-md border border-[#C8D3E0] bg-white px-3">
              <Search className="size-4 shrink-0 text-[#64748B]" aria-hidden="true" />
              <input
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                className="min-w-0 flex-1 bg-transparent text-sm text-[#111827] outline-none placeholder:text-[#94A3B8]"
                placeholder="도로명, 건물명, 지번 주소 검색"
              />
            </label>

            <select
              aria-label="표시 개수"
              value={countPerPage}
              onChange={(event) => setCountPerPage(event.target.value)}
              className="min-h-12 rounded-md border border-[#C8D3E0] bg-white px-3 text-sm font-medium text-[#111827] outline-none"
            >
              <option value="5">5개</option>
              <option value="10">10개</option>
              <option value="20">20개</option>
            </select>

            <button className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-[#1E4FD7] px-5 text-sm font-semibold text-white hover:bg-[#193FAA]">
              <Search className="size-4" aria-hidden="true" />
              주소 검색
            </button>

            <button
              type="button"
              onClick={() => {
                setKeyword("서울특별시청");
                setSubmittedKeyword("서울특별시청");
              }}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md border border-[#C8D3E0] bg-white px-5 text-sm font-semibold text-[#111827] hover:bg-[#F3F6FA]"
            >
              <RefreshCw className="size-4" aria-hidden="true" />
              초기화
            </button>
          </form>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-5 px-5 py-8 lg:grid-cols-[280px_1fr] lg:px-8">
        <aside className="space-y-4">
          <div className="rounded-lg border border-[#DDE5EF] bg-white p-5">
            <h2 className="text-base font-bold text-[#0F172A]">호출 정보</h2>
            <dl className="mt-4 space-y-4 text-sm">
              <div>
                <dt className="font-semibold text-[#64748B]">프록시 엔드포인트</dt>
                <dd className="mt-2 overflow-x-auto rounded-md bg-[#0F172A] px-3 py-2 font-mono text-xs text-[#DDEBFF]">
                  {requestPath}
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-[#64748B]">외부 API</dt>
                <dd className="mt-1 text-[#334155]">
                  business.juso.go.kr/addrlink/addrLinkApi.do
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-[#64748B]">마지막 조회</dt>
                <dd className="mt-1 text-[#334155]">
                  {formatDateTime(data.updatedAt)}
                </dd>
              </div>
            </dl>
          </div>

          <div className="rounded-lg border border-[#DDE5EF] bg-white p-5">
            <h2 className="text-base font-bold text-[#0F172A]">상태</h2>
            {isLoading ? (
              <p className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-[#1E4FD7]">
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                주소를 가져오는 중
              </p>
            ) : (
              <p className="mt-3 text-sm leading-6 text-[#475569]">
                {data.source === "live"
                  ? "주소정보 API 응답을 화면에 표시 중입니다."
                  : "승인키가 없거나 호출에 실패하면 샘플 주소를 표시합니다."}
              </p>
            )}
            {data.notice ? (
              <p className="mt-3 rounded-md bg-[#FFF4E5] px-3 py-2 text-sm leading-6 text-[#8A4B05]">
                {data.notice}
              </p>
            ) : null}
            {error ? (
              <p className="mt-3 rounded-md bg-[#FFEFF4] px-3 py-2 text-sm leading-6 text-[#B62558]">
                {error}
              </p>
            ) : null}
            <button
              type="button"
              onClick={() => setRefreshToken((value) => value + 1)}
              className="mt-4 inline-flex h-10 items-center gap-2 rounded-md border border-[#C8D3E0] bg-white px-4 text-sm font-semibold text-[#111827] hover:bg-[#F3F6FA]"
            >
              <RefreshCw className="size-4" aria-hidden="true" />
              다시 호출
            </button>
          </div>

          {copiedText ? (
            <p className="rounded-lg border border-[#CFE9DA] bg-[#EAF8EF] px-4 py-3 text-sm font-semibold text-[#137246]">
              주소를 복사했습니다.
            </p>
          ) : null}
        </aside>

        <div className="space-y-4">
          {data.addresses.length === 0 && !isLoading ? (
            <div className="rounded-lg border border-[#DDE5EF] bg-white p-8 text-center">
              <MapPin className="mx-auto size-8 text-[#94A3B8]" aria-hidden="true" />
              <h2 className="mt-4 text-xl font-bold text-[#111827]">
                검색 결과가 없습니다
              </h2>
              <p className="mt-2 text-sm text-[#64748B]">
                도로명, 건물명, 지번 주소를 조금 더 구체적으로 입력해 주세요.
              </p>
            </div>
          ) : null}

          {data.addresses.map((address) => (
            <article
              key={address.id}
              className="rounded-lg border border-[#DDE5EF] bg-white p-5 shadow-sm"
            >
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-md bg-[#EAF2FF] px-2 py-1 text-xs font-bold text-[#1452A4]">
                      <Navigation className="size-3.5" aria-hidden="true" />
                      {address.sido} {address.sigungu}
                    </span>
                    <span className="rounded-md bg-[#F3F6F8] px-2 py-1 text-xs font-bold text-[#475569]">
                      우편번호 {address.zipCode}
                    </span>
                    {address.buildingName !== "-" ? (
                      <span className="inline-flex items-center gap-1 rounded-md bg-[#FFF4E5] px-2 py-1 text-xs font-bold text-[#A85A00]">
                        <Building2 className="size-3.5" aria-hidden="true" />
                        {address.buildingName}
                      </span>
                    ) : null}
                  </div>
                  <h2 className="mt-4 text-2xl font-bold leading-tight text-[#0F172A]">
                    {address.roadAddress}
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-[#475569]">
                    {address.englishAddress}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => copyAddress(address.roadAddress)}
                  className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-md bg-[#111827] px-4 text-sm font-semibold text-white hover:bg-[#263244]"
                >
                  <Copy className="size-4" aria-hidden="true" />
                  복사
                </button>
              </div>

              <dl className="mt-5 grid gap-3 border-t border-[#EEF2F7] pt-5 lg:grid-cols-2">
                <div>
                  <dt className="text-xs font-semibold text-[#64748B]">도로명주소</dt>
                  <dd className="mt-1 text-sm font-bold text-[#111827]">
                    {address.roadAddressPart1}
                    {address.roadAddressPart2}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold text-[#64748B]">지번주소</dt>
                  <dd className="mt-1 text-sm font-bold text-[#111827]">
                    {address.jibunAddress}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold text-[#64748B]">도로명</dt>
                  <dd className="mt-1 text-sm font-bold text-[#111827]">
                    {address.roadName}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold text-[#64748B]">읍면동</dt>
                  <dd className="mt-1 text-sm font-bold text-[#111827]">
                    {address.eupmyeondong}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold text-[#64748B]">행정구역코드</dt>
                  <dd className="mt-1 font-mono text-sm font-bold text-[#111827]">
                    {address.adminCode}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold text-[#64748B]">건물관리번호</dt>
                  <dd className="mt-1 font-mono text-sm font-bold text-[#111827]">
                    {address.buildingCode}
                  </dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
