import type { Metadata } from "next";
import EnvironmentApiClient, {
  type EnvironmentPageConfig,
} from "../_components/environment-api-client";

export const metadata: Metadata = {
  title: "기상청 단기예보 | Open API Lab",
  description: "기상청 단기예보 조회서비스를 사용하는 Open API 페이지입니다.",
};

const config: EnvironmentPageConfig = {
  title: "기상청 단기예보",
  eyebrow: "다섯 번째 Open API",
  badge: "공공데이터포털 인증키 연동",
  description:
    "기상청 단기예보 조회서비스의 격자 기반 예보를 React 화면으로 탐색합니다. 격자 좌표, 발표일자, 발표시각을 바꾸면 다른 지역과 시간대의 예보로 확장할 수 있습니다.",
  icon: "cloud",
  endpoint: "/api/weather-forecast",
  upstream: "VilageFcstInfoService_2.0/getVilageFcst",
  defaultParams: {
    nx: "60",
    ny: "127",
    baseDate: "20260613",
    baseTime: "0500",
  },
  controls: [
    { name: "nx", label: "격자 X", type: "text", placeholder: "nx 60" },
    { name: "ny", label: "격자 Y", type: "text", placeholder: "ny 127" },
    { name: "baseDate", label: "발표일자", type: "text", placeholder: "YYYYMMDD" },
    {
      name: "baseTime",
      label: "발표시각",
      type: "select",
      options: [
        { label: "02:00", value: "0200" },
        { label: "05:00", value: "0500" },
        { label: "08:00", value: "0800" },
        { label: "11:00", value: "1100" },
        { label: "14:00", value: "1400" },
        { label: "17:00", value: "1700" },
        { label: "20:00", value: "2000" },
        { label: "23:00", value: "2300" },
      ],
    },
  ],
  emptyTitle: "예보 데이터가 없습니다",
  emptyDescription: "격자 좌표와 발표시각을 다시 확인해 주세요.",
};

export default function WeatherForecastPage() {
  return <EnvironmentApiClient config={config} />;
}
