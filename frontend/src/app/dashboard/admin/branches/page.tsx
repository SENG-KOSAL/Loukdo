"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Box, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, TextField, Typography,
} from "@mui/material"
import AddIcon from "@mui/icons-material/Add"
import DashboardLayout from "@/components/layouts/DashboardLayout"
import { apiClient } from "@/lib/api-client"

interface Branch {
  id: string
  name: string
  address: string | null
  phone: string | null
  code: string
  isActive: boolean
  createdAt: string
}

export default function BranchesPage() {
  const [branches, setBranches] = useState<Branch[]>([])
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ name: "", code: "", address: "", phone: "" })
  const [error, setError] = useState("")

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
      setForm({ name: "", code: "", address: "", phone: "" })
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
              <TableCell>Address</TableCell>
              <TableCell>Phone</TableCell>
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
                  <TableCell>{b.address || "-"}</TableCell>
                  <TableCell>{b.phone || "-"}</TableCell>
                  <TableCell>{b.isActive ? "Active" : "Inactive"}</TableCell>
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
              onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <TextField label="Branch Code" required fullWidth value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })} />
            <TextField label="Address" fullWidth value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })} />
            <TextField label="Phone" fullWidth value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })} />
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
