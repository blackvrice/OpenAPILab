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

const WATER_QUALITY_ENDPOINT =
  "https://apis.data.go.kr/1480523/WaterQualityService/getRadioActiveMaterList";

const fallbackRecords: EnvironmentRecord[] = [
  {
    id: "han-river",
    title: "한강 수질측정망",
    subtitle: "국가수질자동측정망과 수질 DB 화면 구성을 위한 샘플입니다.",
    category: "수질",
    timestamp: "최근 측정",
    location: "한강권역",
    status: "관심",
    primaryLabel: "pH",
    primaryValue: "7.4",
    metrics: [
      { label: "수온", value: "21.2", unit: "도" },
      { label: "DO", value: "8.1", unit: "mg/L" },
      { label: "탁도", value: "3.8", unit: "NTU" },
      { label: "TOC", value: "2.1", unit: "mg/L" },
    ],
    meta: [
      { label: "측정소", value: "팔당" },
      { label: "자료", value: "샘플" },
    ],
  },
  {
    id: "nakdong-river",
    title: "낙동강 수질측정망",
    subtitle: "WATER_QUALITY_SERVICE_KEY가 있으면 수질 DB API 응답으로 교체됩니다.",
    category: "수질",
    timestamp: "최근 측정",
    location: "낙동강권역",
    status: "정상",
    primaryLabel: "pH",
    primaryValue: "7.1",
    metrics: [
      { label: "수온", value: "23.0", unit: "도" },
      { label: "DO", value: "7.5", unit: "mg/L" },
      { label: "탁도", value: "5.2", unit: "NTU" },
      { label: "TOC", value: "2.8", unit: "mg/L" },
    ],
    meta: [
      { label: "측정소", value: "물금" },
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

function getWaterQualityKey() {
  return (
    process.env.WATER_QUALITY_SERVICE_KEY ||
    process.env.WATER_SERVICE_KEY ||
    process.env.PUBLIC_DATA_SERVICE_KEY ||
    ""
  );
}

function toRecords(items: UnknownRecord[]): EnvironmentRecord[] {
  return items.slice(0, 10).map((item, index) => {
    const stationCode = getString(item, "ptNo");
    const stationName = getString(item, "ptNm");

    return {
      id: `${stationCode}-${index}`,
      title: stationName === "-" ? `수질측정 지점 ${index + 1}` : stationName,
      subtitle: "국립환경과학원 수질 DB 조회 결과입니다.",
      category: "수질 DB",
      timestamp: getString(item, "wmcymd"),
      location: stationCode,
      status: "조회",
      primaryLabel: "대표값",
      primaryValue: getString(item, "act1"),
      metrics: [
        { label: "Cs-134", value: getString(item, "act1") },
        { label: "Cs-137", value: getString(item, "act2") },
        { label: "I-131", value: getString(item, "act3") },
      ],
      meta: [
        { label: "지점코드", value: stationCode },
        { label: "행번호", value: getString(item, "rn") },
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
    serviceName: "환경공단 수질",
    endpoint: "/api/water-quality",
    notice,
    currentCount: records.length,
    totalCount,
    updatedAt: new Date().toISOString(),
    records,
  };
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const fromYear = requestUrl.searchParams.get("fromYear") || "2024";
  const toYear = requestUrl.searchParams.get("toYear") || fromYear;
  const ptNoList = requestUrl.searchParams.get("ptNoList") || "1003A05";
  const serviceKey = getWaterQualityKey();

  if (!serviceKey) {
    return Response.json(
      buildPayload({
        source: "missing-key",
        records: fallbackRecords,
        totalCount: fallbackRecords.length,
        notice:
          "WATER_QUALITY_SERVICE_KEY 또는 PUBLIC_DATA_SERVICE_KEY 환경변수를 설정하면 수질 DB API를 호출합니다.",
      }),
    );
  }

  const upstreamUrl = new URL(WATER_QUALITY_ENDPOINT);
  upstreamUrl.searchParams.set("ServiceKey", serviceKey);
  upstreamUrl.searchParams.set("pageNo", "1");
  upstreamUrl.searchParams.set("numOfRows", "10");
  upstreamUrl.searchParams.set("resultType", "JSON");
  upstreamUrl.searchParams.set("from_wmyr", fromYear);
  upstreamUrl.searchParams.set("to_wmyr", toYear);
  upstreamUrl.searchParams.set("ptNoList", ptNoList);

  try {
    const response = await fetch(upstreamUrl, {
      cache: "no-store",
      headers: { accept: "application/json" },
    });

    if (!response.ok) {
      throw new Error(`수질 DB 응답 오류: ${response.status}`);
    }

    const payload = (await response.json()) as unknown;
    const records = toRecords(getItems(payload));

    return Response.json(
      buildPayload({
        source: "live",
        records,
        totalCount: getTotalCount(payload, records.length),
      }),
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "수질 DB 응답을 가져오지 못했습니다.";

    return Response.json(
      buildPayload({
        source: "fallback",
        records: fallbackRecords,
        totalCount: fallbackRecords.length,
        notice: `${message} 샘플 수질 데이터로 화면을 유지합니다.`,
      }),
    );
  }
}
