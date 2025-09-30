'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { AuthGuard } from "@/components/auth-guard"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useModules } from "@/hooks/use-modules"
import { useCreateReport } from "@/hooks/use-reports"
import { toast } from "sonner"
import { IconFileText, IconChartBar, IconReportMoney } from "@tabler/icons-react"

export default function NewReportPage() {
  const router = useRouter();
  const { data: modules, isLoading } = useModules();
  const { createReport, isLoading: isCreating } = useCreateReport();

  const [selectedModule, setSelectedModule] = useState<{ id: number; name: string; display_name: string } | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showFormDialog, setShowFormDialog] = useState(false);
  const [codiceFiscale, setCodiceFiscale] = useState('');

  const moduleIcons = {
    de_minimis: IconReportMoney,
    balance_analysis: IconChartBar,
    cr_analysis: IconFileText,
  };

  const handleRequestClick = (module: any) => {
    setSelectedModule(module);
    setShowConfirmDialog(true);
  };

  const handleConfirm = () => {
    setShowConfirmDialog(false);
    setShowFormDialog(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedModule || !codiceFiscale) return;

    try {
      await createReport({
        module_id: selectedModule.id,
        report_type: selectedModule.name,
        input_data: { codice_fiscale: codiceFiscale },
      });

      setShowFormDialog(false);
      setCodiceFiscale('');

      toast.success('Il report richiesto è in elaborazione, controlla lo stato nell\'elenco report richiesti');

      // Redirect to reports list
      setTimeout(() => {
        router.push('/reports');
      }, 2000);
    } catch (error) {
      toast.error('Errore nella creazione del report');
    }
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
                    <h1 className="text-2xl font-semibold">Richiedi Report</h1>
                    <p className="text-muted-foreground text-sm">
                      Seleziona il tipo di report da richiedere
                    </p>
                  </div>

                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {modules?.data?.map((module) => {
                      const IconComponent = moduleIcons[module.name as keyof typeof moduleIcons] || IconFileText;

                      return (
                        <Card key={module.id} className="flex flex-col">
                          <CardHeader>
                            <div className="mb-2 flex items-center gap-2">
                              <div className="rounded-lg bg-primary/10 p-2">
                                <IconComponent className="h-6 w-6 text-primary" />
                              </div>
                            </div>
                            <CardTitle>{module.display_name}</CardTitle>
                            <CardDescription>{module.description}</CardDescription>
                          </CardHeader>
                          <CardContent className="flex-1">
                            <div className="text-sm text-muted-foreground">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">Costo:</span>
                                <span>1 credito</span>
                              </div>
                            </div>
                          </CardContent>
                          <CardFooter>
                            <Button
                              className="w-full"
                              onClick={() => handleRequestClick(module)}
                            >
                              Richiedi Report
                            </Button>
                          </CardFooter>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Conferma Richiesta Report</DialogTitle>
            <DialogDescription>
              Stai per richiedere il report <strong>{selectedModule?.display_name}</strong>.
              <br />
              <br />
              Verrà consumato <strong>1 credito</strong> per elaborare questo report.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Annulla
            </Button>
            <Button onClick={handleConfirm}>
              Conferma
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Codice Fiscale Form Dialog */}
      <Dialog open={showFormDialog} onOpenChange={setShowFormDialog}>
        <DialogContent>
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Inserisci Codice Fiscale</DialogTitle>
              <DialogDescription>
                Inserisci il codice fiscale per il quale richiedere il report
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="codice_fiscale">Codice Fiscale</Label>
                <Input
                  id="codice_fiscale"
                  placeholder="RSSMRA80A01H501U"
                  value={codiceFiscale}
                  onChange={(e) => setCodiceFiscale(e.target.value.toUpperCase())}
                  required
                  maxLength={16}
                  className="uppercase"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowFormDialog(false)}
              >
                Annulla
              </Button>
              <Button type="submit" disabled={isCreating || !codiceFiscale}>
                {isCreating ? 'Invio...' : 'Richiedi'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AuthGuard>
  );
}