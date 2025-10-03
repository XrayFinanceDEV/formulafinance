'use client';

import { useRouter } from 'next/navigation';
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { AuthGuard } from "@/components/auth-guard"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useReports } from "@/hooks/use-reports-query"
import { useModules } from "@/hooks/use-modules-query"
import { IconPlus } from "@tabler/icons-react"

const statusConfig = {
  pending: { label: 'In Attesa', variant: 'secondary' as const, color: 'bg-yellow-500' },
  processing: { label: 'In Elaborazione', variant: 'default' as const, color: 'bg-blue-500' },
  completed: { label: 'Completato', variant: 'default' as const, color: 'bg-green-500' },
  failed: { label: 'Fallito', variant: 'destructive' as const, color: 'bg-red-500' },
};

export default function ReportsPage() {
  const router = useRouter();
  const { data: reports, isPending: isLoading } = useReports();
  const { data: modules } = useModules();

  const getModuleName = (moduleId: number) => {
    const module = modules?.data?.find((m) => m.id === moduleId);
    return module?.display_name || 'N/A';
  };

  const formatDate = (dateString: string) => {
    if (typeof window === 'undefined') {
      // Server-side: return ISO string to avoid hydration mismatch
      return new Date(dateString).toISOString().slice(0, 16).replace('T', ' ');
    }
    return new Date(dateString).toLocaleString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

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
                  <div className="mb-6 flex items-center justify-between">
                    <div>
                      <h1 className="text-2xl font-semibold">Report Richiesti</h1>
                      <p className="text-muted-foreground text-sm">
                        Visualizza e gestisci tutti i report richiesti
                      </p>
                    </div>
                    <Button onClick={() => router.push('/reports/new')}>
                      <IconPlus className="mr-2 h-4 w-4" />
                      Richiedi Report
                    </Button>
                  </div>

                  {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <p className="text-muted-foreground">Caricamento...</p>
                    </div>
                  ) : (
                    <div className="rounded-lg border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>ID</TableHead>
                            <TableHead>Tipo Report</TableHead>
                            <TableHead>Codice Fiscale</TableHead>
                            <TableHead>Stato</TableHead>
                            <TableHead>Data Richiesta</TableHead>
                            <TableHead className="text-right">Azioni</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {reports?.data && reports.data.length > 0 ? (
                            reports.data.map((report) => {
                              const status = statusConfig[report.status];
                              return (
                                <TableRow key={report.id}>
                                  <TableCell className="font-medium">#{report.id}</TableCell>
                                  <TableCell>{getModuleName(report.module_id)}</TableCell>
                                  <TableCell className="font-mono text-sm">
                                    {report.input_data?.codice_fiscale || 'N/A'}
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant={status.variant}>
                                      <span className={`mr-1 inline-block h-2 w-2 rounded-full ${status.color}`}></span>
                                      {status.label}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>{formatDate(report.created_at)}</TableCell>
                                  <TableCell className="text-right">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => router.push(`/reports/${report.id}`)}
                                    >
                                      Dettagli
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              );
                            })
                          ) : (
                            <TableRow>
                              <TableCell colSpan={6} className="text-center py-8">
                                <p className="text-muted-foreground">Nessun report trovato</p>
                                <Button
                                  variant="link"
                                  onClick={() => router.push('/reports/new')}
                                  className="mt-2"
                                >
                                  Richiedi il tuo primo report
                                </Button>
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </AuthGuard>
  );
}