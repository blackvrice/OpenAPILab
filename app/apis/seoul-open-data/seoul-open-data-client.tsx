"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  DatabaseZap,
  Filter,
  Loader2,
  RefreshCw,
  Search,
  ShieldCheck,
} from "lucide-react";

type SeoulRecord = {
  id: string;
  name: string;
  category: string;
  mapCategory: string;
  provider: string;
  department: string;
  serviceType: string;
  updateCycle: string;
  linkDescription: string;
  linkInfo: string;
  shortUrl: string;
  managerPhone: string;
};

type SeoulResponse = {
  source: "live" | "sample-key" | "fallback";
  keyword: string;
  mapCategory: string;
  notice?: string;
  currentCount: number;
  totalCount: number;
  code: string;
  message: string;
  updatedAt: string;
  records: SeoulRecord[];
  filters: {
    mapCategories: string[];
  };
};

const initialData: SeoulResponse = {
  source: "sample-key",
  keyword: "",
  mapCategory: "all",
  currentCount: 0,
  totalCount: 0,
  code: "INIT",
  message: "초기 상태",
  updatedAt: new Date(0).toISOString(),
  records: [],
  filters: {
    mapCategories: [],
  },
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

function formatNumber(value: number) {
  return new Intl.NumberFormat("ko-KR").format(value);
}

function sourceLabel(source: SeoulResponse["source"]) {
  if (source === "live") {
    return "Live";
  }

  if (source === "sample-key") {
    return "Sample Key";
  }

  return "Sample";
}

export default function SeoulOpenDataClient() {
  const [data, setData] = useState<SeoulResponse>(initialData);
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [mapCategory, setMapCategory] = useState("all");
  const [endIndex, setEndIndex] = useState("5");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);

  const requestPath = useMemo(() => {
    const params = new URLSearchParams();

    if (submittedQuery.trim()) {
      params.set("q", submittedQuery.trim());
    }

    if (mapCategory !== "all") {
      params.set("mapCategory", mapCategory);
    }

    params.set("start", "1");
    params.set("end", endIndex);

    return `/api/seoul-open-data?${params.toString()}`;
  }, [endIndex, mapCategory, submittedQuery]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadData() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(requestPath, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`서울 열린데이터 조회 실패: ${response.status}`);
        }

        const payload = (await response.json()) as SeoulResponse;
        setData(payload);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          return;
        }

        setError(
          err instanceof Error
            ? err.message
            : "서울 열린데이터를 불러오지 못했습니다.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    loadData();

    return () => controller.abort();
  }, [requestPath, refreshToken]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmittedQuery(query);
  }

  function resetFilters() {
    setQuery("");
    setSubmittedQuery("");
    setMapCategory("all");
    setEndIndex("5");
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
            <span className="inline-flex w-fit items-center gap-2 rounded-md bg-[#EAF8EF] px-3 py-2 text-sm font-bold text-[#137246]">
              <ShieldCheck className="size-4" aria-hidden="true" />
              sample 키로 5건 조회 가능
            </span>
          </div>

          <div className="grid gap-8 lg:grid-cols-[1fr_360px] lg:items-end">
            <div>
              <p className="inline-flex items-center gap-2 rounded-md border border-[#BFD0E8] bg-[#F4F8FF] px-3 py-2 text-sm font-semibold text-[#1E4FD7]">
                <DatabaseZap className="size-4" aria-hidden="true" />
                세 번째 Open API
              </p>
              <h1 className="mt-5 text-4xl font-bold leading-tight text-[#0F172A] sm:text-5xl">
                서울 열린데이터광장
              </h1>
              <p className="mt-5 max-w-3xl text-base leading-7 text-[#475569]">
                서울 열린데이터광장의 Open API 목록을 조회하고, 서비스명,
                제공기관, 관리부서, 갱신주기, 서비스 유형을 빠르게 확인합니다.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg border border-[#DDE5EF] bg-[#FAFBFD] p-4">
                <p className="text-xs font-semibold text-[#64748B]">표시</p>
                <p className="mt-2 text-2xl font-bold text-[#111827]">
                  {formatNumber(data.currentCount)}
                </p>
              </div>
              <div className="rounded-lg border border-[#DDE5EF] bg-[#FAFBFD] p-4">
                <p className="text-xs font-semibold text-[#64748B]">전체</p>
                <p className="mt-2 text-2xl font-bold text-[#111827]">
                  {formatNumber(data.totalCount)}
                </p>
              </div>
              <div className="rounded-lg border border-[#DDE5EF] bg-[#FAFBFD] p-4">
                <p className="text-xs font-semibold text-[#64748B]">모드</p>
                <p className="mt-2 text-lg font-bold text-[#137246]">
                  {sourceLabel(data.source)}
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
            className="grid gap-3 lg:grid-cols-[1fr_220px_120px_auto_auto]"
          >
            <label className="flex min-h-12 items-center gap-3 rounded-md border border-[#C8D3E0] bg-white px-3">
              <Search className="size-4 shrink-0 text-[#64748B]" aria-hidden="true" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="min-w-0 flex-1 bg-transparent text-sm text-[#111827] outline-none placeholder:text-[#94A3B8]"
                placeholder="서비스명, 제공기관, 부서 검색"
              />
            </label>

            <label className="flex min-h-12 items-center gap-2 rounded-md border border-[#C8D3E0] bg-white px-3">
              <Filter className="size-4 text-[#64748B]" aria-hidden="true" />
              <select
                value={mapCategory}
                onChange={(event) => setMapCategory(event.target.value)}
                className="min-w-0 flex-1 bg-transparent text-sm text-[#111827] outline-none"
              >
                <option value="all">전체 분야</option>
                {data.filters.mapCategories.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <select
              aria-label="조회 범위"
              value={endIndex}
              onChange={(event) => setEndIndex(event.target.value)}
              className="min-h-12 rounded-md border border-[#C8D3E0] bg-white px-3 text-sm font-medium text-[#111827] outline-none"
            >
              <option value="3">3건</option>
              <option value="5">5건</option>
            </select>

            <button className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-[#1E4FD7] px-5 text-sm font-semibold text-white hover:bg-[#193FAA]">
              <Search className="size-4" aria-hidden="true" />
              조회
            </button>

            <button
              type="button"
              onClick={resetFilters}
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
                  SearchCatalogService
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
                데이터를 가져오는 중
              </p>
            ) : (
              <p className="mt-3 text-sm leading-6 text-[#475569]">
                {data.message || "서울 열린데이터광장 응답을 표시 중입니다."}
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
        </aside>

        <div className="space-y-4">
          {data.records.length === 0 && !isLoading ? (
            <div className="rounded-lg border border-[#DDE5EF] bg-white p-8 text-center">
              <DatabaseZap className="mx-auto size-8 text-[#94A3B8]" aria-hidden="true" />
              <h2 className="mt-4 text-xl font-bold text-[#111827]">
                조건에 맞는 서비스가 없습니다
              </h2>
              <p className="mt-2 text-sm text-[#64748B]">
                검색어를 줄이거나 분야 필터를 초기화해 주세요.
              </p>
            </div>
          ) : null}

          {data.records.map((record) => (
            <article
              key={record.id}
              className="rounded-lg border border-[#DDE5EF] bg-white p-5 shadow-sm"
            >
              <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-md bg-[#EAF2FF] px-2 py-1 text-xs font-bold text-[#1452A4]">
                      {record.id}
                    </span>
                    <span className="rounded-md bg-[#F3F6F8] px-2 py-1 text-xs font-bold text-[#475569]">
                      {record.mapCategory}
                    </span>
                    <span className="rounded-md bg-[#FFF4E5] px-2 py-1 text-xs font-bold text-[#A85A00]">
                      {record.serviceType}
                    </span>
                  </div>
                  <h2 className="mt-4 text-2xl font-bold leading-tight text-[#0F172A]">
                    {record.name}
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-[#475569]">
                    {record.linkDescription}
                  </p>
                </div>

                <a
                  href={record.shortUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-md bg-[#111827] px-4 text-sm font-semibold text-white hover:bg-[#263244]"
                >
                  원문 보기
                  <ArrowUpRight className="size-4" aria-hidden="true" />
                </a>
              </div>

              <dl className="mt-5 grid gap-3 border-t border-[#EEF2F7] pt-5 sm:grid-cols-2 xl:grid-cols-4">
                <div>
                  <dt className="text-xs font-semibold text-[#64748B]">제공기관</dt>
                  <dd className="mt-1 text-sm font-bold text-[#111827]">
                    {record.provider}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold text-[#64748B]">관리부서</dt>
                  <dd className="mt-1 text-sm font-bold text-[#111827]">
                    {record.department}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold text-[#64748B]">갱신주기</dt>
                  <dd className="mt-1 text-sm font-bold text-[#111827]">
                    {record.updateCycle}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold text-[#64748B]">문의</dt>
                  <dd className="mt-1 text-sm font-bold text-[#111827]">
                    {record.managerPhone}
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
