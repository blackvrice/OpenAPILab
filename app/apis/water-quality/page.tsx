import type { Metadata } from "next";
import EnvironmentApiClient, {
  type EnvironmentPageConfig,
} from "../_components/environment-api-client";

export const metadata: Metadata = {
  title: "환경공단 수질 | Open API Lab",
  description: "수질 DB와 국가수질자동측정망 정보를 탐색하는 Open API 페이지입니다.",
};

const config: EnvironmentPageConfig = {
  title: "환경공단 수질",
  eyebrow: "일곱 번째 Open API",
  badge: "수질 DB API 연동",
  description:
    "수질측정망 운영결과와 국가수질자동측정망에서 다루는 수온, pH, 용존산소, 탁도 같은 수질 지표를 조회 화면으로 구성합니다.",
  icon: "droplets",
  endpoint: "/api/water-quality",
  upstream: "WaterQualityService/getRadioActiveMaterList",
  defaultParams: {
    fromYear: "2024",
    toYear: "2024",
    ptNoList: "1003A05",
  },
  controls: [
    { name: "fromYear", label: "시작연도", type: "text", placeholder: "2024" },
    { name: "toYear", label: "종료연도", type: "text", placeholder: "2024" },
    {
      name: "ptNoList",
      label: "측정소 코드",
      type: "text",
      placeholder: "1003A05",
    },
  ],
  emptyTitle: "수질 데이터가 없습니다",
  emptyDescription: "측정소 코드와 조회 연도를 다시 확인해 주세요.",
};

export default function WaterQualityPage() {
  return <EnvironmentApiClient config={config} />;
}
