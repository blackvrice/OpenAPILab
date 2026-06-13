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

const AIR_KOREA_ENDPOINT =
  "https://apis.data.go.kr/B552584/ArpltnInforInqireSvc/getCtprvnRltmMesureDnsty";

const fallbackRecords: EnvironmentRecord[] = [
  {
    id: "seoul-jongno",
    title: "종로구 측정소",
    subtitle: "시도별 실시간 대기오염정보 조회 화면의 샘플 데이터입니다.",
    category: "대기오염",
    timestamp: "최근 1시간",
    location: "서울",
    status: "보통",
    primaryLabel: "통합대기",
    primaryValue: "보통",
    metrics: [
      { label: "PM10", value: "36", unit: "㎍/㎥" },
      { label: "PM2.5", value: "18", unit: "㎍/㎥" },
      { label: "O3", value: "0.031", unit: "ppm" },
      { label: "NO2", value: "0.018", unit: "ppm" },
    ],
    meta: [
      { label: "CO", value: "0.4", unit: "ppm" },
      { label: "SO2", value: "0.003", unit: "ppm" },
    ],
  },
  {
    id: "busan-haeundae",
    title: "해운대 측정소",
    subtitle: "AIRKOREA_SERVICE_KEY가 있으면 실제 에어코리아 응답으로 표시됩니다.",
    category: "대기오염",
    timestamp: "최근 1시간",
    location: "부산",
    status: "좋음",
    primaryLabel: "통합대기",
    primaryValue: "좋음",
    metrics: [
      { label: "PM10", value: "21", unit: "㎍/㎥" },
      { label: "PM2.5", value: "10", unit: "㎍/㎥" },
      { label: "O3", value: "0.039", unit: "ppm" },
      { label: "NO2", value: "0.012", unit: "ppm" },
    ],
    meta: [
      { label: "CO", value: "0.3", unit: "ppm" },
      { label: "SO2", value: "0.002", unit: "ppm" },
    ],
  },
];

const gradeLabels: Record<string, string> = {
  "1": "좋음",
  "2": "보통",
  "3": "나쁨",
  "4": "매우나쁨",
};

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getRecord(value: unknown, key: string) {
  return isRecord(value) ? value[key] : undefined;
}

function getString(value: UnknownRecord, key: string) {
  const item = value[key];

  if (typeof item === "string" || typeof item === "number") {
    return String(item);
  }

  return "-";
}

function getItems(payload: unknown): UnknownRecord[] {
  const response = getRecord(payload, "response");
  const body = getRecord(response, "body");
  const items = getRecord(body, "items");

  if (Array.isArray(items)) {
    return items.filter(isRecord);
  }

  const item = getRecord(items, "item");

  if (Array.isArray(item)) {
    return item.filter(isRecord);
  }

  return isRecord(item) ? [item] : [];
}

function getTotalCount(payload: unknown, fallback: number) {
  const response = getRecord(payload, "response");
  const body = getRecord(response, "body");
  const totalCount = getRecord(body, "totalCount");

  return Number(totalCount || fallback);
}

function getAirKoreaKey() {
  return (
    process.env.AIRKOREA_SERVICE_KEY ||
    process.env.AIR_KOREA_SERVICE_KEY ||
    process.env.PUBLIC_DATA_SERVICE_KEY ||
    ""
  );
}

function toRecords(items: UnknownRecord[], sidoName: string): EnvironmentRecord[] {
  return items.slice(0, 10).map((item, index) => {
    const grade = getString(item, "khaiGrade");
    const stationName = getString(item, "stationName");
    const gradeLabel = gradeLabels[grade] || grade || "-";

    return {
      id: `${stationName}-${index}`,
      title: `${stationName} 측정소`,
      subtitle: "에어코리아 시도별 실시간 측정정보입니다.",
      category: "대기오염",
      timestamp: getString(item, "dataTime"),
      location: sidoName,
      status: gradeLabel,
      primaryLabel: "통합대기",
      primaryValue: gradeLabel,
      metrics: [
        { label: "PM10", value: getString(item, "pm10Value"), unit: "㎍/㎥" },
        { label: "PM2.5", value: getString(item, "pm25Value"), unit: "㎍/㎥" },
        { label: "O3", value: getString(item, "o3Value"), unit: "ppm" },
        { label: "NO2", value: getString(item, "no2Value"), unit: "ppm" },
      ],
      meta: [
        { label: "CO", value: getString(item, "coValue"), unit: "ppm" },
        { label: "SO2", value: getString(item, "so2Value"), unit: "ppm" },
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
    serviceName: "에어코리아",
    endpoint: "/api/air-korea",
    notice,
    currentCount: records.length,
    totalCount,
    updatedAt: new Date().toISOString(),
    records,
  };
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const sidoName = requestUrl.searchParams.get("sidoName") || "서울";
  const numOfRows = requestUrl.searchParams.get("numOfRows") || "10";
  const serviceKey = getAirKoreaKey();

  if (!serviceKey) {
    return Response.json(
      buildPayload({
        source: "missing-key",
        records: fallbackRecords,
        totalCount: fallbackRecords.length,
        notice:
          "AIRKOREA_SERVICE_KEY 또는 PUBLIC_DATA_SERVICE_KEY 환경변수를 설정하면 에어코리아 API를 호출합니다.",
      }),
    );
  }

  const upstreamUrl = new URL(AIR_KOREA_ENDPOINT);
  upstreamUrl.searchParams.set("serviceKey", serviceKey);
  upstreamUrl.searchParams.set("returnType", "json");
  upstreamUrl.searchParams.set("numOfRows", numOfRows);
  upstreamUrl.searchParams.set("pageNo", "1");
  upstreamUrl.searchParams.set("sidoName", sidoName);
  upstreamUrl.searchParams.set("ver", "1.0");

  try {
    const response = await fetch(upstreamUrl, {
      cache: "no-store",
      headers: { accept: "application/json" },
    });

    if (!response.ok) {
      throw new Error(`에어코리아 응답 오류: ${response.status}`);
    }

    const payload = (await response.json()) as unknown;
    const records = toRecords(getItems(payload), sidoName);

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
        : "에어코리아 응답을 가져오지 못했습니다.";

    return Response.json(
      buildPayload({
        source: "fallback",
        records: fallbackRecords,
        totalCount: fallbackRecords.length,
        notice: `${message} 샘플 대기질 데이터로 화면을 유지합니다.`,
      }),
    );
  }
}
