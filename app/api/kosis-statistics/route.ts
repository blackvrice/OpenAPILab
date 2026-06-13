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

type KosisUpstreamRecord = {
  VW_CD?: string;
  VW_NM?: string;
  LIST_ID?: string;
  LIST_NM?: string;
  ORG_ID?: string;
  TBL_ID?: string;
  TBL_NM?: string;
  STAT_ID?: string;
  SEND_DE?: string;
  REC_TBL_SE?: string;
};

const KOSIS_LIST_URL = "https://kosis.kr/openapi/statisticsList.do";
const DEFAULT_KOSIS_KEY = "ZjZjOTI3MjRjNmU1YzdhZTMwOWRjNjgxN2MzNDgwNmY=";

const fallbackRecords: KosisRecord[] = [
  {
    id: "A_4",
    name: "인구총조사",
    type: "list",
    viewCode: "MT_ZTITLE",
    viewName: "국내통계 주제별",
    listId: "A_4",
    listName: "인구총조사",
    organizationId: "-",
    tableId: "-",
    tableName: "-",
    statId: "-",
    updatedAt: "-",
    recommended: "-",
  },
  {
    id: "A_7",
    name: "주민등록인구현황",
    type: "list",
    viewCode: "MT_ZTITLE",
    viewName: "국내통계 주제별",
    listId: "A_7",
    listName: "주민등록인구현황",
    organizationId: "-",
    tableId: "-",
    tableName: "-",
    statId: "-",
    updatedAt: "-",
    recommended: "-",
  },
  {
    id: "A_3",
    name: "인구동향조사",
    type: "list",
    viewCode: "MT_ZTITLE",
    viewName: "국내통계 주제별",
    listId: "A_3",
    listName: "인구동향조사",
    organizationId: "-",
    tableId: "-",
    tableName: "-",
    statId: "-",
    updatedAt: "-",
    recommended: "-",
  },
];

function toRecord(item: KosisUpstreamRecord): KosisRecord {
  const isTable = Boolean(item.TBL_ID || item.TBL_NM);
  const listName = item.LIST_NM || "";
  const tableName = item.TBL_NM || "";
  const name = tableName || listName || "통계명 없음";

  return {
    id: item.LIST_ID || item.TBL_ID || name,
    name,
    type: isTable ? "table" : "list",
    viewCode: item.VW_CD || "-",
    viewName: item.VW_NM || "-",
    listId: item.LIST_ID || "-",
    listName: listName || "-",
    organizationId: item.ORG_ID || "-",
    tableId: item.TBL_ID || "-",
    tableName: tableName || "-",
    statId: item.STAT_ID || "-",
    updatedAt: item.SEND_DE || "-",
    recommended: item.REC_TBL_SE || "-",
  };
}

function applyFilter(records: KosisRecord[], keyword: string, type: string) {
  const normalized = keyword.trim().toLowerCase();

  return records.filter((record) => {
    const targetText = [
      record.name,
      record.viewCode,
      record.viewName,
      record.listId,
      record.listName,
      record.organizationId,
      record.tableId,
      record.tableName,
      record.statId,
    ]
      .join(" ")
      .toLowerCase();
    const matchesKeyword = normalized.length === 0 || targetText.includes(normalized);
    const matchesType = type === "all" || record.type === type;

    return matchesKeyword && matchesType;
  });
}

function buildPayload({
  records,
  keyword,
  type,
  viewCode,
  parentListId,
  source,
  notice,
}: {
  records: KosisRecord[];
  keyword: string;
  type: string;
  viewCode: string;
  parentListId: string;
  source: "live" | "sample-key" | "fallback";
  notice?: string;
}) {
  const filtered = applyFilter(records, keyword, type);

  return {
    source,
    keyword,
    type,
    viewCode,
    parentListId,
    notice,
    currentCount: filtered.length,
    totalCount: records.length,
    updatedAt: new Date().toISOString(),
    records: filtered,
  };
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const keyword = requestUrl.searchParams.get("q") || "";
  const type = requestUrl.searchParams.get("type") || "all";
  const viewCode = requestUrl.searchParams.get("viewCode") || "MT_ZTITLE";
  const parentListId = requestUrl.searchParams.get("parentListId") || "A";
  const apiKey =
    process.env.KOSIS_API_KEY ||
    process.env.KOSIS_OPEN_API_KEY ||
    DEFAULT_KOSIS_KEY;
  const upstreamUrl = new URL(KOSIS_LIST_URL);

  upstreamUrl.searchParams.set("method", "getList");
  upstreamUrl.searchParams.set("apiKey", apiKey);
  upstreamUrl.searchParams.set("vwCd", viewCode);
  upstreamUrl.searchParams.set("parentListId", parentListId);
  upstreamUrl.searchParams.set("format", "json");
  upstreamUrl.searchParams.set("jsonVD", "Y");

  try {
    const response = await fetch(upstreamUrl, {
      cache: "no-store",
      headers: {
        accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`KOSIS 응답 오류: ${response.status}`);
    }

    const data = (await response.json()) as KosisUpstreamRecord[] | { err?: string };

    if (!Array.isArray(data)) {
      throw new Error("KOSIS 통계목록 응답 형식이 올바르지 않습니다.");
    }

    const records = data.map(toRecord);

    return Response.json(
      buildPayload({
        records,
        keyword,
        type,
        viewCode,
        parentListId,
        source: apiKey === DEFAULT_KOSIS_KEY ? "sample-key" : "live",
        notice:
          apiKey === DEFAULT_KOSIS_KEY
            ? "공식 개발가이드 예제 키로 통계목록을 조회합니다."
            : undefined,
      }),
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "KOSIS 통계목록 응답을 가져오지 못했습니다.";

    return Response.json(
      buildPayload({
        records: fallbackRecords,
        keyword,
        type,
        viewCode,
        parentListId,
        source: "fallback",
        notice: `${message} 샘플 통계목록으로 화면을 유지합니다.`,
      }),
    );
  }
}
