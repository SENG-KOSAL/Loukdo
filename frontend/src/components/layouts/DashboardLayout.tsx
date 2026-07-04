"use client"

import { AppBar, Box, Drawer, IconButton, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Toolbar, Typography } from "@mui/material"
import MenuIcon from "@mui/icons-material/Menu"
import PointOfSaleIcon from "@mui/icons-material/PointOfSale"
import DashboardIcon from "@mui/icons-material/Dashboard"
import InventoryIcon from "@mui/icons-material/Inventory"
import PeopleIcon from "@mui/icons-material/People"
import ReceiptIcon from "@mui/icons-material/Receipt"
import BusinessIcon from "@mui/icons-material/Business"
import { useAppStore } from "@/stores"
import { useSession, signOut } from "next-auth/react"
import Link from "next/link"
import { Button } from "@mui/material"

const DRAWER_WIDTH = 240

const navItems = [
  { label: "Dashboard", icon: <DashboardIcon />, href: "/dashboard" },
  { label: "POS", icon: <PointOfSaleIcon />, href: "/dashboard/pos" },
  { label: "Products", icon: <InventoryIcon />, href: "/dashboard/products" },
  { label: "Orders", icon: <ReceiptIcon />, href: "/dashboard/orders" },
  { label: "Customers", icon: <PeopleIcon />, href: "/dashboard/customers" },
  { label: "Branches", icon: <BusinessIcon />, href: "/dashboard/admin/branches" },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { sidebarOpen, toggleSidebar } = useAppStore()
  const { data: session } = useSession()

  return (
    <Box sx={{ display: "flex" }}>
      <AppBar position="fixed" sx={{ zIndex: (t) => t.zIndex.drawer + 1 }}>
        <Toolbar>
          <IconButton color="inherit" edge="start" onClick={toggleSidebar} sx={{ mr: 2 }}>
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap sx={{ flexGrow: 1 }}>
            Loukdo POS
          </Typography>
          <Typography variant="body2" sx={{ mr: 2 }}>
            {session?.user?.name || session?.user?.email}
          </Typography>
          <Button color="inherit" onClick={() => signOut()}>
            Sign Out
          </Button>
        </Toolbar>
      </AppBar>

      <Drawer
        variant="permanent"
        sx={{
          width: sidebarOpen ? DRAWER_WIDTH : 64,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: sidebarOpen ? DRAWER_WIDTH : 64,
            boxSizing: "border-box",
            transition: "width 0.2s",
            overflowX: "hidden",
          },
        }}
      >
        <Toolbar />
        <List>
          {navItems.map((item) => (
            <ListItem key={item.label} disablePadding>
              <ListItemButton component={Link} href={item.href}>
                <ListItemIcon>{item.icon}</ListItemIcon>
                {sidebarOpen && <ListItemText primary={item.label} />}
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Toolbar />
        {children}
      </Box>
    </Box>
  )
}
