import type { Metadata } from "next";
import KosisClient from "./kosis-client";

export const metadata: Metadata = {
  title: "KOSIS 통계목록 | Open API Lab",
  description: "KOSIS 공유서비스 통계목록 API를 사용하는 Open API 페이지입니다.",
};

export default function KosisPage() {
  return <KosisClient />;
}
