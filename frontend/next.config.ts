import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  transpilePackages: ["@loukdo/backend", "@mui/material", "@mui/icons-material", "@mui/material-nextjs", "@emotion/react", "@emotion/styled"],
}

export default nextConfig
