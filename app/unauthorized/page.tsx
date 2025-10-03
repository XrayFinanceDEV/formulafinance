import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        <div className="mb-6 flex justify-center">
          <div className="rounded-full bg-yellow-100 p-3">
            <AlertCircle className="h-12 w-12 text-yellow-600" />
          </div>
        </div>

        <h1 className="mb-2 text-3xl font-bold">Accesso Non Autorizzato</h1>
        <p className="mb-6 text-muted-foreground">
          Il tuo account non ha un ruolo assegnato. Contatta l&apos;amministratore per ottenere l&apos;accesso.
        </p>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button asChild variant="default">
            <Link href="/auth/login">Torna al Login</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/profile">Vai al Profilo</Link>
          </Button>
        </div>

        <div className="mt-8 rounded-lg bg-muted p-4 text-sm text-muted-foreground">
          <p className="font-semibold">Hai bisogno di aiuto?</p>
          <p className="mt-1">
            Contatta il supporto all&apos;indirizzo{' '}
            <a href="mailto:support@formulafinance.it" className="underline">
              support@formulafinance.it
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
