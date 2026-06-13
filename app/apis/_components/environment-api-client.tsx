"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CloudSun,
  DatabaseZap,
  Droplets,
  Filter,
  Loader2,
  MapPin,
  RefreshCw,
  Search,
  ShieldCheck,
  Waves,
  Wind,
  type LucideIcon,
} from "lucide-react";

export type EnvironmentControl = {
  name: string;
  label: string;
  type: "select" | "text";
  placeholder?: string;
  options?: Array<{ label: string; value: string }>;
};

export type EnvironmentPageConfig = {
  title: string;
  eyebrow: string;
  badge: string;
  description: string;
  icon: "cloud" | "wind" | "droplets" | "waves";
  endpoint: string;
  upstream: string;
  defaultParams: Record<string, string>;
  controls: EnvironmentControl[];
  emptyTitle: string;
  emptyDescription: string;
};

type EnvironmentMetric = {
  label: string;
  value: string;
  unit?: string;
};

type EnvironmentRecord = {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  timestamp: string;
  location: string;
  status: string;
  primaryLabel: string;
  primaryValue: string;
  primaryUnit?: string;
  metrics: EnvironmentMetric[];
  meta: EnvironmentMetric[];
};

type EnvironmentResponse = {
  source: "live" | "missing-key" | "fallback";
  serviceName: string;
  endpoint: string;
  notice?: string;
  currentCount: number;
  totalCount: number;
  updatedAt: string;
  records: EnvironmentRecord[];
};

const sourceText: Record<EnvironmentResponse["source"], string> = {
  live: "Live",
  "missing-key": "Key 필요",
  fallback: "Sample",
};

const iconMap: Record<EnvironmentPageConfig["icon"], LucideIcon> = {
  cloud: CloudSun,
  wind: Wind,
  droplets: Droplets,
  waves: Waves,
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

function buildRequestPath(endpoint: string, params: Record<string, string>) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value.trim()) {
      query.set(key, value.trim());
    }
  });

  const queryString = query.toString();

  return queryString ? `${endpoint}?${queryString}` : endpoint;
}

export default function EnvironmentApiClient({
  config,
}: {
  config: EnvironmentPageConfig;
}) {
  const [formParams, setFormParams] = useState(config.defaultParams);
  const [submittedParams, setSubmittedParams] = useState(config.defaultParams);
  const [data, setData] = useState<EnvironmentResponse>({
    source: "fallback",
    serviceName: config.title,
    endpoint: config.endpoint,
    currentCount: 0,
    totalCount: 0,
    updatedAt: new Date(0).toISOString(),
    records: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);

  const Icon = iconMap[config.icon];
  const requestPath = useMemo(
    () => buildRequestPath(config.endpoint, submittedParams),
    [config.endpoint, submittedParams],
  );

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
          throw new Error(`${config.title} 조회 실패: ${response.status}`);
        }

        const payload = (await response.json()) as EnvironmentResponse;
        setData(payload);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          return;
        }

        setError(
          err instanceof Error
            ? err.message
            : `${config.title} 응답을 불러오지 못했습니다.`,
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    loadData();

    return () => controller.abort();
  }, [config.title, requestPath, refreshToken]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmittedParams(formParams);
  }

  function resetFilters() {
    setFormParams(config.defaultParams);
    setSubmittedParams(config.defaultParams);
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
              {config.badge}
            </span>
          </div>

          <div className="grid gap-8 lg:grid-cols-[1fr_360px] lg:items-end">
            <div>
              <p className="inline-flex items-center gap-2 rounded-md border border-[#BFD0E8] bg-[#F4F8FF] px-3 py-2 text-sm font-semibold text-[#1E4FD7]">
                <Icon className="size-4" aria-hidden="true" />
                {config.eyebrow}
              </p>
              <h1 className="mt-5 text-4xl font-bold leading-tight text-[#0F172A] sm:text-5xl">
                {config.title}
              </h1>
              <p className="mt-5 max-w-3xl text-base leading-7 text-[#475569]">
                {config.description}
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
                  {sourceText[data.source]}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <section className="border-b border-[#DDE5EF] bg-white">
        <div className="mx-auto max-w-7xl px-5 py-5 lg:px-8">
          <form onSubmit={handleSubmit} className="grid gap-3 lg:grid-cols-4">
            {config.controls.map((control) => (
              <label
                key={control.name}
                className="flex min-h-12 items-center gap-3 rounded-md border border-[#C8D3E0] bg-white px-3"
              >
                <Filter className="size-4 shrink-0 text-[#64748B]" aria-hidden="true" />
                <span className="sr-only">{control.label}</span>
                {control.type === "select" ? (
                  <select
                    value={formParams[control.name] || ""}
                    onChange={(event) =>
                      setFormParams((current) => ({
                        ...current,
                        [control.name]: event.target.value,
                      }))
                    }
                    className="min-w-0 flex-1 bg-transparent text-sm text-[#111827] outline-none"
                  >
                    {(control.options || []).map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    value={formParams[control.name] || ""}
                    onChange={(event) =>
                      setFormParams((current) => ({
                        ...current,
                        [control.name]: event.target.value,
                      }))
                    }
                    className="min-w-0 flex-1 bg-transparent text-sm text-[#111827] outline-none placeholder:text-[#94A3B8]"
                    placeholder={control.placeholder || control.label}
                  />
                )}
              </label>
            ))}

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
                <dd className="mt-1 break-words text-[#334155]">
                  {config.upstream}
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
                {data.source === "live"
                  ? "외부 API 응답을 표시 중입니다."
                  : "샘플 데이터로 화면을 유지 중입니다."}
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
                {config.emptyTitle}
              </h2>
              <p className="mt-2 text-sm text-[#64748B]">
                {config.emptyDescription}
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
                      {record.category}
                    </span>
                    <span className="rounded-md bg-[#F3F6F8] px-2 py-1 text-xs font-bold text-[#475569]">
                      {record.status}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-md bg-[#FFF4E5] px-2 py-1 text-xs font-bold text-[#A85A00]">
                      <MapPin className="size-3" aria-hidden="true" />
                      {record.location}
                    </span>
                  </div>
                  <h2 className="mt-4 text-2xl font-bold leading-tight text-[#0F172A]">
                    {record.title}
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-[#475569]">
                    {record.subtitle}
                  </p>
                </div>

                <div className="rounded-lg border border-[#DDE5EF] bg-[#FAFBFD] px-5 py-4 text-right">
                  <p className="text-xs font-semibold text-[#64748B]">
                    {record.primaryLabel}
                  </p>
                  <p className="mt-2 text-3xl font-bold text-[#137246]">
                    {record.primaryValue}
                    {record.primaryUnit ? (
                      <span className="ml-1 text-base text-[#64748B]">
                        {record.primaryUnit}
                      </span>
                    ) : null}
                  </p>
                  <p className="mt-2 text-xs font-semibold text-[#64748B]">
                    {record.timestamp}
                  </p>
                </div>
              </div>

              <dl className="mt-5 grid gap-3 border-t border-[#EEF2F7] pt-5 sm:grid-cols-2 xl:grid-cols-4">
                {record.metrics.map((metric) => (
                  <div key={`${record.id}-${metric.label}`}>
                    <dt className="text-xs font-semibold text-[#64748B]">
                      {metric.label}
                    </dt>
                    <dd className="mt-1 text-sm font-bold text-[#111827]">
                      {metric.value}
                      {metric.unit ? (
                        <span className="ml-1 text-xs text-[#64748B]">
                          {metric.unit}
                        </span>
                      ) : null}
                    </dd>
                  </div>
                ))}
                {record.meta.map((metric) => (
                  <div key={`${record.id}-${metric.label}`}>
                    <dt className="text-xs font-semibold text-[#64748B]">
                      {metric.label}
                    </dt>
                    <dd className="mt-1 text-sm font-bold text-[#111827]">
                      {metric.value}
                      {metric.unit ? (
                        <span className="ml-1 text-xs text-[#64748B]">
                          {metric.unit}
                        </span>
                      ) : null}
                    </dd>
                  </div>
                ))}
              </dl>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
