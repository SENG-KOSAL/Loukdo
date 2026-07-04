"use client"

import { Button, Container, TextField, Typography, Box, Paper } from "@mui/material"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useState } from "react"

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const result = await signIn("credentials", { username, password, redirect: false })
    if (result?.error) {
      setError("Invalid credentials")
    } else {
      router.push("/dashboard")
    }
  }

  return (
    <Container maxWidth="xs">
      <Box sx={{ mt: 8, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <Paper sx={{ p: 4, width: "100%" }}>
          <Typography component="h1" variant="h5" sx={{ mb: 2 }}>
            Loukdo POS — Sign In
          </Typography>
          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              label="Username"
              type="text"
              fullWidth
              margin="normal"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
            <TextField
              label="Password"
              type="password"
              fullWidth
              margin="normal"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {error && (
              <Typography color="error" variant="body2" sx={{ mt: 1 }}>
                {error}
              </Typography>
            )}
            <Button type="submit" fullWidth variant="contained" sx={{ mt: 2 }}>
              Sign In
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  )
}
