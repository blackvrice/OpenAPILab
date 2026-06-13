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

const KMA_ENDPOINT =
  "https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst";

const fallbackRecords: EnvironmentRecord[] = [
  {
    id: "seoul-0500",
    title: "서울 중구 단기예보",
    subtitle: "공공데이터포털 인증키가 설정되면 기상청 단기예보 API 응답으로 교체됩니다.",
    category: "단기예보",
    timestamp: "오늘 05:00 발표",
    location: "nx 60 / ny 127",
    status: "샘플",
    primaryLabel: "하늘상태",
    primaryValue: "구름많음",
    metrics: [
      { label: "기온", value: "24", unit: "도" },
      { label: "강수확률", value: "30", unit: "%" },
      { label: "습도", value: "63", unit: "%" },
      { label: "풍속", value: "2.1", unit: "m/s" },
    ],
    meta: [
      { label: "예보일자", value: "KST 기준" },
      { label: "데이터", value: "TMP, SKY, POP, REH" },
    ],
  },
  {
    id: "busan-0500",
    title: "부산 해운대 단기예보",
    subtitle: "격자 좌표를 바꾸면 다른 읍면동 예보로 확장할 수 있습니다.",
    category: "단기예보",
    timestamp: "오늘 05:00 발표",
    location: "nx 99 / ny 75",
    status: "샘플",
    primaryLabel: "하늘상태",
    primaryValue: "맑음",
    metrics: [
      { label: "기온", value: "26", unit: "도" },
      { label: "강수확률", value: "10", unit: "%" },
      { label: "습도", value: "68", unit: "%" },
      { label: "풍속", value: "3.4", unit: "m/s" },
    ],
    meta: [
      { label: "예보일자", value: "KST 기준" },
      { label: "데이터", value: "동네예보 격자" },
    ],
  },
];

const categoryLabels: Record<string, string> = {
  TMP: "1시간 기온",
  TMN: "아침 최저기온",
  TMX: "낮 최고기온",
  SKY: "하늘상태",
  PTY: "강수형태",
  POP: "강수확률",
  PCP: "1시간 강수량",
  REH: "습도",
  WSD: "풍속",
  VEC: "풍향",
};

const skyLabels: Record<string, string> = {
  "1": "맑음",
  "3": "구름많음",
  "4": "흐림",
};

const precipitationLabels: Record<string, string> = {
  "0": "없음",
  "1": "비",
  "2": "비/눈",
  "3": "눈",
  "4": "소나기",
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

  return "";
}

function getItems(payload: unknown): UnknownRecord[] {
  const response = getRecord(payload, "response");
  const body = getRecord(response, "body");
  const items = getRecord(body, "items");
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

function getKmaKey() {
  return (
    process.env.KMA_SERVICE_KEY ||
    process.env.KMA_OPEN_API_KEY ||
    process.env.PUBLIC_DATA_SERVICE_KEY ||
    ""
  );
}

function displayValue(category: string, value: string) {
  if (category === "SKY") {
    return skyLabels[value] || value;
  }

  if (category === "PTY") {
    return precipitationLabels[value] || value;
  }

  return value;
}

function metricUnit(category: string) {
  if (category === "TMP" || category === "TMN" || category === "TMX") {
    return "도";
  }

  if (category === "POP" || category === "REH") {
    return "%";
  }

  if (category === "WSD") {
    return "m/s";
  }

  return undefined;
}

function toRecords(items: UnknownRecord[], nx: string, ny: string) {
  const grouped = new Map<string, EnvironmentRecord>();

  items.forEach((item) => {
    const forecastDate = getString(item, "fcstDate");
    const forecastTime = getString(item, "fcstTime");
    const baseDate = getString(item, "baseDate");
    const baseTime = getString(item, "baseTime");
    const category = getString(item, "category");
    const value = displayValue(category, getString(item, "fcstValue"));
    const key = `${forecastDate}-${forecastTime}`;
    const label = categoryLabels[category] || category || "예보값";
    const metric = {
      label,
      value: value || "-",
      unit: metricUnit(category),
    };

    if (!grouped.has(key)) {
      grouped.set(key, {
        id: key,
        title: `${forecastDate || "예보일"} ${forecastTime || "예보시"} 예보`,
        subtitle: `기상청 단기예보 격자 좌표 ${nx}, ${ny}의 시간대별 예보입니다.`,
        category: "단기예보",
        timestamp: `${baseDate || "-"} ${baseTime || "-"} 발표`,
        location: `nx ${nx} / ny ${ny}`,
        status: "실시간",
        primaryLabel: "기온",
        primaryValue: "-",
        metrics: [],
        meta: [
          { label: "예보일", value: forecastDate || "-" },
          { label: "예보시각", value: forecastTime || "-" },
        ],
      });
    }

    const record = grouped.get(key);

    if (!record) {
      return;
    }

    if (category === "TMP") {
      record.primaryValue = value || "-";
      record.primaryUnit = "도";
    }

    if (category === "SKY" && record.primaryValue === "-") {
      record.primaryLabel = "하늘상태";
      record.primaryValue = value || "-";
      record.primaryUnit = undefined;
    }

    if (["TMP", "SKY", "POP", "REH", "WSD", "PTY"].includes(category)) {
      record.metrics.push(metric);
    }
  });

  return Array.from(grouped.values()).slice(0, 8);
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
    serviceName: "기상청 단기예보",
    endpoint: "/api/weather-forecast",
    notice,
    currentCount: records.length,
    totalCount,
    updatedAt: new Date().toISOString(),
    records,
  };
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const nx = requestUrl.searchParams.get("nx") || "60";
  const ny = requestUrl.searchParams.get("ny") || "127";
  const baseDate = requestUrl.searchParams.get("baseDate") || "20260613";
  const baseTime = requestUrl.searchParams.get("baseTime") || "0500";
  const serviceKey = getKmaKey();

  if (!serviceKey) {
    return Response.json(
      buildPayload({
        source: "missing-key",
        records: fallbackRecords,
        totalCount: fallbackRecords.length,
        notice:
          "KMA_SERVICE_KEY 또는 PUBLIC_DATA_SERVICE_KEY 환경변수를 설정하면 기상청 단기예보 API를 호출합니다.",
      }),
    );
  }

  const upstreamUrl = new URL(KMA_ENDPOINT);
  upstreamUrl.searchParams.set("ServiceKey", serviceKey);
  upstreamUrl.searchParams.set("pageNo", "1");
  upstreamUrl.searchParams.set("numOfRows", "1000");
  upstreamUrl.searchParams.set("dataType", "JSON");
  upstreamUrl.searchParams.set("base_date", baseDate);
  upstreamUrl.searchParams.set("base_time", baseTime);
  upstreamUrl.searchParams.set("nx", nx);
  upstreamUrl.searchParams.set("ny", ny);

  try {
    const response = await fetch(upstreamUrl, {
      cache: "no-store",
      headers: { accept: "application/json" },
    });

    if (!response.ok) {
      throw new Error(`기상청 응답 오류: ${response.status}`);
    }

    const payload = (await response.json()) as unknown;
    const records = toRecords(getItems(payload), nx, ny);

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
        : "기상청 단기예보 응답을 가져오지 못했습니다.";

    return Response.json(
      buildPayload({
        source: "fallback",
        records: fallbackRecords,
        totalCount: fallbackRecords.length,
        notice: `${message} 샘플 예보로 화면을 유지합니다.`,
      }),
    );
  }
}
