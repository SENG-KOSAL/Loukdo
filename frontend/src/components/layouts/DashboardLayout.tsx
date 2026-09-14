"use client"

import { useState, useMemo } from "react"
import {
  AppBar, Box, Drawer, IconButton, List, ListItem, ListItemButton,
  ListItemIcon, ListItemText, Toolbar, Typography, Avatar, Tooltip,
  Divider, useMediaQuery, useTheme, Menu, MenuItem, Badge, InputBase,
  alpha,
} from "@mui/material"
import MenuIcon from "@mui/icons-material/Menu"
import MenuOpenIcon from "@mui/icons-material/MenuOpen"
import SearchIcon from "@mui/icons-material/Search"
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone"
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown"
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft"
import ChevronRightIcon from "@mui/icons-material/ChevronRight"
import LogoutIcon from "@mui/icons-material/Logout"
import SettingsIcon from "@mui/icons-material/Settings"
import CloseIcon from "@mui/icons-material/Close"
import PointOfSaleIcon from "@mui/icons-material/PointOfSale"
import DashboardIcon from "@mui/icons-material/Dashboard"
import InventoryIcon from "@mui/icons-material/Inventory"
import PeopleIcon from "@mui/icons-material/People"
import ReceiptIcon from "@mui/icons-material/Receipt"
import BusinessIcon from "@mui/icons-material/Business"
import StorefrontIcon from "@mui/icons-material/Storefront"
import { useAppStore } from "@/stores"
import { useSession, signOut } from "next-auth/react"
import { usePathname } from "next/navigation"
import Link from "next/link"

const DRAWER_WIDTH = 264
const DRAWER_COLLAPSED = 72

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

function UserAvatar({ name, email, size = 32 }: {
  name?: string | null
  email?: string | null
  size?: number
}) {
  const displayName = name || email || "U"
  const initial = displayName.charAt(0).toUpperCase()
  return (
    <Avatar
      sx={{
        width: size, height: size,
        bgcolor: stringToColor(displayName),
        fontSize: Math.round(size * 0.44),
        fontWeight: 600,
        transition: "transform .15s ease",
        "&:hover": { transform: "scale(1.05)" },
      }}
    >
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

  const [searchQuery, setSearchQuery] = useState("")
  const [userMenuAnchor, setUserMenuAnchor] = useState<HTMLElement | null>(null)

  const showLabels = sidebarOpen || isMobile

  const filteredSections = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return navSections
    return navSections
      .map((section) => ({
        ...section,
        items: section.items.filter(
          (i) => i.label.toLowerCase().includes(q) || i.href.toLowerCase().includes(q),
        ),
      }))
      .filter((section) => section.items.length > 0)
  }, [searchQuery])

  const flatItems = navSections.flatMap((section) =>
    section.items.map((item) => ({ ...item, section: section.label })),
  )
  const currentItem = flatItems.find(
    (i) => pathname === i.href || pathname.startsWith(i.href + "/"),
  )

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/")

  const searchActive = searchQuery.trim().length > 0

  const drawerContent = (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <Toolbar
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          px: 2,
          minHeight: { xs: 56, md: 64 },
        }}
      >
        <Box
          sx={{
            width: 34, height: 34, borderRadius: 1.75, flexShrink: 0,
            background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 55%, #d946ef 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 4px 10px -2px rgba(139,92,246,.4)",
          }}
        >
          <StorefrontIcon sx={{ color: "#fff", fontSize: 18 }} />
        </Box>
        {showLabels && (
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography
              variant="subtitle2"
              sx={{ fontWeight: 700, lineHeight: 1.2, whiteSpace: "nowrap", letterSpacing: "-0.01em" }}
            >
              Loukdo
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: "text.disabled", fontSize: "0.62rem", lineHeight: 1, letterSpacing: 1.4, textTransform: "uppercase" }}
            >
              POS Admin
            </Typography>
          </Box>
        )}
      </Toolbar>

      <Divider />

      {searchActive && (
        <Box sx={{ px: 1.5, pt: 1 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              px: 1.25,
              py: 0.75,
              borderRadius: 1.25,
              bgcolor: alpha(theme.palette.primary.main, 0.06),
              color: "text.secondary",
            }}
          >
            <SearchIcon sx={{ fontSize: 15, color: "text.disabled" }} />
            <Typography variant="caption" sx={{ flex: 1, fontWeight: 600 }}>
              Results for &ldquo;{searchQuery}&rdquo;
            </Typography>
            <IconButton size="small" onClick={() => setSearchQuery("")} sx={{ p: 0.25 }}>
              <CloseIcon sx={{ fontSize: 14 }} />
            </IconButton>
          </Box>
        </Box>
      )}

      <Box sx={{ flex: 1, overflow: "auto", py: 1, px: showLabels ? 1 : 0 }}>
        {filteredSections.length === 0 ? (
          <Box sx={{ px: 3, py: 6, textAlign: "center" }}>
            <SearchIcon sx={{ fontSize: 28, color: "text.disabled", opacity: 0.5 }} />
            <Typography variant="body2" sx={{ mt: 1, color: "text.disabled" }}>
              No pages match &ldquo;{searchQuery}&rdquo;
            </Typography>
          </Box>
        ) : (
          filteredSections.map((section) => (
            <Box key={section.label} sx={{ mb: 1 }}>
              {showLabels && (
                <Typography
                  variant="caption"
                  sx={{
                    display: "block",
                    px: 2, pt: 1.5, pb: 0.5,
                    color: "text.disabled",
                    fontWeight: 700,
                    fontSize: "0.6rem",
                    textTransform: "uppercase",
                    letterSpacing: 1.2,
                  }}
                >
                  {section.label}
                </Typography>
              )}
              <List disablePadding>
                {section.items.map((item) => {
                  const active = isActive(item.href)
                  const navButton = (
                    <ListItemButton
                      component={Link}
                      href={item.href}
                      selected={active}
                      sx={{
                        position: "relative",
                        borderRadius: 1.5,
                        minHeight: 42,
                        my: 0.25,
                        mx: showLabels ? 0 : 1,
                        justifyContent: showLabels ? "initial" : "center",
                        px: showLabels ? 1.5 : 1,
                        transition: theme.transitions.create(
                          ["background-color", "color", "box-shadow"],
                          { duration: theme.transitions.duration.shorter },
                        ),
                        "&.Mui-selected": {
                          bgcolor: alpha(theme.palette.primary.main, 0.1),
                          color: "primary.main",
                          boxShadow: `inset 0 0 0 1px ${alpha(theme.palette.primary.main, 0.18)}`,
                          "&:hover": {
                            bgcolor: alpha(theme.palette.primary.main, 0.16),
                          },
                          "& .MuiListItemIcon-root": { color: "primary.main" },
                        },
                      }}
                    >
                      {active && showLabels && (
                        <Box
                          sx={{
                            position: "absolute",
                            left: -4, top: "50%",
                            transform: "translateY(-50%)",
                            width: 3.5, height: 18,
                            borderRadius: 99,
                            bgcolor: "primary.main",
                          }}
                        />
                      )}
                      <ListItemIcon
                        sx={{
                          position: "relative",
                          minWidth: 0,
                          mr: showLabels ? 1.75 : 0,
                          justifyContent: "center",
                          color: active ? "primary.main" : "action.active",
                          transition: "color .15s ease",
                        }}
                      >
                        {item.icon}
                      </ListItemIcon>
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <ListItemText
                          primary={item.label}
                          sx={{
                            opacity: showLabels ? 1 : 0,
                            transition: theme.transitions.create("opacity", {
                              duration: theme.transitions.duration.shorter,
                            }),
                            whiteSpace: "nowrap",
                          }}
                          primaryTypographyProps={{
                            fontSize: "0.85rem",
                            fontWeight: active ? 600 : 500,
                          }}
                        />
                      </Box>
                    </ListItemButton>
                  )
                  return (
                    <ListItem key={item.label} disablePadding sx={{ position: "relative" }}>
                      {showLabels ? navButton : (
                        <Tooltip title={item.label} placement="right" arrow>
                          {navButton}
                        </Tooltip>
                      )}
                    </ListItem>
                  )
                })}
              </List>
            </Box>
          ))
        )}
      </Box>

      <Divider />

      <Box
        sx={{
          p: 1.5,
          cursor: "pointer",
          borderTop: "1px solid",
          borderColor: "divider",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            p: showLabels ? 1 : 0.5,
            borderRadius: 1.5,
            justifyContent: showLabels ? "initial" : "center",
            transition: "background-color .2s ease",
            "&:hover": { bgcolor: theme.palette.action.hover },
          }}
          onClick={(e) => setUserMenuAnchor(e.currentTarget as HTMLElement)}
        >
          <UserAvatar name={session?.user?.name} email={session?.user?.email} />
          {showLabels && (
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, fontSize: "0.8rem", lineHeight: 1.2 }} noWrap>
                {session?.user?.name || session?.user?.email || "User"}
              </Typography>
              <Typography variant="caption" sx={{ color: "text.disabled", fontSize: "0.68rem", textTransform: "capitalize" }} noWrap>
                {String(session?.user?.role || "Admin").toLowerCase()}
              </Typography>
            </Box>
          )}
          {showLabels && (
            <Tooltip title={userMenuAnchor ? "Close menu" : "Account menu"}>
              <IconButton size="small" sx={{ color: "text.secondary", p: 0.5 }} onClick={(e) => {
                e.stopPropagation()
                setUserMenuAnchor((prev) => (prev ? null : e.currentTarget))
              }}>
                <KeyboardArrowDownIcon
                  fontSize="small"
                  sx={{ transition: "transform .2s ease", transform: userMenuAnchor ? "rotate(180deg)" : "none" }}
                />
              </IconButton>
            </Tooltip>
          )}
          {!showLabels && (
            <Tooltip title="Account options" placement="right" arrow>
              <IconButton size="small" sx={{ color: "text.secondary", p: 0.5 }}>
                <KeyboardArrowDownIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>

        {!isMobile && (
          <Box sx={{ mt: 1, display: "flex", justifyContent: showLabels ? "flex-end" : "center" }}>
            <Tooltip title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"} placement="top">
              <IconButton
                size="small"
                onClick={toggleSidebar}
                sx={{
                  color: "text.secondary",
                  border: "1px solid",
                  borderColor: "divider",
                  "&:hover": { bgcolor: theme.palette.action.selected },
                }}
              >
                {sidebarOpen ? <ChevronLeftIcon fontSize="small" /> : <ChevronRightIcon fontSize="small" />}
              </IconButton>
            </Tooltip>
          </Box>
        )}
      </Box>

      <Menu
        anchorEl={userMenuAnchor}
        open={Boolean(userMenuAnchor)}
        onClose={() => setUserMenuAnchor(null)}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        transformOrigin={{ vertical: "bottom", horizontal: "right" }}
        slotProps={{
          paper: {
            sx: { minWidth: 200, mt: 0.5, borderRadius: 2, boxShadow: theme.shadows[6] },
          },
        }}
      >
        <Box sx={{ px: 2, py: 1.25 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.3 }} noWrap>
            {session?.user?.name || session?.user?.email || "User"}
          </Typography>
          <Typography variant="caption" sx={{ color: "text.disabled" }} noWrap>
            {session?.user?.email}
          </Typography>
        </Box>
        <Divider />
        <MenuItem disabled onClick={() => setUserMenuAnchor(null)} sx={{ gap: 1.5, py: 1 }}>
          <SettingsIcon fontSize="small" sx={{ color: "text.secondary" }} />
          Settings
          <Typography variant="caption" sx={{ ml: "auto", color: "text.disabled" }}>Soon</Typography>
        </MenuItem>
        <MenuItem onClick={() => { setUserMenuAnchor(null); signOut() }} sx={{ gap: 1.5, py: 1, color: "error.main" }}>
          <LogoutIcon fontSize="small" />
          Sign out
        </MenuItem>
      </Menu>
    </Box>
  )

  return (
    <Box
      sx={{
        display: "flex",
        minHeight: "100vh",
        bgcolor: "grey.50",
        background: `linear-gradient(180deg, ${alpha(theme.palette.primary.main, 0.04)} 0%, transparent 300px), ${theme.palette.grey[50]}`,
      }}
    >
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          zIndex: (t) => t.zIndex.drawer + 1,
          bgcolor: alpha("#fff", 0.85),
          color: "text.primary",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        <Toolbar sx={{ minHeight: { xs: 56, md: 64 }, px: { xs: 1.5, sm: 2.5 } }}>
          <IconButton
            color="inherit"
            edge="start"
            onClick={isMobile ? () => setMobileOpen(!mobileOpen) : toggleSidebar}
            sx={{ mr: 1.25, color: "text.secondary" }}
          >
            {isMobile ? <MenuIcon /> : sidebarOpen ? <MenuOpenIcon /> : <MenuIcon />}
          </IconButton>

          <Box sx={{ minWidth: 0, flexGrow: 1 }}>
            <Typography
              variant="subtitle1"
              noWrap
              sx={{ fontWeight: 700, fontSize: "0.95rem", lineHeight: 1.2, letterSpacing: "-0.01em" }}
            >
              {searchActive ? "Search" : (currentItem?.label || "Dashboard")}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                display: { xs: "none", sm: "block" },
                color: "text.disabled",
                fontSize: "0.7rem",
                lineHeight: 1.2,
                textTransform: "capitalize",
              }}
              noWrap
            >
              {currentItem ? `${currentItem.section} / ${currentItem.label}` : "Admin overview"}
            </Typography>
          </Box>

          <Box
            sx={{
              display: { xs: "none", sm: "flex" },
              alignItems: "center",
              gap: 1,
              px: 1.5,
              width: 240,
              height: 38,
              ml: 2,
              borderRadius: 2,
              bgcolor: alpha("#000", 0.04),
              border: "1px solid",
              borderColor: alpha("#000", 0.06),
              transition: theme.transitions.create(["background-color", "border-color", "box-shadow"]),
              "&:focus-within": {
                bgcolor: "#fff",
                borderColor: "primary.main",
                boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.15)}`,
              },
            }}
          >
            <SearchIcon sx={{ fontSize: 18, color: "text.disabled" }} />
            <InputBase
              placeholder="Search pages\u2026"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              inputProps={{ "aria-label": "Search pages" }}
              sx={{ flex: 1, fontSize: "0.85rem" }}
            />
            {searchActive && (
              <Tooltip title="Clear search">
                <IconButton size="small" onClick={() => setSearchQuery("")} sx={{ p: 0.25 }}>
                  <CloseIcon sx={{ fontSize: 15 }} />
                </IconButton>
              </Tooltip>
            )}
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, ml: 1 }}>
            <Tooltip title="Notifications">
              <IconButton size="small" sx={{ color: "text.secondary" }}>
                <Badge color="error" variant="dot" overlap="circular" sx={{ "& .MuiBadge-dot": { minWidth: 7, height: 7 } }}>
                  <NotificationsNoneIcon sx={{ fontSize: 21 }} />
                </Badge>
              </IconButton>
            </Tooltip>
            <Divider orientation="vertical" flexItem sx={{ mx: 0.5, display: { xs: "none", sm: "block" } }} />
            <Box
              sx={{
                display: { xs: "none", sm: "flex" },
                alignItems: "center",
                gap: 1,
                pl: 0.5,
                pr: 1,
                py: 0.5,
                borderRadius: 2,
                cursor: "pointer",
                transition: "background-color .2s ease",
                "&:hover": { bgcolor: theme.palette.action.hover },
              }}
              onClick={(e) => setUserMenuAnchor(e.currentTarget as HTMLElement)}
            >
              <UserAvatar name={session?.user?.name} email={session?.user?.email} size={30} />
              <Box sx={{ display: { md: "block", xs: "none" }, lineHeight: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, fontSize: "0.78rem", lineHeight: 1.2 }} noWrap>
                  {session?.user?.name || session?.user?.email}
                </Typography>
                <Typography variant="caption" sx={{ color: "text.disabled", fontSize: "0.65rem", textTransform: "capitalize", display: "block" }}>
                  {String(session?.user?.role || "Admin").toLowerCase()}
                </Typography>
              </Box>
              <KeyboardArrowDownIcon sx={{ fontSize: 16, color: "text.disabled" }} />
            </Box>
          </Box>
        </Toolbar>
      </AppBar>

      <Menu
        anchorEl={userMenuAnchor}
        open={Boolean(userMenuAnchor)}
        onClose={() => setUserMenuAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{
          paper: {
            sx: { minWidth: 220, mt: 1, borderRadius: 2, boxShadow: theme.shadows[8] },
          },
        }}
      >
        <Box sx={{ px: 2, py: 1.25 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.3 }} noWrap>
            {session?.user?.name || session?.user?.email || "User"}
          </Typography>
          <Typography variant="caption" color="text.disabled" noWrap>
            {session?.user?.email}
          </Typography>
        </Box>
        <Divider />
        <MenuItem disabled sx={{ gap: 1.5, py: 1 }}>
          <SettingsIcon fontSize="small" sx={{ color: "text.secondary" }} />
          Settings
          <Typography variant="caption" sx={{ ml: "auto", color: "text.disabled" }}>Soon</Typography>
        </MenuItem>
        <MenuItem onClick={() => { setUserMenuAnchor(null); signOut() }} sx={{ gap: 1.5, py: 1, color: "error.main" }}>
          <LogoutIcon fontSize="small" />
          Sign out
        </MenuItem>
      </Menu>

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
              borderRadius: 0,
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
                easing: t.transitions.easing.easeInOut,
                duration: t.transitions.duration.enteringScreen,
              }),
              overflowX: "hidden",
              overflowY: "hidden",
              borderRight: "1px solid",
              borderColor: "divider",
              bgcolor: "background.paper",
            },
          }}
        >
          {drawerContent}
        </Drawer>
      )}

      <Box component="main" sx={{ flexGrow: 1, p: { xs: 2, md: 3 }, maxWidth: "100vw", minWidth: 0 }}>
        <Toolbar />
        {children}
      </Box>
    </Box>
  )
}