import type { Metadata } from "next";
import PublicDataClient from "./public-data-client";

export const metadata: Metadata = {
  title: "공공데이터포털 목록조회 | Open API Lab",
  description: "공공데이터포털 목록조회서비스를 사용하는 첫 번째 Open API 페이지입니다.",
};

export default function PublicDataPage() {
  return <PublicDataClient />;
}
