"use client"

import { Container, Typography, Paper, Button } from "@mui/material"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function RegisterPage() {
  const router = useRouter()

  return (
    <Container maxWidth="xs">
      <Paper sx={{ p: 4, mt: 8 }}>
        <Typography variant="h5" sx={{ mb: 2 }}>
          Register
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Registration will be available once the backend is configured.
        </Typography>
        <Button component={Link} href="/login" fullWidth variant="outlined">
          Back to Sign In
        </Button>
      </Paper>
    </Container>
  )
}
