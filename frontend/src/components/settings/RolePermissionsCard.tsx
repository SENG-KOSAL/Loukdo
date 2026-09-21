"use client"

import { useCallback, useEffect, useState } from "react"
import { ShieldCheck, RefreshCw, Loader2, CheckCircle2, Lock } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { apiClient } from "@/lib/api-client"

type PermissionDef = { key: string; label: string; description: string }
type Role = "SUPER_ADMIN" | "BRANCH_ADMIN" | "MANAGER" | "CASHIER"
type Matrix = Record<Role, Record<string, boolean>>

const EDITABLE_ROLES: Role[] = ["BRANCH_ADMIN", "MANAGER", "CASHIER"]
const roleLabels: Record<Role, string> = {
  SUPER_ADMIN: "Super Admin",
  BRANCH_ADMIN: "Branch Admin",
  MANAGER: "Manager",
  CASHIER: "Cashier",
}

export function RolePermissionsCard() {
  const [permissions, setPermissions] = useState<PermissionDef[]>([])
  const [matrix, setMatrix] = useState<Matrix | null>(null)
  const [dirty, setDirty] = useState<Record<Role, boolean>>({ SUPER_ADMIN: false, BRANCH_ADMIN: false, MANAGER: false, CASHIER: false })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<Role | null>(null)
  const [error, setError] = useState("")
  const [savedAt, setSavedAt] = useState<Role | null>(null)

  const load = useCallback(async () => {
    setLoading(true); setError("")
    try {
      const data = await apiClient<{ permissions: PermissionDef[]; matrix: Matrix }>("/v1/permissions")
      setPermissions(data.permissions)
      setMatrix(data.matrix)
      setDirty({ SUPER_ADMIN: false, BRANCH_ADMIN: false, MANAGER: false, CASHIER: false })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load permissions")
    } finally {
      setLoading(false)
    }
  }, [])
  useEffect(() => { load() }, [load])

  function toggle(role: Role, key: string) {
    if (!matrix) return
    setMatrix({ ...matrix, [role]: { ...matrix[role], [key]: !matrix[role][key] } })
    setDirty((d) => ({ ...d, [role]: true }))
    setSavedAt(null)
  }

  async function saveRole(role: Role) {
    if (!matrix) return
    setSaving(role); setError(""); setSavedAt(null)
    try {
      const result = await apiClient<{ permissions: PermissionDef[]; matrix: Matrix }>("/v1/permissions", {
        method: "PATCH",
        body: JSON.stringify({ role, permissions: matrix[role] }),
      })
      setMatrix(result.matrix)
      setDirty((d) => ({ ...d, [role]: false }))
      setSavedAt(role)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save permissions")
    } finally {
      setSaving(null)
    }
  }

  return (
    <Card className="p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <ShieldCheck className="size-4" /> Role Permissions
        </h3>
        <Button variant="outline" size="icon" onClick={load} disabled={loading}>
          <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>
      <p className="text-sm text-muted-foreground -mt-2">
        Control what each role is allowed to do across the whole system. Super Admin always has full access and can&apos;t be restricted.
      </p>

      {error && <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

      {loading || !matrix ? (
        <div className="p-8 text-center text-sm text-muted-foreground">Loading permissions…</div>
      ) : (
        <div className="overflow-x-auto -mx-5">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b">
                <th className="px-5 py-2 text-left font-medium text-muted-foreground">Permission</th>
                <th className="px-3 py-2 text-center font-medium text-muted-foreground w-28">
                  <span className="flex items-center justify-center gap-1"><Lock className="size-3" /> Super Admin</span>
                </th>
                {EDITABLE_ROLES.map((role) => (
                  <th key={role} className="px-3 py-2 text-center font-medium text-muted-foreground w-28">{roleLabels[role]}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {permissions.map((perm) => (
                <tr key={perm.key} className="border-b last:border-0">
                  <td className="px-5 py-3">
                    <p className="font-medium">{perm.label}</p>
                    <p className="text-xs text-muted-foreground">{perm.description}</p>
                  </td>
                  <td className="px-3 py-3 text-center">
                    <input type="checkbox" checked disabled className="size-4 rounded border-input opacity-50" />
                  </td>
                  {EDITABLE_ROLES.map((role) => (
                    <td key={role} className="px-3 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={matrix[role][perm.key] ?? false}
                        onChange={() => toggle(role, perm.key)}
                        className="size-4 rounded border-input cursor-pointer"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && matrix && (
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {EDITABLE_ROLES.map((role) => (
            <Button
              key={role}
              size="sm"
              variant={dirty[role] ? "default" : "outline"}
              disabled={!dirty[role] || saving === role}
              onClick={() => saveRole(role)}
            >
              {saving === role && <Loader2 className="size-3.5 animate-spin" />}
              Save {roleLabels[role]}
            </Button>
          ))}
          {savedAt && (
            <Badge variant="secondary" className="gap-1">
              <CheckCircle2 className="size-3" /> {roleLabels[savedAt]} updated
            </Badge>
          )}
        </div>
      )}
    </Card>
  )
}
