'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AuthGuard } from '@/components/auth-guard';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { toast } from 'sonner';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { License } from '@/types/auth';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Calendar, AlertCircle } from 'lucide-react';

function ProfilePageContent() {
  const router = useRouter();
  const { user, role, loading } = useAuth();
  const [name, setName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [userLicenses, setUserLicenses] = useState<License[]>([]);
  const [licensesLoading, setLicensesLoading] = useState(false);

  // Show licenses for cliente and potenziale users
  const showLicenses = role === 'cliente' || role === 'potenziale';

  // Initialize form when user loads
  useEffect(() => {
    if (!loading && user) {
      setName(user.user_metadata?.full_name || '');
      setAvatarUrl(user.user_metadata?.avatar_url || '');
    }
  }, [user, loading]);

  // Fetch user licenses for cliente and potenziale users
  useEffect(() => {
    if (!loading && showLicenses) {
      setLicensesLoading(true);
      fetch('/api/user-licenses')
        .then(res => res.json())
        .then(data => {
          setUserLicenses(data.data || []);
        })
        .catch(error => {
          console.error('Error fetching licenses:', error);
          toast.error('Errore durante il caricamento delle licenze');
        })
        .finally(() => {
          setLicensesLoading(false);
        });
    }
  }, [loading, showLicenses]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) throw new Error('No user found');

      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: name,
          avatar_url: avatarUrl,
        }
      });

      if (error) throw error;

      toast.success('Profilo aggiornato con successo');
      // Refresh the page to update the user data
      window.location.reload();
    } catch (error: any) {
      console.error('Update profile error:', error);
      toast.error(error.message || 'Errore durante l\'aggiornamento del profilo');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetPassword = () => {
    toast.info('Funzionalità di reset password in arrivo');
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Caricamento...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const initials = (user.user_metadata?.full_name || user.email?.split('@')[0] || 'U')
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <SiteHeader
          title="Profilo Utente"
          breadcrumbs={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Profilo' },
          ]}
        />

        <div className="flex flex-1 flex-col gap-4 p-4">
          <div className="mx-auto w-full max-w-6xl space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Informazioni Profilo</CardTitle>
                <CardDescription>
                  Gestisci le informazioni del tuo account
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Avatar Section */}
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={avatarUrl || user.user_metadata?.avatar_url} alt={name || user.user_metadata?.full_name || user.email || 'User'} />
                    <AvatarFallback className="text-lg">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <Label htmlFor="avatar">URL Avatar</Label>
                    <Input
                      id="avatar"
                      type="url"
                      placeholder="https://example.com/avatar.jpg"
                      value={avatarUrl}
                      onChange={(e) => setAvatarUrl(e.target.value)}
                      className="mt-1"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Inserisci l'URL di un'immagine per il tuo avatar
                    </p>
                  </div>
                </div>

                {/* Name Field */}
                <div className="space-y-2">
                  <Label htmlFor="name">Nome Completo</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Mario Rossi"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                {/* Email Field (Read-only) */}
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={user.email || ''}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">
                    L'email non può essere modificata
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex-1"
                  >
                    {isSaving ? 'Salvataggio...' : 'Salva Modifiche'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleResetPassword}
                    className="flex-1"
                  >
                    Reimposta Password
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Licenses Section - Only for cliente and potenziale users */}
            {showLicenses && (
              <Card>
                <CardHeader>
                  <CardTitle>Le Tue Licenze</CardTitle>
                  <CardDescription>
                    Visualizza le licenze disponibili e il loro utilizzo
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {licensesLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <p className="text-muted-foreground">Caricamento licenze...</p>
                    </div>
                  ) : userLicenses.length === 0 ? (
                    <div className="flex items-center justify-center py-8">
                      <p className="text-muted-foreground">Nessuna licenza disponibile</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Prodotto</TableHead>
                          <TableHead>Stato</TableHead>
                          <TableHead>Disponibili</TableHead>
                          <TableHead>Utilizzate</TableHead>
                          <TableHead>Totali</TableHead>
                          <TableHead>Utilizzo</TableHead>
                          <TableHead>Scadenza</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {userLicenses.map((license) => {
                          const remaining = license.quantity_total - license.quantity_used;
                          const usagePercentage = Math.round((license.quantity_used / license.quantity_total) * 100);
                          const expirationDate = new Date(license.expiration_date);
                          const isExpired = expirationDate < new Date() || license.status === 'expired';
                          const thirtyDaysFromNow = new Date();
                          thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
                          const isExpiringSoon = expirationDate <= thirtyDaysFromNow && expirationDate > new Date();

                          return (
                            <TableRow key={license.id}>
                              <TableCell className="font-medium">
                                {license.module?.display_name || `Modulo ${license.module_id}`}
                              </TableCell>
                              <TableCell>
                                {isExpired ? (
                                  <Badge variant="destructive">Scaduta</Badge>
                                ) : license.status === 'suspended' ? (
                                  <Badge variant="secondary">Sospesa</Badge>
                                ) : isExpiringSoon ? (
                                  <Badge variant="outline" className="border-yellow-500 text-yellow-600">
                                    In scadenza
                                  </Badge>
                                ) : (
                                  <Badge variant="default" className="bg-green-500">Attiva</Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                <span className={remaining === 0 ? 'text-red-600 font-semibold' : 'text-green-600 font-semibold'}>
                                  {remaining}
                                </span>
                              </TableCell>
                              <TableCell>{license.quantity_used}</TableCell>
                              <TableCell>{license.quantity_total}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2 min-w-[150px]">
                                  <Progress
                                    value={usagePercentage}
                                    className="h-2"
                                  />
                                  <span className="text-xs text-muted-foreground min-w-[40px]">
                                    {usagePercentage}%
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  {isExpired && <AlertCircle className="h-4 w-4 text-red-600" />}
                                  {isExpiringSoon && !isExpired && <AlertCircle className="h-4 w-4 text-yellow-600" />}
                                  <span className={isExpired ? 'text-red-600' : isExpiringSoon ? 'text-yellow-600' : ''}>
                                    {expirationDate.toLocaleDateString('it-IT')}
                                  </span>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default function ProfilePage() {
  return (
    <AuthGuard>
      <ProfilePageContent />
    </AuthGuard>
  );
}