import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { IconArrowLeft, IconMail, IconCalendar, IconUsers, IconTrendingUp } from "@tabler/icons-react"
import Link from "next/link"

import customersData from "../customers-data.json"

interface CustomerDetailPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function CustomerDetailPage({ params }: CustomerDetailPageProps) {
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
                    <Button asChild>
                      <Link href="/customers">
                        <IconArrowLeft className="w-4 h-4 mr-2" />
                        Torna ai Clienti
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    )
  }

  const usagePercentage = Math.round((customer.licenseUsage / customer.maxLicenses) * 100)

  function getStatusColor(status: string) {
    switch (status) {
      case "Attivo":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      case "Attenzione":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
      case "Oltre il limite":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
    }
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
                {/* Header */}
                <div className="mb-6 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Button variant="outline" size="sm" asChild>
                      <Link href="/customers">
                        <IconArrowLeft className="w-4 h-4 mr-2" />
                        Indietro
                      </Link>
                    </Button>
                    <div>
                      <h1 className="text-2xl font-semibold">{customer.name}</h1>
                      <p className="text-muted-foreground text-sm">
                        Dettagli cliente e utilizzo licenze
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={`px-3 py-1 ${getStatusColor(customer.status)}`}
                  >
                    {customer.status}
                  </Badge>
                </div>

                {/* Customer Info Cards */}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Tipo Cliente</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{customer.type}</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Utilizzo Licenze</CardTitle>
                      <IconUsers className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{usagePercentage}%</div>
                      <p className="text-xs text-muted-foreground">
                        {customer.licenseUsage} of {customer.maxLicenses}
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Data di Iscrizione</CardTitle>
                      <IconCalendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {new Date(customer.joinDate).toLocaleDateString('en-US', {
                          month: 'short',
                          year: 'numeric'
                        })}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {new Date(customer.joinDate).toLocaleDateString()}
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Licenze Disponibili</CardTitle>
                      <IconTrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {customer.maxLicenses - customer.licenseUsage}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Licenze rimanenti
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Customer Details */}
                <div className="grid gap-6 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Informazioni di Contatto</CardTitle>
                      <CardDescription>
                        Dettagli di contatto principali per questo cliente
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-3">
                        <IconMail className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Email</p>
                          <p className="text-sm text-muted-foreground">{customer.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <IconUsers className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Tipo Account</p>
                          <p className="text-sm text-muted-foreground">{customer.type}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Panoramica Licenze</CardTitle>
                      <CardDescription>
                        Allocazione e utilizzo corrente delle licenze
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium">Utilizzo</span>
                          <span className="text-sm text-muted-foreground">
                            {customer.licenseUsage}/{customer.maxLicenses}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              usagePercentage >= 95
                                ? "bg-red-500"
                                : usagePercentage >= 80
                                ? "bg-yellow-500"
                                : "bg-green-500"
                            }`}
                            style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">Licenze Utilizzate</span>
                          <span className="text-sm font-medium">{customer.licenseUsage}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Totale Licenze</span>
                          <span className="text-sm font-medium">{customer.maxLicenses}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Disponibili</span>
                          <span className="text-sm font-medium">
                            {customer.maxLicenses - customer.licenseUsage}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}