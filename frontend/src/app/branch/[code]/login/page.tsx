"use client"

import { useEffect, useState } from "react"
import { Button, Container, TextField, Typography, Box, Paper } from "@mui/material"
import { signIn } from "next-auth/react"
import { useRouter, useParams } from "next/navigation"

export default function BranchLoginPage() {
  const router = useRouter()
  const params = useParams()
  const code = params.code as string

  const [branch, setBranch] = useState<{ name: string; code: string } | null>(null)
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    fetch(`/api/branches?code=${code}`)
      .then((r) => r.json())
      .then((d) => setBranch(d))
      .catch(() => setError("Branch not found"))
  }, [code])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const result = await signIn("credentials", {
      username,
      password,
      branchCode: code,
      redirect: false,
    })
    if (result?.error) {
      setError("Invalid credentials")
    } else {
      router.push("/dashboard/admin/branches")
    }
  }

  return (
    <Container maxWidth="xs">
      <Box sx={{ mt: 8, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <Paper sx={{ p: 4, width: "100%" }}>
          <Typography component="h1" variant="h5" sx={{ mb: 1 }}>
            {branch ? branch.name : "Loading..."}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Branch sign in
          </Typography>
          <Box component="form" onSubmit={handleSubmit}>
            <TextField label="Username" type="text" fullWidth margin="normal"
              value={username} onChange={(e) => setUsername(e.target.value)} required />
            <TextField label="Password" type="password" fullWidth margin="normal"
              value={password} onChange={(e) => setPassword(e.target.value)} required />
            {error && <Typography color="error" variant="body2" sx={{ mt: 1 }}>{error}</Typography>}
            <Button type="submit" fullWidth variant="contained" sx={{ mt: 2 }}>
              Sign In
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  )
}
