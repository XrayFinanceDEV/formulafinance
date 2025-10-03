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

function ProfilePageContent() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [name, setName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Initialize form when user loads
  useEffect(() => {
    if (!loading && user) {
      setName(user.user_metadata?.full_name || '');
      setAvatarUrl(user.user_metadata?.avatar_url || '');
    }
  }, [user, loading]);

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
          <div className="mx-auto w-full max-w-2xl">
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