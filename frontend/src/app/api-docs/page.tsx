import type { Metadata } from "next"
import { getApiDocs } from "@/lib/api-doc"
import ReactSwagger from "./react-swagger"

export const metadata: Metadata = {
  title: "API Documentation",
  description: "Loukdo POS API documentation",
}

export default function ApiDocsPage() {
  const spec = getApiDocs()
  return <ReactSwagger spec={spec} />
}
