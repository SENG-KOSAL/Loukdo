"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Box, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, TextField, Typography, MenuItem, Select, InputLabel, FormControl,
} from "@mui/material"
import AddIcon from "@mui/icons-material/Add"
import DashboardLayout from "@/components/layouts/DashboardLayout"
import { apiClient } from "@/lib/api-client"

interface Branch {
  id: string
  name: string
  code: string
  url: string | null
  adminName: string | null
  adminEmail: string | null
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED"
  createdAt: string
}

const statusLabel: Record<string, string> = {
  ACTIVE: "Active",
  INACTIVE: "Inactive",
  SUSPENDED: "Suspended",
}

export default function BranchesPage() {
  const [branches, setBranches] = useState<Branch[]>([])
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({
    name: "", code: "", url: "", adminName: "", adminEmail: "", status: "ACTIVE",
  })
  const [error, setError] = useState("")

  const generateUrl = (name: string) =>
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 30) || ""

  const updateName = (name: string) => {
    setForm((prev) => ({ ...prev, name, url: generateUrl(name) }))
  }

  const fetchBranches = useCallback(async () => {
    try {
      const data = await apiClient<Branch[]>("/branches")
      setBranches(data)
    } catch {
      // silent
    }
  }, [])

  useEffect(() => {
    fetchBranches()
  }, [fetchBranches])

  const handleCreate = async () => {
    setError("")
    try {
      await apiClient<Branch>("/branches", {
        method: "POST",
        body: JSON.stringify(form),
      })
      setOpen(false)
      setForm({ name: "", code: "", url: "", adminName: "", adminEmail: "", status: "ACTIVE" })
      await fetchBranches()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create branch")
    }
  }

  return (
    <DashboardLayout>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
        <Typography variant="h5">Branches</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpen(true)}>
          Create Branch
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Code</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>URL</TableCell>
              <TableCell>Admin</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {branches.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center">No branches yet.</TableCell>
              </TableRow>
            ) : (
              branches.map((b) => (
                <TableRow key={b.id}>
                  <TableCell>{b.code}</TableCell>
                  <TableCell>{b.name}</TableCell>
                  <TableCell>{b.url || "-"}</TableCell>
                  <TableCell>{b.adminName || b.adminEmail || "-"}</TableCell>
                  <TableCell>{statusLabel[b.status]}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Branch</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
            <TextField label="Branch Name" required fullWidth value={form.name}
              onChange={(e) => updateName(e.target.value)} />
            <TextField label="Branch Code" required fullWidth value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })} />
            <TextField label="URL / Subdomain" fullWidth value={form.url} slotProps={{ input: { readOnly: true } }}
              helperText="Auto-generated from branch name" />
            <TextField label="Admin Name" fullWidth value={form.adminName}
              onChange={(e) => setForm({ ...form, adminName: e.target.value })} />
            <TextField label="Admin Email" type="email" fullWidth value={form.adminEmail}
              onChange={(e) => setForm({ ...form, adminEmail: e.target.value })} />
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select label="Status" value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <MenuItem value="ACTIVE">Active</MenuItem>
                <MenuItem value="INACTIVE">Inactive</MenuItem>
                <MenuItem value="SUSPENDED">Suspended</MenuItem>
              </Select>
            </FormControl>
          </Box>
          {error && <Typography color="error" variant="body2" sx={{ mt: 1 }}>{error}</Typography>}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate} disabled={!form.name || !form.code}>
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </DashboardLayout>
  )
}
