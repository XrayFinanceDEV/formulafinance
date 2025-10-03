'use client';

import { useParams, useRouter } from 'next/navigation';
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { AuthGuard } from "@/components/auth-guard"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useReport } from "@/hooks/use-reports-query"
import { useModule } from "@/hooks/use-modules-query"
import { IconArrowLeft, IconDownload } from "@tabler/icons-react"

const statusConfig = {
  pending: { label: 'In Attesa', variant: 'secondary' as const, color: 'bg-yellow-500' },
  processing: { label: 'In Elaborazione', variant: 'default' as const, color: 'bg-blue-500' },
  completed: { label: 'Completato', variant: 'default' as const, color: 'bg-green-500' },
  failed: { label: 'Fallito', variant: 'destructive' as const, color: 'bg-red-500' },
};

export default function ReportDetailPage() {
  const params = useParams();
  const router = useRouter();
  const reportId = params.id as string;

  const { data: report, isPending: isLoading } = useReport(reportId);
  const { data: module } = useModule(report?.module_id || 0);

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
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

  if (!report) {
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
              <p className="text-muted-foreground">Report non trovato</p>
            </div>
          </SidebarInset>
        </SidebarProvider>
      </AuthGuard>
    );
  }

  const status = statusConfig[report.status];

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
                  <div className="mb-6">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push('/reports')}
                      className="mb-4"
                    >
                      <IconArrowLeft className="mr-2 h-4 w-4" />
                      Torna ai Report
                    </Button>
                    <h1 className="text-2xl font-semibold">Dettaglio Report #{report.id}</h1>
                    <p className="text-muted-foreground text-sm">
                      Informazioni e stato del report
                    </p>
                  </div>

                  <div className="grid gap-6">
                    {/* Status Card */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Stato Report</CardTitle>
                        <CardDescription>Stato attuale dell'elaborazione</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <Badge variant={status.variant} className="text-base px-4 py-2">
                            <span className={`mr-2 inline-block h-3 w-3 rounded-full ${status.color}`}></span>
                            {status.label}
                          </Badge>
                          {report.status === 'completed' && (
                            <Button>
                              <IconDownload className="mr-2 h-4 w-4" />
                              Scarica Report
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Report Info Card */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Informazioni Report</CardTitle>
                        <CardDescription>Dettagli del report richiesto</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <div>
                            <dt className="text-sm font-medium text-muted-foreground">Tipo Report</dt>
                            <dd className="mt-1 text-base">{module?.display_name || 'N/A'}</dd>
                          </div>
                          <div>
                            <dt className="text-sm font-medium text-muted-foreground">Codice Fiscale</dt>
                            <dd className="mt-1 text-base font-mono">{report.input_data?.codice_fiscale || 'N/A'}</dd>
                          </div>
                          <div>
                            <dt className="text-sm font-medium text-muted-foreground">Data Richiesta</dt>
                            <dd className="mt-1 text-base">{formatDate(report.created_at)}</dd>
                          </div>
                          <div>
                            <dt className="text-sm font-medium text-muted-foreground">Ultima Modifica</dt>
                            <dd className="mt-1 text-base">{formatDate(report.updated_at)}</dd>
                          </div>
                          {report.completed_at && (
                            <div>
                              <dt className="text-sm font-medium text-muted-foreground">Data Completamento</dt>
                              <dd className="mt-1 text-base">{formatDate(report.completed_at)}</dd>
                            </div>
                          )}
                        </dl>
                      </CardContent>
                    </Card>

                    {/* Demo Content Card - Only show when completed */}
                    {report.status === 'completed' && (
                      <Card>
                        <CardHeader>
                          <CardTitle>Report Demo Pronto!</CardTitle>
                          <CardDescription>Il tuo report è stato elaborato con successo</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="rounded-lg border bg-muted/50 p-8 text-center">
                            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-green-500/10">
                              <svg
                                className="h-12 w-12 text-green-500"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                            </div>
                            <h3 className="mt-4 text-xl font-semibold">Report Demo Pronto!</h3>
                            <p className="mt-2 text-muted-foreground">
                              Il report è stato elaborato e può essere scaricato.
                            </p>
                            <Button className="mt-6" size="lg">
                              <IconDownload className="mr-2 h-5 w-5" />
                              Scarica Report PDF
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Processing Card */}
                    {report.status === 'processing' && (
                      <Card>
                        <CardHeader>
                          <CardTitle>Elaborazione in Corso</CardTitle>
                          <CardDescription>Il report è in fase di elaborazione</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="rounded-lg border bg-blue-500/5 p-8 text-center">
                            <div className="mx-auto flex h-24 w-24 items-center justify-center">
                              <div className="h-16 w-16 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
                            </div>
                            <h3 className="mt-4 text-xl font-semibold">Elaborazione in Corso</h3>
                            <p className="mt-2 text-muted-foreground">
                              Il report verrà elaborato a breve. Riceverai una notifica al completamento.
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Pending Card */}
                    {report.status === 'pending' && (
                      <Card>
                        <CardHeader>
                          <CardTitle>In Attesa</CardTitle>
                          <CardDescription>Il report è in coda per l'elaborazione</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="rounded-lg border bg-yellow-500/5 p-8 text-center">
                            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-yellow-500/10">
                              <svg
                                className="h-12 w-12 text-yellow-500"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                            </div>
                            <h3 className="mt-4 text-xl font-semibold">In Attesa di Elaborazione</h3>
                            <p className="mt-2 text-muted-foreground">
                              Il report è stato ricevuto e verrà elaborato a breve.
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    )}
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