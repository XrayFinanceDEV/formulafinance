"use client"

import * as React from "react"
import {
  IconCamera,
  IconChartBar,
  IconDashboard,
  IconDatabase,
  IconFileAi,
  IconFileDescription,
  IconFileWord,
  IconFolder,
  IconHelp,
  IconLicense,
  IconListDetails,
  IconReport,
  IconSearch,
  IconSettings,
  IconUsers,
} from "@tabler/icons-react"

import { NavDocuments } from "@/components/nav-documents"
import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { useAuth } from "@/lib/auth/auth-provider"
import { UserRole } from "@/types/rbac"

const allNavItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: IconDashboard,
    allowedRoles: ['cliente', 'potenziale', 'rivenditore', 'intermediario', 'superadmin'] as UserRole[],
  },
  {
    title: "Clienti",
    url: "/customers",
    icon: IconUsers,
    allowedRoles: ['rivenditore', 'intermediario', 'superadmin'] as UserRole[],
  },
  {
    title: "Elaborazioni",
    url: "/reports",
    icon: IconReport,
    allowedRoles: ['cliente', 'potenziale', 'rivenditore', 'intermediario', 'superadmin'] as UserRole[],
  },
  {
    title: "Archivio",
    url: "/archive",
    icon: IconFolder,
    allowedRoles: ['cliente', 'potenziale', 'rivenditore', 'intermediario', 'superadmin'] as UserRole[],
  },
]

const secondaryNavItems = [
  {
    title: "Impostazioni",
    url: "/settings",
    icon: IconSettings,
    allowedRoles: ['cliente', 'potenziale', 'rivenditore', 'intermediario', 'superadmin'] as UserRole[],
  },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { role } = useAuth()

  // Filter nav items based on user role
  const filteredNavMain = React.useMemo(() => {
    if (!role) return []
    return allNavItems.filter(item => item.allowedRoles.includes(role))
  }, [role])

  const filteredNavSecondary = React.useMemo(() => {
    if (!role) return []
    return secondaryNavItems.filter(item => item.allowedRoles.includes(role))
  }, [role])

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="#">
                <img
                  src="/LOGO_formula-finance.png"
                  alt="Formula Finance"
                  className="!size-5"
                />
                <span className="text-base font-semibold">Formula Finance</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={filteredNavMain} />
        <NavSecondary items={filteredNavSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  )
}
