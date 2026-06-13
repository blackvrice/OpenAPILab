import type { Metadata } from "next";
import SeoulOpenDataClient from "./seoul-open-data-client";

export const metadata: Metadata = {
  title: "서울 열린데이터광장 | Open API Lab",
  description: "서울 열린데이터광장 Open API 목록 서비스를 사용하는 Open API 페이지입니다.",
};

export default function SeoulOpenDataPage() {
  return <SeoulOpenDataClient />;
}
