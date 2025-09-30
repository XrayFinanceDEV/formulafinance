'use client';

import { useState, use } from 'react';
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { AuthGuard } from "@/components/auth-guard"
import { LicenseUsageCard } from "@/components/license-usage-card"
import { LicenseAssignmentDialog } from "@/components/license-assignment-dialog"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { IconArrowLeft, IconMail, IconCalendar, IconUsers, IconPlus, IconBuilding, IconPhone, IconMapPin } from "@tabler/icons-react"
import Link from "next/link"
import { useGetOne } from 'ra-core'
import { User, UserRole } from '@/types/auth'
import { useUserLicenses } from '@/hooks/use-licenses'

interface CustomerDetailPageProps {
  params: Promise<{
    id: string
  }>
}

export default function CustomerDetailPage({ params }: CustomerDetailPageProps) {
  const { id } = use(params);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);

  // Fetch user data from ra-core data provider
  const { data: user, isLoading: userLoading } = useGetOne<User>('users', { id: parseInt(id) });

  // Fetch user licenses
  const { data: licensesData, isLoading: licensesLoading } = useUserLicenses(parseInt(id));
  const licenses = licensesData?.data || [];

  // For now, hardcoded user role check (will be replaced with actual auth context)
  // TODO: Replace with useAuth() hook when auth context is implemented
  const userRole: UserRole = 'superuser'; // This should come from auth context
  const canManageLicenses = userRole === 'superuser';

  if (userLoading) {
    return (
      <AuthGuard>
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
            <div className="flex flex-1 flex-col items-center justify-center">
              <p className="text-muted-foreground">Caricamento...</p>
            </div>
          </SidebarInset>
        </SidebarProvider>
      </AuthGuard>
    );
  }

  if (!user) {
    return (
      <AuthGuard>
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
      </AuthGuard>
    );
  }

  // Calculate total license stats
  const totalLicenses = licenses.reduce((sum, lic) => sum + lic.quantity_total, 0);
  const totalUsed = licenses.reduce((sum, lic) => sum + lic.quantity_used, 0);
  const totalRemaining = totalLicenses - totalUsed;
  const usagePercentage = totalLicenses > 0 ? Math.round((totalUsed / totalLicenses) * 100) : 0;

  const displayName = user.business_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email;

  function getStatusBadge(isActive: boolean) {
    return isActive ? (
      <Badge variant="default" className="bg-green-500">Attivo</Badge>
    ) : (
      <Badge variant="secondary">Inattivo</Badge>
    );
  }

  return (
    <AuthGuard>
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
                        <h1 className="text-2xl font-semibold">{displayName}</h1>
                        <p className="text-muted-foreground text-sm">
                          Dettagli cliente e gestione licenze
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(user.is_active)}
                      <Badge variant="outline">{user.role}</Badge>
                    </div>
                  </div>

                  {/* Summary Stats */}
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Tipo Cliente</CardTitle>
                        <IconBuilding className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold capitalize">{user.subject_category || 'N/A'}</div>
                        <p className="text-xs text-muted-foreground">
                          {user.business_name || 'Privato'}
                        </p>
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
                          {totalUsed} di {totalLicenses} utilizzate
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Data Registrazione</CardTitle>
                        <IconCalendar className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {user.created_at
                            ? new Date(user.created_at).toLocaleDateString('it-IT', {
                                month: 'short',
                                year: 'numeric'
                              })
                            : 'N/A'}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {user.created_at
                            ? new Date(user.created_at).toLocaleDateString('it-IT')
                            : 'Data non disponibile'}
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Licenze Disponibili</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{totalRemaining}</div>
                        <p className="text-xs text-muted-foreground">
                          Licenze rimanenti
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Main Content Grid */}
                  <div className="grid gap-6 md:grid-cols-2 mb-6">
                    {/* Contact Information */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Informazioni di Contatto</CardTitle>
                        <CardDescription>
                          Dettagli di contatto e business per questo cliente
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-start gap-3">
                          <IconMail className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <div>
                            <p className="text-sm font-medium">Email</p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                            {user.pec_email && (
                              <p className="text-xs text-muted-foreground mt-1">PEC: {user.pec_email}</p>
                            )}
                          </div>
                        </div>

                        {user.phone && (
                          <div className="flex items-start gap-3">
                            <IconPhone className="h-4 w-4 text-muted-foreground mt-0.5" />
                            <div>
                              <p className="text-sm font-medium">Telefono</p>
                              <p className="text-sm text-muted-foreground">{user.phone}</p>
                            </div>
                          </div>
                        )}

                        {(user.address || user.city) && (
                          <div className="flex items-start gap-3">
                            <IconMapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                            <div>
                              <p className="text-sm font-medium">Indirizzo</p>
                              <p className="text-sm text-muted-foreground">
                                {user.address && <span>{user.address}<br /></span>}
                                {user.city && (
                                  <span>
                                    {user.postal_code && `${user.postal_code} `}
                                    {user.city}
                                    {user.province && ` (${user.province})`}
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>
                        )}

                        {(user.vat_number || user.tax_code) && (
                          <div className="flex items-start gap-3">
                            <IconBuilding className="h-4 w-4 text-muted-foreground mt-0.5" />
                            <div>
                              <p className="text-sm font-medium">Dati Fiscali</p>
                              {user.vat_number && (
                                <p className="text-sm text-muted-foreground">P.IVA: {user.vat_number}</p>
                              )}
                              {user.tax_code && (
                                <p className="text-sm text-muted-foreground">C.F.: {user.tax_code}</p>
                              )}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* License Overview Summary */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Riepilogo Licenze</CardTitle>
                        <CardDescription>
                          Statistiche aggregate di tutte le licenze assegnate
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium">Utilizzo Totale</span>
                            <span className="text-sm text-muted-foreground">
                              {totalUsed}/{totalLicenses}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                usagePercentage >= 90
                                  ? "bg-red-500"
                                  : usagePercentage >= 70
                                  ? "bg-yellow-500"
                                  : "bg-green-500"
                              }`}
                              style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm">Licenze Totali</span>
                            <span className="text-sm font-medium">{totalLicenses}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm">Licenze Utilizzate</span>
                            <span className="text-sm font-medium">{totalUsed}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm">Licenze Disponibili</span>
                            <span className="text-sm font-medium text-green-600">{totalRemaining}</span>
                          </div>
                          <div className="flex justify-between pt-2 border-t">
                            <span className="text-sm">Prodotti Attivi</span>
                            <span className="text-sm font-medium">{licenses.length}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Licenses Section */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>Licenze Assegnate</CardTitle>
                          <CardDescription>
                            Tutte le licenze attive per questo cliente
                          </CardDescription>
                        </div>
                        {canManageLicenses && (
                          <Button onClick={() => setIsAssignDialogOpen(true)}>
                            <IconPlus className="w-4 h-4 mr-2" />
                            Assegna Licenza
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      {licensesLoading ? (
                        <div className="text-center py-8 text-muted-foreground">
                          Caricamento licenze...
                        </div>
                      ) : licenses.length === 0 ? (
                        <div className="text-center py-8">
                          <p className="text-muted-foreground mb-4">
                            Nessuna licenza assegnata a questo cliente
                          </p>
                          {canManageLicenses && (
                            <Button variant="outline" onClick={() => setIsAssignDialogOpen(true)}>
                              <IconPlus className="w-4 h-4 mr-2" />
                              Assegna Prima Licenza
                            </Button>
                          )}
                        </div>
                      ) : (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                          {licenses.map((license) => (
                            <LicenseUsageCard
                              key={license.id}
                              license={license}
                              showActions={canManageLicenses}
                            />
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>

      {/* License Assignment Dialog */}
      {canManageLicenses && (
        <LicenseAssignmentDialog
          open={isAssignDialogOpen}
          onOpenChange={setIsAssignDialogOpen}
          userId={user.id}
          userName={displayName}
        />
      )}
    </AuthGuard>
  );
}