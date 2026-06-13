import type { Metadata } from "next";
import AddressClient from "./address-client";

export const metadata: Metadata = {
  title: "행안부 도로명주소 검색 | Open API Lab",
  description: "주소기반산업지원서비스 도로명주소 API를 사용하는 Open API 페이지입니다.",
};

export default function AddressPage() {
  return <AddressClient />;
}
