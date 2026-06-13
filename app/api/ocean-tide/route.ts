type Metric = {
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
  metrics: Metric[];
  meta: Metric[];
};

type UnknownRecord = Record<string, unknown>;

const OCEAN_TIDE_ENDPOINT =
  "https://apis.data.go.kr/1192136/tideFcstHghLw/GetTideFcstHghLwApiService";

const fallbackRecords: EnvironmentRecord[] = [
  {
    id: "busan-high",
    title: "부산 조석예보",
    subtitle: "국립해양조사원 조석예보 고조/저조 화면의 샘플 데이터입니다.",
    category: "고조",
    timestamp: "2026-06-13 09:34",
    location: "부산",
    status: "예보",
    primaryLabel: "예측조위",
    primaryValue: "112",
    primaryUnit: "cm",
    metrics: [
      { label: "극치", value: "고조" },
      { label: "위도", value: "35.096" },
      { label: "경도", value: "129.035" },
    ],
    meta: [
      { label: "예보지점", value: "DT_0005" },
      { label: "자료", value: "샘플" },
    ],
  },
  {
    id: "busan-low",
    title: "부산 조석예보",
    subtitle: "OCEAN_TIDE_SERVICE_KEY가 있으면 실제 조석예보 응답으로 표시됩니다.",
    category: "저조",
    timestamp: "2026-06-13 15:48",
    location: "부산",
    status: "예보",
    primaryLabel: "예측조위",
    primaryValue: "23",
    primaryUnit: "cm",
    metrics: [
      { label: "극치", value: "저조" },
      { label: "위도", value: "35.096" },
      { label: "경도", value: "129.035" },
    ],
    meta: [
      { label: "예보지점", value: "DT_0005" },
      { label: "자료", value: "샘플" },
    ],
  },
];

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getRecord(value: unknown, key: string) {
  return isRecord(value) ? value[key] : undefined;
}

function getString(value: UnknownRecord, keys: string | string[]) {
  const keyList = Array.isArray(keys) ? keys : [keys];

  for (const key of keyList) {
    const item = value[key];

    if (typeof item === "string" || typeof item === "number") {
      return String(item);
    }
  }

  return "-";
}

function getItems(payload: unknown): UnknownRecord[] {
  const response = getRecord(payload, "response");
  const body = getRecord(response, "body");
  const items = getRecord(body, "items");
  const item = getRecord(items, "item");

  if (Array.isArray(item)) {
    return item.filter(isRecord);
  }

  if (Array.isArray(items)) {
    return items.filter(isRecord);
  }

  return isRecord(item) ? [item] : [];
}

function getTotalCount(payload: unknown, fallback: number) {
  const response = getRecord(payload, "response");
  const body = getRecord(response, "body");
  const totalCount = getRecord(body, "totalCount");

  return Number(totalCount || fallback);
}

function getOceanTideKey() {
  return (
    process.env.OCEAN_TIDE_SERVICE_KEY ||
    process.env.KHOA_SERVICE_KEY ||
    process.env.PUBLIC_DATA_SERVICE_KEY ||
    ""
  );
}

function toRecords(items: UnknownRecord[], stationCode: string): EnvironmentRecord[] {
  return items.slice(0, 10).map((item, index) => {
    const location = getString(item, ["tideFcstNm", "obsNm", "stationName"]);
    const tideType = getString(item, ["hlCode", "tideType", "tideDiv"]);

    return {
      id: `${stationCode}-${index}`,
      title: `${location} 조석예보`,
      subtitle: "국립해양조사원 조석예보 고조/저조 조회 결과입니다.",
      category: tideType,
      timestamp: getString(item, ["tphTime", "predTime", "fcstTime"]),
      location,
      status: "예보",
      primaryLabel: "예측조위",
      primaryValue: getString(item, ["tphLevel", "predLevel", "tideLevel"]),
      primaryUnit: "cm",
      metrics: [
        { label: "극치", value: tideType },
        { label: "위도", value: getString(item, ["lat", "latitude"]) },
        { label: "경도", value: getString(item, ["lon", "longitude"]) },
      ],
      meta: [
        { label: "예보지점", value: stationCode },
        { label: "순번", value: String(index + 1) },
      ],
    };
  });
}

function buildPayload({
  source,
  records,
  totalCount,
  notice,
}: {
  source: "live" | "missing-key" | "fallback";
  records: EnvironmentRecord[];
  totalCount: number;
  notice?: string;
}) {
  return {
    source,
    serviceName: "해양 조석",
    endpoint: "/api/ocean-tide",
    notice,
    currentCount: records.length,
    totalCount,
    updatedAt: new Date().toISOString(),
    records,
  };
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const stationCode = requestUrl.searchParams.get("stationCode") || "DT_0005";
  const date = requestUrl.searchParams.get("date") || "20260613";
  const serviceKey = getOceanTideKey();

  if (!serviceKey) {
    return Response.json(
      buildPayload({
        source: "missing-key",
        records: fallbackRecords,
        totalCount: fallbackRecords.length,
        notice:
          "OCEAN_TIDE_SERVICE_KEY 또는 PUBLIC_DATA_SERVICE_KEY 환경변수를 설정하면 국립해양조사원 조석예보 API를 호출합니다.",
      }),
    );
  }

  const upstreamUrl = new URL(OCEAN_TIDE_ENDPOINT);
  upstreamUrl.searchParams.set("serviceKey", serviceKey);
  upstreamUrl.searchParams.set("pageNo", "1");
  upstreamUrl.searchParams.set("numOfRows", "10");
  upstreamUrl.searchParams.set("_type", "json");
  upstreamUrl.searchParams.set("tideFcstCode", stationCode);
  upstreamUrl.searchParams.set("date", date);

  try {
    const response = await fetch(upstreamUrl, {
      cache: "no-store",
      headers: { accept: "application/json" },
    });

    if (!response.ok) {
      throw new Error(`조석예보 응답 오류: ${response.status}`);
    }

    const payload = (await response.json()) as unknown;
    const records = toRecords(getItems(payload), stationCode);

    return Response.json(
      buildPayload({
        source: "live",
        records,
        totalCount: getTotalCount(payload, records.length),
      }),
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "조석예보 응답을 가져오지 못했습니다.";

    return Response.json(
      buildPayload({
        source: "fallback",
        records: fallbackRecords,
        totalCount: fallbackRecords.length,
        notice: `${message} 샘플 조석예보로 화면을 유지합니다.`,
      }),
    );
  }
}
