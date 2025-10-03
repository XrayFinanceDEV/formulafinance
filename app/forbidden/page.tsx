import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ShieldAlert } from 'lucide-react'

export default function ForbiddenPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        <div className="mb-6 flex justify-center">
          <div className="rounded-full bg-red-100 p-3">
            <ShieldAlert className="h-12 w-12 text-red-600" />
          </div>
        </div>

        <h1 className="mb-2 text-3xl font-bold">Accesso Negato</h1>
        <p className="mb-6 text-muted-foreground">
          Non hai i permessi necessari per accedere a questa pagina.
        </p>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button asChild variant="default">
            <Link href="/dashboard">Torna alla Dashboard</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/profile">Vai al Profilo</Link>
          </Button>
        </div>

        <div className="mt-8 rounded-lg bg-muted p-4 text-sm">
          <p className="font-semibold text-muted-foreground">Ruoli e Permessi</p>
          <ul className="mt-2 space-y-1 text-left text-muted-foreground">
            <li>
              <strong>Cliente/Potenziale:</strong> Accesso al proprio account e report
            </li>
            <li>
              <strong>Rivenditore/Intermediario:</strong> Gestione clienti associati
            </li>
            <li>
              <strong>Superadmin:</strong> Accesso completo al sistema
            </li>
          </ul>
        </div>

        <div className="mt-4 text-sm text-muted-foreground">
          <p>
            Se pensi di aver ricevuto questo messaggio per errore, contatta l&apos;amministratore.
          </p>
        </div>
      </div>
    </div>
  )
}
