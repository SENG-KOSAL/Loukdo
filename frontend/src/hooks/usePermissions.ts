"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { apiClient } from "@/lib/api-client"

export type PermissionKey =
  | "branches.manage"
  | "users.manage"
  | "products.manage"
  | "categories.manage"
  | "inventory.manage"
  | "vendors.manage"
  | "purchaseOrders.manage"
  | "sales.view"
  | "pos.access"
  | "settings.manage"

type MeResponse = { role: string; permissions: Record<string, boolean> }

/**
 * Fetches the signed-in user's *effective* permissions (their role's permissions,
 * after any overrides a super admin has set in Settings > Role Permissions).
 * Use this instead of hardcoding `role === "BRANCH_ADMIN"` checks in the UI, so
 * buttons stay in sync with whatever the super admin has actually configured.
 */
export function usePermissions() {
  const { data: session, status } = useSession()
  const [permissions, setPermissions] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (status !== "authenticated") {
      if (status === "unauthenticated") setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    setError("")
    apiClient<MeResponse>("/v1/permissions/me")
      .then((res) => { if (!cancelled) setPermissions(res.permissions) })
      .catch((err) => {
        if (cancelled) return
        setPermissions({})
        // eslint-disable-next-line no-console
        console.error("usePermissions: failed to load /v1/permissions/me —", err)
        setError(err instanceof Error ? err.message : "Failed to load permissions")
      })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [status])

  function can(key: PermissionKey): boolean {
    return permissions[key] ?? false
  }

  return {
    can,
    loading,
    error,
    role: (session?.user as { role?: string } | undefined)?.role,
  }
}
