type AddressRecord = {
  id: string;
  roadAddress: string;
  roadAddressPart1: string;
  roadAddressPart2: string;
  jibunAddress: string;
  englishAddress: string;
  zipCode: string;
  sido: string;
  sigungu: string;
  eupmyeondong: string;
  roadName: string;
  buildingName: string;
  adminCode: string;
  roadCode: string;
  buildingCode: string;
};

type JusoAddress = {
  roadAddr?: string;
  roadAddrPart1?: string;
  roadAddrPart2?: string;
  jibunAddr?: string;
  engAddr?: string;
  zipNo?: string;
  siNm?: string;
  sggNm?: string;
  emdNm?: string;
  rn?: string;
  bdNm?: string;
  admCd?: string;
  rnMgtSn?: string;
  bdMgtSn?: string;
};

type JusoResponse = {
  results?: {
    common?: {
      errorMessage?: string;
      countPerPage?: string;
      totalCount?: string;
      errorCode?: string;
      currentPage?: string;
    };
    juso?: JusoAddress[] | null;
  };
};

const JUSO_API_URL = "https://business.juso.go.kr/addrlink/addrLinkApi.do";

const fallbackAddresses: AddressRecord[] = [
  {
    id: "sample-seoul-city-hall",
    roadAddress: "서울특별시 중구 세종대로 110 (태평로1가)",
    roadAddressPart1: "서울특별시 중구 세종대로 110",
    roadAddressPart2: " (태평로1가)",
    jibunAddress: "서울특별시 중구 태평로1가 31 서울특별시청",
    englishAddress: "110 Sejong-daero, Jung-gu, Seoul",
    zipCode: "04524",
    sido: "서울특별시",
    sigungu: "중구",
    eupmyeondong: "태평로1가",
    roadName: "세종대로",
    buildingName: "서울특별시청",
    adminCode: "1114010300",
    roadCode: "111402005001",
    buildingCode: "1114010300100310000000001",
  },
  {
    id: "sample-gwanghwamun",
    roadAddress: "서울특별시 종로구 세종대로 172 (세종로)",
    roadAddressPart1: "서울특별시 종로구 세종대로 172",
    roadAddressPart2: " (세종로)",
    jibunAddress: "서울특별시 종로구 세종로 1-68",
    englishAddress: "172 Sejong-daero, Jongno-gu, Seoul",
    zipCode: "03154",
    sido: "서울특별시",
    sigungu: "종로구",
    eupmyeondong: "세종로",
    roadName: "세종대로",
    buildingName: "정부서울청사",
    adminCode: "1111011900",
    roadCode: "111102005001",
    buildingCode: "1111011900100010068000001",
  },
  {
    id: "sample-busan-city-hall",
    roadAddress: "부산광역시 연제구 중앙대로 1001 (연산동)",
    roadAddressPart1: "부산광역시 연제구 중앙대로 1001",
    roadAddressPart2: " (연산동)",
    jibunAddress: "부산광역시 연제구 연산동 1000 부산광역시청",
    englishAddress: "1001 Jungang-daero, Yeonje-gu, Busan",
    zipCode: "47545",
    sido: "부산광역시",
    sigungu: "연제구",
    eupmyeondong: "연산동",
    roadName: "중앙대로",
    buildingName: "부산광역시청",
    adminCode: "2647010100",
    roadCode: "264702000001",
    buildingCode: "2647010100110000000000001",
  },
];

function toAddressRecord(item: JusoAddress): AddressRecord {
  const roadAddress = item.roadAddr || "도로명주소 없음";

  return {
    id: item.bdMgtSn || `${roadAddress}-${item.zipNo || ""}`,
    roadAddress,
    roadAddressPart1: item.roadAddrPart1 || roadAddress,
    roadAddressPart2: item.roadAddrPart2 || "",
    jibunAddress: item.jibunAddr || "지번주소 없음",
    englishAddress: item.engAddr || "영문주소 없음",
    zipCode: item.zipNo || "-",
    sido: item.siNm || "-",
    sigungu: item.sggNm || "-",
    eupmyeondong: item.emdNm || "-",
    roadName: item.rn || "-",
    buildingName: item.bdNm || "-",
    adminCode: item.admCd || "-",
    roadCode: item.rnMgtSn || "-",
    buildingCode: item.bdMgtSn || "-",
  };
}

function filterFallback(keyword: string) {
  const normalized = keyword.trim().toLowerCase();

  if (!normalized) {
    return fallbackAddresses;
  }

  const filtered = fallbackAddresses.filter((address) =>
    [
      address.roadAddress,
      address.jibunAddress,
      address.englishAddress,
      address.zipCode,
      address.sido,
      address.sigungu,
      address.eupmyeondong,
      address.roadName,
      address.buildingName,
    ]
      .join(" ")
      .toLowerCase()
      .includes(normalized),
  );

  return filtered.length > 0 ? filtered : fallbackAddresses;
}

function buildPayload({
  addresses,
  source,
  keyword,
  notice,
  totalCount,
  errorCode = "0",
  errorMessage = "정상",
}: {
  addresses: AddressRecord[];
  source: "live" | "fallback" | "missing-key";
  keyword: string;
  notice?: string;
  totalCount: number;
  errorCode?: string;
  errorMessage?: string;
}) {
  return {
    source,
    keyword,
    notice,
    currentCount: addresses.length,
    totalCount,
    errorCode,
    errorMessage,
    updatedAt: new Date().toISOString(),
    addresses,
  };
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const keyword = requestUrl.searchParams.get("keyword") || "서울특별시청";
  const countPerPage = requestUrl.searchParams.get("countPerPage") || "10";
  const currentPage = requestUrl.searchParams.get("currentPage") || "1";
  const confirmKey =
    process.env.JUSO_CONFIRM_KEY ||
    process.env.ADDRESS_API_CONFIRM_KEY ||
    process.env.ROAD_ADDRESS_CONFIRM_KEY;

  if (!confirmKey) {
    return Response.json(
      buildPayload({
        addresses: filterFallback(keyword),
        source: "missing-key",
        keyword,
        notice:
          "JUSO_CONFIRM_KEY가 없어 샘플 주소를 표시합니다. 승인키를 설정하면 실제 도로명주소 API를 호출합니다.",
        totalCount: fallbackAddresses.length,
        errorCode: "NO_KEY",
        errorMessage: "승인키 미설정",
      }),
    );
  }

  const upstreamUrl = new URL(JUSO_API_URL);
  upstreamUrl.searchParams.set("confmKey", confirmKey);
  upstreamUrl.searchParams.set("currentPage", currentPage);
  upstreamUrl.searchParams.set("countPerPage", countPerPage);
  upstreamUrl.searchParams.set("keyword", keyword);
  upstreamUrl.searchParams.set("resultType", "json");
  upstreamUrl.searchParams.set("firstSort", "road");

  try {
    const response = await fetch(upstreamUrl, {
      cache: "no-store",
      headers: {
        accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`주소정보 API 응답 오류: ${response.status}`);
    }

    const data = (await response.json()) as JusoResponse;
    const common = data.results?.common;
    const errorCode = common?.errorCode || "UNKNOWN";
    const errorMessage = common?.errorMessage || "응답 메시지 없음";

    if (errorCode !== "0") {
      return Response.json(
        buildPayload({
          addresses: [],
          source: "live",
          keyword,
          totalCount: Number(common?.totalCount || 0),
          errorCode,
          errorMessage,
          notice: errorMessage,
        }),
      );
    }

    const addresses = (data.results?.juso || []).map(toAddressRecord);

    return Response.json(
      buildPayload({
        addresses,
        source: "live",
        keyword,
        totalCount: Number(common?.totalCount || addresses.length),
        errorCode,
        errorMessage,
      }),
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "주소정보 API 응답을 가져오지 못했습니다.";

    return Response.json(
      buildPayload({
        addresses: filterFallback(keyword),
        source: "fallback",
        keyword,
        notice: `${message} 샘플 주소로 화면을 유지합니다.`,
        totalCount: fallbackAddresses.length,
        errorCode: "FALLBACK",
        errorMessage: message,
      }),
    );
  }
}
