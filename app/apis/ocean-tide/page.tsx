import type { Metadata } from "next";
import EnvironmentApiClient, {
  type EnvironmentPageConfig,
} from "../_components/environment-api-client";

export const metadata: Metadata = {
  title: "해양 조석 | Open API Lab",
  description: "국립해양조사원 조석예보 API를 사용하는 Open API 페이지입니다.",
};

const config: EnvironmentPageConfig = {
  title: "해양 조석",
  eyebrow: "여덟 번째 Open API",
  badge: "국립해양조사원 API 연동",
  description:
    "국립해양조사원 조석예보의 고조와 저조 정보를 조회합니다. 예보지점 코드와 요청일자를 바꿔 연안·항만별 조석 흐름을 확인할 수 있습니다.",
  icon: "waves",
  endpoint: "/api/ocean-tide",
  upstream: "tideFcstHghLw/GetTideFcstHghLwApiService",
  defaultParams: {
    stationCode: "DT_0005",
    date: "20260613",
  },
  controls: [
    {
      name: "stationCode",
      label: "예보지점 코드",
      type: "text",
      placeholder: "DT_0005",
    },
    { name: "date", label: "요청일자", type: "text", placeholder: "YYYYMMDD" },
  ],
  emptyTitle: "조석예보 데이터가 없습니다",
  emptyDescription: "예보지점 코드와 요청일자를 다시 확인해 주세요.",
};

export default function OceanTidePage() {
  return <EnvironmentApiClient config={config} />;
}
