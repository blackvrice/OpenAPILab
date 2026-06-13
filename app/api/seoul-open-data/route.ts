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

type SeoulUpstreamRecord = {
  INF_ID?: string;
  INF_NM?: string;
  CATE_NM?: string;
  MAP_CATE_NM?: string;
  MNG_ORGAN_NAME?: string;
  MNG_STATION_NAME?: string;
  SRV_TYPE?: string;
  CHNG_LOAD_NM?: string;
  LINK_DESC?: string;
  LINK_INFO?: string;
  SHORT_URL?: string;
  MANAGER_PHONE?: string;
};

type SeoulUpstreamResponse = {
  SearchCatalogService?: {
    list_total_count?: number;
    RESULT?: {
      CODE?: string;
      MESSAGE?: string;
    };
    row?: SeoulUpstreamRecord[];
  };
  RESULT?: {
    CODE?: string;
    MESSAGE?: string;
  };
};

const SEOUL_OPEN_DATA_URL = "http://openapi.seoul.go.kr:8088";
const DEFAULT_SEOUL_KEY = "sample";

const fallbackRecords: SeoulRecord[] = [
  {
    id: "OA-12615",
    name: "서울시 강동구 명일2동 주민센터 새소식 정보",
    category: "공공데이터",
    mapCategory: "일반행정",
    provider: "강동구",
    department: "명일2동 주민센터",
    serviceType: "Sheet,Api",
    updateCycle: "수시",
    linkDescription: "자치구 주민센터 새소식",
    linkInfo: "강동구 열린데이터",
    shortUrl: "https://data.seoul.go.kr",
    managerPhone: "02-120",
  },
  {
    id: "OA-12704",
    name: "서울시 중랑구 보건소 채용 정보",
    category: "공공데이터",
    mapCategory: "문화/관광",
    provider: "중랑구",
    department: "중랑구 보건소 보건행정과",
    serviceType: "Sheet,Api",
    updateCycle: "일간",
    linkDescription: "중랑구 보건소 홈페이지",
    linkInfo: "중랑구 보건소",
    shortUrl: "https://data.seoul.go.kr",
    managerPhone: "02-2094-0722",
  },
  {
    id: "OA-SAMPLE-ADMIN",
    name: "서울시 열린데이터광장 Open API 현황",
    category: "공공데이터",
    mapCategory: "일반행정",
    provider: "서울특별시",
    department: "디지털도시국 데이터전략과",
    serviceType: "Sheet,Api",
    updateCycle: "실시간",
    linkDescription: "열린데이터광장에서 제공하는 OpenAPI 목록",
    linkInfo: "서울 열린데이터광장",
    shortUrl: "https://data.seoul.go.kr/dataList/OA-2191/S/1/datasetView.do",
    managerPhone: "02-2133-4273",
  },
];

function toRecord(item: SeoulUpstreamRecord): SeoulRecord {
  return {
    id: item.INF_ID || item.INF_NM || crypto.randomUUID(),
    name: item.INF_NM || "서비스명 없음",
    category: item.CATE_NM || "분류 없음",
    mapCategory: item.MAP_CATE_NM || "지도분류 없음",
    provider: item.MNG_ORGAN_NAME || "제공기관 없음",
    department: item.MNG_STATION_NAME || "관리부서 없음",
    serviceType: item.SRV_TYPE || "유형 없음",
    updateCycle: item.CHNG_LOAD_NM || "갱신주기 없음",
    linkDescription: item.LINK_DESC || "설명 없음",
    linkInfo: item.LINK_INFO || "링크 정보 없음",
    shortUrl: item.SHORT_URL || "https://data.seoul.go.kr",
    managerPhone: item.MANAGER_PHONE || "-",
  };
}

function applyFilter(records: SeoulRecord[], keyword: string, mapCategory: string) {
  const normalizedKeyword = keyword.trim().toLowerCase();

  return records.filter((record) => {
    const targetText = [
      record.id,
      record.name,
      record.category,
      record.mapCategory,
      record.provider,
      record.department,
      record.serviceType,
      record.linkDescription,
    ]
      .join(" ")
      .toLowerCase();
    const matchesKeyword =
      normalizedKeyword.length === 0 || targetText.includes(normalizedKeyword);
    const matchesCategory =
      mapCategory === "all" || record.mapCategory === mapCategory;

    return matchesKeyword && matchesCategory;
  });
}

function getCategories(records: SeoulRecord[]) {
  return Array.from(new Set(records.map((record) => record.mapCategory))).sort();
}

function buildPayload({
  records,
  keyword,
  mapCategory,
  source,
  totalCount,
  notice,
  code = "INFO-000",
  message = "정상 처리되었습니다",
}: {
  records: SeoulRecord[];
  keyword: string;
  mapCategory: string;
  source: "live" | "sample-key" | "fallback";
  totalCount: number;
  notice?: string;
  code?: string;
  message?: string;
}) {
  const filtered = applyFilter(records, keyword, mapCategory);

  return {
    source,
    keyword,
    mapCategory,
    notice,
    currentCount: filtered.length,
    totalCount,
    code,
    message,
    updatedAt: new Date().toISOString(),
    records: filtered,
    filters: {
      mapCategories: getCategories(records),
    },
  };
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const keyword = requestUrl.searchParams.get("q") || "";
  const mapCategory = requestUrl.searchParams.get("mapCategory") || "all";
  const startIndex = requestUrl.searchParams.get("start") || "1";
  const endIndex = requestUrl.searchParams.get("end") || "5";
  const key =
    process.env.SEOUL_OPEN_DATA_KEY ||
    process.env.SEOUL_API_KEY ||
    DEFAULT_SEOUL_KEY;
  const upstreamUrl = `${SEOUL_OPEN_DATA_URL}/${encodeURIComponent(
    key,
  )}/json/SearchCatalogService/${startIndex}/${endIndex}/`;

  try {
    const response = await fetch(upstreamUrl, {
      cache: "no-store",
      headers: {
        accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`서울 열린데이터광장 응답 오류: ${response.status}`);
    }

    const payload = (await response.json()) as SeoulUpstreamResponse;
    const service = payload.SearchCatalogService;
    const result = service?.RESULT || payload.RESULT;

    if (!service?.row || result?.CODE?.startsWith("ERROR")) {
      return Response.json(
        buildPayload({
          records: [],
          keyword,
          mapCategory,
          source: key === DEFAULT_SEOUL_KEY ? "sample-key" : "live",
          totalCount: 0,
          code: result?.CODE || "ERROR",
          message: result?.MESSAGE || "데이터가 없습니다.",
          notice: result?.MESSAGE,
        }),
      );
    }

    const records = service.row.map(toRecord);

    return Response.json(
      buildPayload({
        records,
        keyword,
        mapCategory,
        source: key === DEFAULT_SEOUL_KEY ? "sample-key" : "live",
        totalCount: Number(service.list_total_count || records.length),
        code: result?.CODE,
        message: result?.MESSAGE,
        notice:
          key === DEFAULT_SEOUL_KEY
            ? "sample 키는 요청 범위가 1~5건으로 제한됩니다."
            : undefined,
      }),
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "서울 열린데이터광장 응답을 가져오지 못했습니다.";

    return Response.json(
      buildPayload({
        records: fallbackRecords,
        keyword,
        mapCategory,
        source: "fallback",
        totalCount: fallbackRecords.length,
        code: "FALLBACK",
        message,
        notice: `${message} 샘플 데이터로 화면을 유지합니다.`,
      }),
    );
  }
}
