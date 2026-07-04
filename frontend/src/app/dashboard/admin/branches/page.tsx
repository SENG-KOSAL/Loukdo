"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Box, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, TextField, Typography, MenuItem, Select, InputLabel, FormControl,
  Chip, Divider, IconButton, Tooltip,
} from "@mui/material"
import AddIcon from "@mui/icons-material/Add"
import DeleteIcon from "@mui/icons-material/Delete"
import ContentCopyIcon from "@mui/icons-material/ContentCopy"
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
  users: { username: string; email: string }[]
  createdAt: string
  updatedAt: string
}

interface CreateResult {
  id: string
  name: string
  code: string
  url: string | null
  status: string
  adminPassword: string | null
  adminUsername: string | null
}

const statusColor: Record<string, "success" | "default" | "warning"> = {
  ACTIVE: "success",
  INACTIVE: "default",
  SUSPENDED: "warning",
}

const statusLabel: Record<string, string> = {
  ACTIVE: "Active",
  INACTIVE: "Inactive",
  SUSPENDED: "Suspended",
}

export default function BranchesPage() {
  const [branches, setBranches] = useState<Branch[]>([])
  const [open, setOpen] = useState(false)
  const [credentials, setCredentials] = useState<CreateResult | null>(null)
  const [detail, setDetail] = useState<Branch | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Branch | null>(null)
  const [duplicateTarget, setDuplicateTarget] = useState<Branch | null>(null)
  const [form, setForm] = useState({
    name: "", code: "", url: "", adminUsername: "", adminPassword: "", status: "ACTIVE",
  })
  const [dupForm, setDupForm] = useState({ name: "", adminUsername: "", adminPassword: "" })
  const [error, setError] = useState("")

  const slug = (s: string, max: number) =>
    s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, max) || ""

  const updateName = (name: string) => {
    setForm((prev) => ({ ...prev, name, url: slug(name, 30), code: slug(name, 20) }))
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

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await apiClient(`/branches/${deleteTarget.id}`, { method: "DELETE" })
      setDeleteTarget(null)
      setDetail(null)
      await fetchBranches()
    } catch {
      setError("Failed to delete branch")
    }
  }

  const handleDuplicate = async () => {
    if (!duplicateTarget) return
    setError("")
    try {
      const result = await apiClient<CreateResult>(`/branches/${duplicateTarget.id}`, {
        method: "POST",
        body: JSON.stringify(dupForm),
      })
      setDuplicateTarget(null)
      setDupForm({ name: "", adminUsername: "", adminPassword: "" })
      setCredentials(result)
      await fetchBranches()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to duplicate branch")
    }
  }

  const openDuplicate = (b: Branch) => {
    setDuplicateTarget(b)
    setDupForm({ name: `${b.name} (copy)`, adminUsername: "", adminPassword: "" })
  }

  const handleCreate = async () => {
    setError("")
    try {
      const result = await apiClient<CreateResult>("/branches", {
        method: "POST",
        body: JSON.stringify(form),
      })
      setOpen(false)
      setCredentials(result)
      setForm({ name: "", code: "", url: "", adminUsername: "", adminPassword: "", status: "ACTIVE" })
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
              <TableCell>Login URL</TableCell>
              <TableCell>Admin</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {branches.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">No branches yet.</TableCell>
              </TableRow>
            ) : (
              branches.map((b) => (
                <TableRow key={b.id} hover onClick={() => setDetail(b)}
                  sx={{ cursor: "pointer" }}>
                  <TableCell>{b.code}</TableCell>
                  <TableCell>{b.name}</TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontFamily: "monospace", fontSize: "0.8rem" }}>
                      /branch/{b.code}/login
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {b.users.length > 0
                      ? b.users.map((u) => u.username).join(", ")
                      : b.adminName || "-"}
                  </TableCell>
                  <TableCell>
                    <Chip label={statusLabel[b.status]} color={statusColor[b.status]} size="small" />
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Duplicate">
                      <IconButton size="small" onClick={(e) => { e.stopPropagation(); openDuplicate(b) }}>
                        <ContentCopyIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton size="small" onClick={(e) => { e.stopPropagation(); setDeleteTarget(b) }}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
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
            <TextField label="Branch Code" fullWidth value={form.code}
              slotProps={{ input: { readOnly: true } }} helperText="Auto-generated from branch name" />
            <TextField label="URL / Subdomain" fullWidth value={form.url}
              slotProps={{ input: { readOnly: true } }} helperText="Auto-generated from branch name" />
            <TextField label="Admin Username" required fullWidth value={form.adminUsername}
              onChange={(e) => setForm({ ...form, adminUsername: e.target.value })} />
            <TextField label="Admin Password" type="password" required fullWidth value={form.adminPassword}
              onChange={(e) => setForm({ ...form, adminPassword: e.target.value })} />
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
          <Button variant="contained" onClick={handleCreate} disabled={!form.name || !form.adminUsername || !form.adminPassword}>
            Create
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!credentials} onClose={() => setCredentials(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Branch Created</DialogTitle>
        <DialogContent>
          <Typography variant="h6" gutterBottom>{credentials?.name}</Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Login URL: <strong>/branch/{credentials?.code}/login</strong>
          </Typography>
          {credentials?.adminUsername && (
            <Paper variant="outlined" sx={{ p: 2, bgcolor: "grey.50" }}>
              <Typography variant="subtitle2" gutterBottom>Admin Credentials</Typography>
              <Typography variant="body2">Username: <strong>{credentials.adminUsername}</strong></Typography>
              <Typography variant="body2">Password: <strong>{credentials.adminPassword}</strong></Typography>
            </Paper>
          )}
        </DialogContent>
        <DialogActions>
          <Button variant="contained" onClick={() => setCredentials(null)}>Done</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete Branch</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete <strong>{deleteTarget?.name}</strong>?</Typography>
          <Typography variant="body2" color="error" sx={{ mt: 1 }}>
            This will also remove all users and sales data for this branch.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDelete}>Delete</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!duplicateTarget} onClose={() => setDuplicateTarget(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Duplicate Branch</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
            <TextField label="Branch Name" required fullWidth value={dupForm.name}
              onChange={(e) => setDupForm({ ...dupForm, name: e.target.value })} />
            <TextField label="Admin Username" required fullWidth value={dupForm.adminUsername}
              onChange={(e) => setDupForm({ ...dupForm, adminUsername: e.target.value })} />
            <TextField label="Admin Password" type="password" required fullWidth value={dupForm.adminPassword}
              onChange={(e) => setDupForm({ ...dupForm, adminPassword: e.target.value })} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDuplicateTarget(null)}>Cancel</Button>
          <Button variant="contained" onClick={handleDuplicate}
            disabled={!dupForm.name || !dupForm.adminUsername || !dupForm.adminPassword}>
            Duplicate
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!detail} onClose={() => setDetail(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Branch Details</DialogTitle>
        <DialogContent>
          {detail && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography variant="h6">{detail.name}</Typography>
                <Chip label={statusLabel[detail.status]} color={statusColor[detail.status]} size="small" />
              </Box>

              <Divider />

              <Typography variant="subtitle2" color="text.secondary">Branch Info</Typography>
              <Typography variant="body2"><strong>Code:</strong> {detail.code}</Typography>
              <Typography variant="body2"><strong>URL:</strong> {detail.url || "-"}</Typography>
              <Typography variant="body2">
                <strong>Login:</strong> /branch/{detail.code}/login
              </Typography>
              <Typography variant="body2">
                <strong>Created:</strong> {new Date(detail.createdAt).toLocaleDateString()}
              </Typography>

              <Divider />

              <Typography variant="subtitle2" color="text.secondary">Admin Account</Typography>
              {detail.users.length > 0 ? (
                detail.users.map((u) => (
                  <Box key={u.username}>
                    <Typography variant="body2"><strong>Username:</strong> {u.username}</Typography>
                    <Typography variant="body2"><strong>Email:</strong> {u.email}</Typography>
                  </Box>
                ))
              ) : (
                <Typography variant="body2" color="text.secondary">No admin created yet</Typography>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button variant="contained" onClick={() => setDetail(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </DashboardLayout>
  )
}
