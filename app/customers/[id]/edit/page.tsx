import { AppSidebar } from "@/components/app-sidebar"
import { CustomerDetailForm } from "@/components/customer-detail-form"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"

import customersData from "../../customers-data.json"

interface CustomerEditPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function CustomerEditPage({ params }: CustomerEditPageProps) {
  const { id } = await params
  const customer = customersData.find(c => c.id === parseInt(id))

  if (!customer) {
    return (
      <SidebarProvider
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 72)",
            "--header-height": "calc(var(--spacing) * 12)",
          } as React.CSSProperties
        }
      >
        <AppSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader />
          <div className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col gap-2">
              <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                <div className="px-4 lg:px-6">
                  <div className="text-center py-8">
                    <h1 className="text-2xl font-semibold mb-2">Cliente Non Trovato</h1>
                    <p className="text-muted-foreground mb-4">
                      Il cliente che stai cercando non esiste.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    )
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <div className="px-4 lg:px-6">
                <CustomerDetailForm customer={customer} />
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}