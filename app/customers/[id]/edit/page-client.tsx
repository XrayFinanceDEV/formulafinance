"use client"

import * as React from 'react'
import { sqliteDataProvider } from '@/lib/sqlite-data-provider'
import { AppSidebar } from "@/components/app-sidebar"
import { CustomerDetailForm } from "@/components/customer-detail-form"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"

interface CustomerEditPageClientProps {
  customerId: string
}

export function CustomerEditPageClient({ customerId }: CustomerEditPageClientProps) {
  const [customer, setCustomer] = React.useState<any>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<any>(null)

  React.useEffect(() => {
    const fetchCustomer = async () => {
      try {
        const result = await sqliteDataProvider.getOne('customers', { id: customerId })
        setCustomer(result.data)
      } catch (err) {
        setError(err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchCustomer()
  }, [customerId])

  if (isLoading) {
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
                    <p className="text-muted-foreground">Caricamento...</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    )
  }

  if (error || !customer) {
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

  // Transform database customer to match component's expected format
  const customerForForm = {
    id: customer.id,
    name: customer.name || customer.ragione_sociale || 'Unknown',
    email: customer.email,
    type: customer.type || customer.tipo_utente || 'cliente',
    licenseUsage: 0,
    maxLicenses: 0,
    status: customer.status || customer.stato || 'attivo',
    joinDate: customer.created_at || new Date().toISOString(),
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
                <CustomerDetailForm customer={customerForForm} />
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}