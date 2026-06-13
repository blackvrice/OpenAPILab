type PublicDataRecord = {
  id: string;
  title: string;
  organization: string;
  department: string;
  category: string;
  dataType: string;
  keywords: string[];
  updatedAt: string;
  createdAt: string;
  description: string;
  metaUrl: string;
  downloadCount: number;
  isCoreData: boolean;
  charge: string;
  shareScope: string;
};

type UpstreamRecord = {
  id?: string;
  title?: string;
  list_title?: string;
  org_nm?: string;
  dept_nm?: string;
  new_category_nm?: string;
  data_type?: string;
  keywords?: string;
  updated_at?: string;
  created_at?: string;
  desc?: string;
  meta_url?: string;
  download_cnt?: number;
  is_core_data?: string;
  is_charged?: string;
  share_scope_nm?: string;
};

type UpstreamResponse = {
  currentCount?: number;
  data?: UpstreamRecord[];
  totalCount?: number;
};

const PUBLIC_DATA_PORTAL_URL =
  "https://api.odcloud.kr/api/15077093/v1/file-data-list";
const DEFAULT_SERVICE_KEY = "data-portal-test-key";

const fallbackRecords: PublicDataRecord[] = [
  {
    id: "sample-weather-midterm",
    title: "기상청_중기예보",
    organization: "기상청",
    department: "국가기후데이터센터",
    category: "과학기술",
    dataType: "링크 데이터",
    keywords: ["동네예보", "단기예보", "날씨", "기상예보"],
    updatedAt: "2025-11-17",
    createdAt: "2020-01-08",
    description:
      "기상청에서 과거에 발표한 중기예보 자료를 제공합니다. DB 조회와 CSV 다운로드를 지원합니다.",
    metaUrl: "https://www.data.go.kr/catalog/15043491/fileData.json",
    downloadCount: 5344,
    isCoreData: true,
    charge: "무료",
    shareScope: "저작자표시",
  },
  {
    id: "sample-weather-ultra-short",
    title: "기상청_초단기예보",
    organization: "기상청",
    department: "국가기후데이터센터",
    category: "과학기술",
    dataType: "링크 데이터",
    keywords: ["초단기예보", "위험기상", "하늘상태", "예보"],
    updatedAt: "2025-11-17",
    createdAt: "2020-06-29",
    description:
      "예보시점부터 6시간 이내의 위험기상 대응을 위한 초단기예보 정보를 제공합니다.",
    metaUrl: "https://www.data.go.kr",
    downloadCount: 3210,
    isCoreData: true,
    charge: "무료",
    shareScope: "저작자표시",
  },
  {
    id: "sample-open-list",
    title: "공공데이터포털 목록개방현황",
    organization: "공공데이터활용지원센터",
    department: "공공데이터활용지원센터",
    category: "일반공공행정",
    dataType: "CSV",
    keywords: ["공공데이터포털", "개방목록", "데이터목록"],
    updatedAt: "2026-06-05",
    createdAt: "2024-01-01",
    description:
      "공공데이터포털에서 개방 중인 파일데이터와 오픈 API 목록 현황을 제공합니다.",
    metaUrl: "https://www.data.go.kr/data/15062804/fileData.do",
    downloadCount: 940,
    isCoreData: false,
    charge: "무료",
    shareScope: "이용허락범위 제한 없음",
  },
];

function cleanText(value = "") {
  return value
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function toRecord(item: UpstreamRecord): PublicDataRecord {
  return {
    id: item.id || item.list_title || item.title || crypto.randomUUID(),
    title: item.list_title || item.title || "제목 없음",
    organization: item.org_nm || "제공기관 없음",
    department: item.dept_nm || "관리부서 없음",
    category: item.new_category_nm || "분류 없음",
    dataType: item.data_type || "유형 없음",
    keywords: (item.keywords || "")
      .split(",")
      .map((keyword) => keyword.trim())
      .filter(Boolean),
    updatedAt: item.updated_at || "-",
    createdAt: item.created_at || "-",
    description: cleanText(item.desc || "설명 정보가 없습니다."),
    metaUrl: item.meta_url || "https://www.data.go.kr",
    downloadCount: Number(item.download_cnt || 0),
    isCoreData: item.is_core_data === "Y",
    charge: item.is_charged || "확인 필요",
    shareScope: item.share_scope_nm || "확인 필요",
  };
}

function applyFilters(records: PublicDataRecord[], requestUrl: URL) {
  const query = (requestUrl.searchParams.get("q") || "").trim().toLowerCase();
  const category = requestUrl.searchParams.get("category") || "all";
  const dataType = requestUrl.searchParams.get("type") || "all";

  return records.filter((record) => {
    const targetText = [
      record.title,
      record.organization,
      record.department,
      record.category,
      record.dataType,
      record.description,
      record.keywords.join(" "),
    ]
      .join(" ")
      .toLowerCase();

    const matchesQuery = query.length === 0 || targetText.includes(query);
    const matchesCategory = category === "all" || record.category === category;
    const matchesType = dataType === "all" || record.dataType === dataType;

    return matchesQuery && matchesCategory && matchesType;
  });
}

function getFilterOptions(records: PublicDataRecord[]) {
  return {
    categories: Array.from(new Set(records.map((record) => record.category))).sort(),
    dataTypes: Array.from(new Set(records.map((record) => record.dataType))).sort(),
  };
}

function buildPayload(
  records: PublicDataRecord[],
  requestUrl: URL,
  source: "live" | "fallback",
  notice?: string,
  upstreamTotal?: number,
) {
  const perPage = Number(requestUrl.searchParams.get("perPage") || 10);
  const safePerPage = Number.isFinite(perPage) ? Math.min(Math.max(perPage, 4), 20) : 10;
  const filteredRecords = applyFilters(records, requestUrl).slice(0, safePerPage);

  return {
    source,
    notice,
    currentCount: filteredRecords.length,
    totalCount: upstreamTotal ?? records.length,
    updatedAt: new Date().toISOString(),
    records: filteredRecords,
    filters: getFilterOptions(records),
  };
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const serviceKey =
    process.env.DATA_GO_KR_SERVICE_KEY ||
    process.env.PUBLIC_DATA_PORTAL_SERVICE_KEY ||
    DEFAULT_SERVICE_KEY;
  const upstreamUrl = new URL(PUBLIC_DATA_PORTAL_URL);

  upstreamUrl.searchParams.set("page", "1");
  upstreamUrl.searchParams.set("perPage", "20");
  upstreamUrl.searchParams.set("serviceKey", serviceKey);

  try {
    const response = await fetch(upstreamUrl, {
      cache: "no-store",
      headers: {
        accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`공공데이터포털 응답 오류: ${response.status}`);
    }

    const data = (await response.json()) as UpstreamResponse;
    const records = (data.data || []).map(toRecord);

    return Response.json(
      buildPayload(records, requestUrl, "live", undefined, data.totalCount),
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "공공데이터포털 응답을 가져오지 못했습니다.";

    return Response.json(
      buildPayload(
        fallbackRecords,
        requestUrl,
        "fallback",
        `${message} 샘플 데이터로 화면을 유지합니다.`,
      ),
    );
  }
}
