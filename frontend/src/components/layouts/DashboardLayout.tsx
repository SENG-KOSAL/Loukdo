"use client"

import { AppBar, Box, Drawer, IconButton, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Toolbar, Typography, Avatar, Tooltip, Divider, useMediaQuery, useTheme } from "@mui/material"
import MenuIcon from "@mui/icons-material/Menu"
import MenuOpenIcon from "@mui/icons-material/MenuOpen"
import PointOfSaleIcon from "@mui/icons-material/PointOfSale"
import DashboardIcon from "@mui/icons-material/Dashboard"
import InventoryIcon from "@mui/icons-material/Inventory"
import PeopleIcon from "@mui/icons-material/People"
import ReceiptIcon from "@mui/icons-material/Receipt"
import BusinessIcon from "@mui/icons-material/Business"
import LogoutIcon from "@mui/icons-material/Logout"
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft"
import { useAppStore } from "@/stores"
import { useSession, signOut } from "next-auth/react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { Button } from "@mui/material"

const DRAWER_WIDTH = 260
const DRAWER_COLLAPSED = 68

const navSections = [
  {
    label: "Main",
    items: [
      { label: "Dashboard", icon: <DashboardIcon />, href: "/dashboard/admin" },
      { label: "POS", icon: <PointOfSaleIcon />, href: "/dashboard/pos" },
    ],
  },
  {
    label: "Management",
    items: [
      { label: "Branches", icon: <BusinessIcon />, href: "/dashboard/admin/branches" },
      { label: "Products", icon: <InventoryIcon />, href: "/dashboard/products" },
      { label: "Orders", icon: <ReceiptIcon />, href: "/dashboard/orders" },
      { label: "Customers", icon: <PeopleIcon />, href: "/dashboard/customers" },
    ],
  },
]

function stringToColor(string: string) {
  let hash = 0
  for (let i = 0; i < string.length; i++) {
    hash = string.charCodeAt(i) + ((hash << 5) - hash)
  }
  let color = "#"
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xff
    color += `00${value.toString(16)}`.slice(-2)
  }
  return color
}

function UserAvatar({ name, email }: { name?: string | null; email?: string | null }) {
  const displayName = name || email || "U"
  const initial = displayName.charAt(0).toUpperCase()
  return (
    <Avatar sx={{ width: 32, height: 32, bgcolor: stringToColor(displayName), fontSize: 14, fontWeight: 600 }}>
      {initial}
    </Avatar>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { sidebarOpen, toggleSidebar, mobileOpen, setMobileOpen } = useAppStore()
  const { data: session } = useSession()
  const pathname = usePathname()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("md"))

  const drawerContent = (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <Toolbar sx={{ display: "flex", alignItems: "center", gap: 1.5, px: 2 }}>
        <Box
          sx={{
            width: 32, height: 32, borderRadius: 1.5,
            background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Typography sx={{ color: "white", fontSize: 14, fontWeight: 700, lineHeight: 1 }}>
            L
          </Typography>
        </Box>
        {(sidebarOpen || isMobile) && (
          <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: "0.95rem", whiteSpace: "nowrap" }}>
            Loukdo POS
          </Typography>
        )}
      </Toolbar>

      <Divider />

      <Box sx={{ flex: 1, overflow: "auto", py: 1 }}>
        {navSections.map((section) => (
          <Box key={section.label} sx={{ mb: 1 }}>
            {(sidebarOpen || isMobile) && (
              <Typography
                variant="caption"
                sx={{
                  px: 2.5, py: 1, display: "block",
                  color: "text.disabled", fontWeight: 600, fontSize: "0.65rem",
                  textTransform: "uppercase", letterSpacing: 0.8,
                }}
              >
                {section.label}
              </Typography>
            )}
            <List disablePadding>
              {section.items.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
                return (
                  <ListItem key={item.label} disablePadding sx={{ px: 1 }}>
                    <ListItemButton
                      component={Link}
                      href={item.href}
                      selected={isActive}
                      sx={{
                        borderRadius: 1.5,
                        minHeight: 40,
                        mb: 0.25,
                        justifyContent: sidebarOpen || isMobile ? "initial" : "center",
                        px: sidebarOpen || isMobile ? 1.5 : 1,
                        "&.Mui-selected": {
                          bgcolor: "primary.main",
                          color: "primary.contrastText",
                          "&:hover": { bgcolor: "primary.dark" },
                          "& .MuiListItemIcon-root": { color: "primary.contrastText" },
                        },
                      }}
                    >
                      <ListItemIcon
                        sx={{
                          minWidth: 0,
                          mr: sidebarOpen || isMobile ? 2 : "auto",
                          justifyContent: "center",
                          color: isActive ? "inherit" : "action.active",
                        }}
                      >
                        {item.icon}
                      </ListItemIcon>
                      {(sidebarOpen || isMobile) && (
                        <ListItemText
                          primary={item.label}
                          primaryTypographyProps={{
                            fontSize: "0.85rem",
                            fontWeight: isActive ? 600 : 400,
                          }}
                        />
                      )}
                    </ListItemButton>
                  </ListItem>
                )
              })}
            </List>
          </Box>
        ))}
      </Box>

      <Divider />

      <Box sx={{ p: sidebarOpen || isMobile ? 2 : 1, display: "flex", alignItems: "center", gap: 1.5 }}>
        <UserAvatar name={session?.user?.name} email={session?.user?.email} />
        {(sidebarOpen || isMobile) && (
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, fontSize: "0.8rem", lineHeight: 1.2 }} noWrap>
              {session?.user?.name || session?.user?.email || "User"}
            </Typography>
            <Typography variant="caption" sx={{ color: "text.disabled", fontSize: "0.7rem" }} noWrap>
              {session?.user?.role || "Admin"}
            </Typography>
          </Box>
        )}
        <Tooltip title="Sign Out">
          <IconButton size="small" onClick={() => signOut()} sx={{ color: "text.secondary" }}>
            <LogoutIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  )

  return (
    <Box sx={{ display: "flex", bgcolor: "grey.50", minHeight: "100vh" }}>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          zIndex: (t) => t.zIndex.drawer + 1,
          bgcolor: "background.paper",
          color: "text.primary",
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={isMobile ? () => setMobileOpen(!mobileOpen) : toggleSidebar}
            sx={{ mr: 1 }}
          >
            {isMobile ? <MenuIcon /> : sidebarOpen ? <MenuOpenIcon /> : <MenuIcon />}
          </IconButton>
          <Typography variant="subtitle1" noWrap sx={{ flexGrow: 1, fontWeight: 600, fontSize: "0.95rem" }}>
            {navSections.flatMap((s) => s.items).find((i) => pathname === i.href || pathname.startsWith(i.href + "/"))?.label || "Dashboard"}
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography variant="body2" sx={{ color: "text.secondary", fontSize: "0.8rem", display: { xs: "none", sm: "block" } }}>
              {session?.user?.name || session?.user?.email}
            </Typography>
            <UserAvatar name={session?.user?.name} email={session?.user?.email} />
          </Box>
        </Toolbar>
      </AppBar>

      {isMobile ? (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            "& .MuiDrawer-paper": {
              width: DRAWER_WIDTH,
              boxSizing: "border-box",
            },
          }}
        >
          {drawerContent}
        </Drawer>
      ) : (
        <Drawer
          variant="permanent"
          sx={{
            width: sidebarOpen ? DRAWER_WIDTH : DRAWER_COLLAPSED,
            flexShrink: 0,
            "& .MuiDrawer-paper": {
              width: sidebarOpen ? DRAWER_WIDTH : DRAWER_COLLAPSED,
              boxSizing: "border-box",
              transition: (t) => t.transitions.create("width", {
                easing: t.transitions.easing.sharp,
                duration: t.transitions.duration.enteringScreen,
              }),
              overflowX: "hidden",
              borderRight: "1px solid",
              borderColor: "divider",
              bgcolor: "background.paper",
            },
          }}
        >
          {drawerContent}
        </Drawer>
      )}

      <Box component="main" sx={{ flexGrow: 1, p: { xs: 2, md: 3 }, maxWidth: "100vw", overflow: "auto" }}>
        <Toolbar />
        {children}
      </Box>
    </Box>
  )
}
