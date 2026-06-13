"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  BarChart3,
  Filter,
  Loader2,
  RefreshCw,
  Search,
  ShieldCheck,
  Table2,
} from "lucide-react";

type KosisRecord = {
  id: string;
  name: string;
  type: "list" | "table";
  viewCode: string;
  viewName: string;
  listId: string;
  listName: string;
  organizationId: string;
  tableId: string;
  tableName: string;
  statId: string;
  updatedAt: string;
  recommended: string;
};

type KosisResponse = {
  source: "live" | "sample-key" | "fallback";
  keyword: string;
  type: string;
  viewCode: string;
  parentListId: string;
  notice?: string;
  currentCount: number;
  totalCount: number;
  updatedAt: string;
  records: KosisRecord[];
};

const initialData: KosisResponse = {
  source: "sample-key",
  keyword: "",
  type: "all",
  viewCode: "MT_ZTITLE",
  parentListId: "A",
  currentCount: 0,
  totalCount: 0,
  updatedAt: new Date(0).toISOString(),
  records: [],
};

const viewOptions = [
  { value: "MT_ZTITLE", label: "국내통계 주제별" },
  { value: "MT_OTITLE", label: "국내통계 기관별" },
  { value: "MT_GTITLE01", label: "e-지방지표 주제별" },
];

function formatDate(value: string) {
  if (!value || value === "-") {
    return "-";
  }

  if (/^\d{8}$/.test(value)) {
    return `${value.slice(0, 4)}.${value.slice(4, 6)}.${value.slice(6, 8)}`;
  }

  return value;
}

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

function sourceLabel(source: KosisResponse["source"]) {
  if (source === "live") {
    return "Live";
  }

  if (source === "sample-key") {
    return "Guide Key";
  }

  return "Sample";
}

export default function KosisClient() {
  const [data, setData] = useState<KosisResponse>(initialData);
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [type, setType] = useState("all");
  const [viewCode, setViewCode] = useState("MT_ZTITLE");
  const [parentListId, setParentListId] = useState("A");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);

  const requestPath = useMemo(() => {
    const params = new URLSearchParams();

    if (submittedQuery.trim()) {
      params.set("q", submittedQuery.trim());
    }

    if (type !== "all") {
      params.set("type", type);
    }

    params.set("viewCode", viewCode);
    params.set("parentListId", parentListId.trim() || "A");

    return `/api/kosis-statistics?${params.toString()}`;
  }, [parentListId, submittedQuery, type, viewCode]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadStatistics() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(requestPath, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`KOSIS 조회 실패: ${response.status}`);
        }

        const payload = (await response.json()) as KosisResponse;
        setData(payload);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          return;
        }

        setError(err instanceof Error ? err.message : "KOSIS 목록을 불러오지 못했습니다.");
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    loadStatistics();

    return () => controller.abort();
  }, [requestPath, refreshToken]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmittedQuery(query);
  }

  function resetFilters() {
    setQuery("");
    setSubmittedQuery("");
    setType("all");
    setViewCode("MT_ZTITLE");
    setParentListId("A");
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
            <span className="inline-flex w-fit items-center gap-2 rounded-md bg-[#EEF1FF] px-3 py-2 text-sm font-bold text-[#3947A8]">
              <ShieldCheck className="size-4" aria-hidden="true" />
              통계목록 API 연동
            </span>
          </div>

          <div className="grid gap-8 lg:grid-cols-[1fr_360px] lg:items-end">
            <div>
              <p className="inline-flex items-center gap-2 rounded-md border border-[#BFD0E8] bg-[#F4F8FF] px-3 py-2 text-sm font-semibold text-[#1E4FD7]">
                <BarChart3 className="size-4" aria-hidden="true" />
                네 번째 Open API
              </p>
              <h1 className="mt-5 text-4xl font-bold leading-tight text-[#0F172A] sm:text-5xl">
                KOSIS 통계목록
              </h1>
              <p className="mt-5 max-w-3xl text-base leading-7 text-[#475569]">
                KOSIS 공유서비스의 통계목록 API를 사용해 서비스뷰별 목록과
                통계표를 탐색합니다. 상위 목록 ID를 바꾸면 하위 목록으로
                계속 내려갈 수 있습니다.
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
                <p className="mt-2 text-lg font-bold text-[#3947A8]">
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
            className="grid gap-3 xl:grid-cols-[1fr_220px_160px_160px_auto_auto]"
          >
            <label className="flex min-h-12 items-center gap-3 rounded-md border border-[#C8D3E0] bg-white px-3">
              <Search className="size-4 shrink-0 text-[#64748B]" aria-hidden="true" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="min-w-0 flex-1 bg-transparent text-sm text-[#111827] outline-none placeholder:text-[#94A3B8]"
                placeholder="목록명, 통계표명, 기관코드 검색"
              />
            </label>

            <label className="flex min-h-12 items-center gap-2 rounded-md border border-[#C8D3E0] bg-white px-3">
              <Filter className="size-4 text-[#64748B]" aria-hidden="true" />
              <select
                value={viewCode}
                onChange={(event) => setViewCode(event.target.value)}
                className="min-w-0 flex-1 bg-transparent text-sm text-[#111827] outline-none"
              >
                {viewOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex min-h-12 items-center gap-2 rounded-md border border-[#C8D3E0] bg-white px-3">
              <Table2 className="size-4 text-[#64748B]" aria-hidden="true" />
              <select
                value={type}
                onChange={(event) => setType(event.target.value)}
                className="min-w-0 flex-1 bg-transparent text-sm text-[#111827] outline-none"
              >
                <option value="all">전체</option>
                <option value="list">목록</option>
                <option value="table">통계표</option>
              </select>
            </label>

            <input
              aria-label="상위 목록 ID"
              value={parentListId}
              onChange={(event) => setParentListId(event.target.value)}
              className="min-h-12 rounded-md border border-[#C8D3E0] bg-white px-3 text-sm font-medium text-[#111827] outline-none"
              placeholder="A"
            />

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
                  statisticsList.do?method=getList
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
                통계목록을 가져오는 중
              </p>
            ) : (
              <p className="mt-3 text-sm leading-6 text-[#475569]">
                {data.source === "fallback"
                  ? "샘플 통계목록을 표시 중입니다."
                  : "KOSIS 통계목록 응답을 표시 중입니다."}
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
              <BarChart3 className="mx-auto size-8 text-[#94A3B8]" aria-hidden="true" />
              <h2 className="mt-4 text-xl font-bold text-[#111827]">
                조건에 맞는 통계목록이 없습니다
              </h2>
              <p className="mt-2 text-sm text-[#64748B]">
                상위 목록 ID나 검색어를 변경해 주세요.
              </p>
            </div>
          ) : null}

          {data.records.map((record) => (
            <article
              key={`${record.type}-${record.id}`}
              className="rounded-lg border border-[#DDE5EF] bg-white p-5 shadow-sm"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-md bg-[#EEF1FF] px-2 py-1 text-xs font-bold text-[#3947A8]">
                  {record.type === "table" ? "통계표" : "목록"}
                </span>
                <span className="rounded-md bg-[#F3F6F8] px-2 py-1 text-xs font-bold text-[#475569]">
                  {record.viewName}
                </span>
                <span className="rounded-md bg-[#FFF4E5] px-2 py-1 text-xs font-bold text-[#A85A00]">
                  {record.id}
                </span>
              </div>
              <h2 className="mt-4 text-2xl font-bold leading-tight text-[#0F172A]">
                {record.name}
              </h2>
              <dl className="mt-5 grid gap-3 border-t border-[#EEF2F7] pt-5 sm:grid-cols-2 xl:grid-cols-4">
                <div>
                  <dt className="text-xs font-semibold text-[#64748B]">목록 ID</dt>
                  <dd className="mt-1 font-mono text-sm font-bold text-[#111827]">
                    {record.listId}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold text-[#64748B]">기관 코드</dt>
                  <dd className="mt-1 font-mono text-sm font-bold text-[#111827]">
                    {record.organizationId}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold text-[#64748B]">통계표 ID</dt>
                  <dd className="mt-1 font-mono text-sm font-bold text-[#111827]">
                    {record.tableId}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold text-[#64748B]">최종갱신일</dt>
                  <dd className="mt-1 text-sm font-bold text-[#111827]">
                    {formatDate(record.updatedAt)}
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
