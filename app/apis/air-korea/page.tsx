import type { Metadata } from "next";
import EnvironmentApiClient, {
  type EnvironmentPageConfig,
} from "../_components/environment-api-client";

export const metadata: Metadata = {
  title: "에어코리아 | Open API Lab",
  description: "한국환경공단 에어코리아 대기오염정보 API를 사용하는 Open API 페이지입니다.",
};

const sidoOptions = [
  "서울",
  "부산",
  "대구",
  "인천",
  "광주",
  "대전",
  "울산",
  "경기",
  "강원",
  "충북",
  "충남",
  "전북",
  "전남",
  "경북",
  "경남",
  "제주",
  "세종",
].map((name) => ({ label: name, value: name }));

const config: EnvironmentPageConfig = {
  title: "에어코리아",
  eyebrow: "여섯 번째 Open API",
  badge: "대기오염정보 API 연동",
  description:
    "한국환경공단 에어코리아의 시도별 실시간 측정정보를 조회합니다. PM10, PM2.5, 오존, 이산화질소 등 주요 대기질 지표를 한 화면에 모읍니다.",
  icon: "wind",
  endpoint: "/api/air-korea",
  upstream: "ArpltnInforInqireSvc/getCtprvnRltmMesureDnsty",
  defaultParams: {
    sidoName: "서울",
    numOfRows: "10",
  },
  controls: [
    {
      name: "sidoName",
      label: "시도",
      type: "select",
      options: sidoOptions,
    },
    {
      name: "numOfRows",
      label: "조회 건수",
      type: "select",
      options: [
        { label: "5건", value: "5" },
        { label: "10건", value: "10" },
        { label: "20건", value: "20" },
      ],
    },
  ],
  emptyTitle: "대기질 데이터가 없습니다",
  emptyDescription: "시도명이나 조회 건수를 변경해 주세요.",
};

export default function AirKoreaPage() {
  return <EnvironmentApiClient config={config} />;
}
