import { NextResponse } from "next/server"
import { getApiDocs } from "@/lib/api-doc"

export const GET = () => NextResponse.json(getApiDocs())
