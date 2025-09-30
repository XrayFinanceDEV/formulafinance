"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { IconArrowLeft, IconCheck, IconPlus, IconX } from "@tabler/icons-react"
import { Building2, User, MapPin, CreditCard, Settings, CheckCircle, Circle, ArrowRight, ArrowLeft } from "lucide-react"
import { z } from "zod"
import { sqliteDataProvider } from '@/lib/sqlite-data-provider'

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { LicenseUsageCard } from "@/components/license-usage-card"
import { LicenseAssignmentDialogDemo } from "@/components/license-assignment-dialog-demo"
import { License } from '@/types/auth'
import { useToast } from '@/hooks/use-toast'

const customerSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string(),
  type: z.string(),
  licenseUsage: z.number(),
  maxLicenses: z.number(),
  status: z.string(),
  joinDate: z.string(),
})

type Customer = z.infer<typeof customerSchema>

interface CustomerDetailFormProps {
  customer: Customer
}

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


// Mock data per licenze
const mockLicenses = [
  {
    id: 1,
    name: "MCC",
    status: "attiva",
    dateRange: "11 nov 2022 - 11 nov 2028",
    duration: "tra 3 anni",
    price: "€ --",
    usage: { current: 0, max: 10 }
  }
]

// Mock data per contatti collegati
const mockLinkedContacts = [
  { id: 1, name: "AteneoWeb Srl", type: "rivenditore", location: "Piacenza PC", status: "attivo" },
  { id: 2, name: "SYSDATA CONSULENZE", type: "cliente", location: "Manzano UD", status: "attivo" },
  { id: 3, name: "Guagliumi Christian", type: "cliente", location: "Novi di Modena MO", status: "attivo" },
  { id: 4, name: "Brambati Spa", type: "cliente", location: "Codeglia pv", status: "attivo" },
  { id: 5, name: "Spazio srl stp", type: "cliente", location: "Vilminore Di Scalve BG", status: "attivo" }
]

// Mock license data for demo
const mockLicensesData: License[] = [
  {
    id: 1,
    user_id: 1,
    module_id: 1,
    quantity_total: 100,
    quantity_used: 25,
    activation_date: '2025-01-01',
    expiration_date: '2026-01-01',
    status: 'active',
    module: {
      id: 1,
      name: 'report_de_minimis',
      display_name: 'Report De Minimis',
      is_active: true,
    }
  },
  {
    id: 2,
    user_id: 1,
    module_id: 2,
    quantity_total: 200,
    quantity_used: 180,
    activation_date: '2024-12-01',
    expiration_date: '2025-12-01',
    status: 'active',
    module: {
      id: 2,
      name: 'analisi_bilancio',
      display_name: 'Analisi Bilancio',
      is_active: true,
    }
  },
  {
    id: 3,
    user_id: 1,
    module_id: 3,
    quantity_total: 50,
    quantity_used: 45,
    activation_date: '2024-06-01',
    expiration_date: '2025-10-15',
    status: 'active',
    module: {
      id: 3,
      name: 'analisi_centrale_rischi',
      display_name: 'Analisi Centrale Rischi',
      is_active: true,
    }
  },
];

export function CustomerDetailForm({ customer }: CustomerDetailFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isUpdating, setIsUpdating] = React.useState(false)
  const [currentStep, setCurrentStep] = React.useState(1)
  const [isAssignDialogOpen, setIsAssignDialogOpen] = React.useState(false)
  const canManageLicenses = true // Simulating superuser role

  const steps = [
    { id: 1, title: "Anagrafica", description: "Informazioni aziendali di base", icon: Building2 },
    { id: 2, title: "Riferimenti", description: "Email e contatti telefonici", icon: User },
    { id: 3, title: "Indirizzo", description: "Sede legale e operativa", icon: MapPin },
    { id: 4, title: "Licenze", description: "Configurazione moduli e permessi", icon: Settings }
  ]

  const [formData, setFormData] = React.useState({
    ragioneSociale: customer.name || '',
    partitaIva: "01316560331",
    codiceFiscale: "01316560331",
    tipoUtente: customer.type?.toLowerCase() || 'cliente',
    soggetto: "societa", // Database expects "societa" not "società"
    stato: customer.status?.toLowerCase() || 'attivo',
    email: customer.email || '',
    pecEmail: "",
    telefono: "",
    telefonoAlt: "",
    indirizzo: "Via Gregorio X, 46",
    città: "Piacenza",
    cap: "29121",
    provincia: "PC",
    associatoA: "AteneoWeb Srl",
    noteAggiuntive: ""
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    setIsUpdating(true)
    try {
      await sqliteDataProvider.update('customers', {
        id: customer.id,
        data: {
          ragione_sociale: formData.ragioneSociale,
          email: formData.email,
          tipo_utente: formData.tipoUtente,
          stato: formData.stato,
          partita_iva: formData.partitaIva,
          codice_fiscale: formData.codiceFiscale,
          soggetto: formData.soggetto,
          pec_email: formData.pecEmail,
          telefono: formData.telefono,
          telefono_alt: formData.telefonoAlt,
          via: formData.indirizzo,
          citta: formData.città,
          cap: formData.cap,
          provincia: formData.provincia,
          note_aggiuntive: formData.noteAggiuntive,
        },
        previousData: customer,
      })

      toast({
        title: "Successo",
        description: "Cliente aggiornato con successo",
      })

      router.push('/customers')
    } catch (error) {
      toast({
        title: "Errore",
        description: "Errore durante l'aggiornamento del cliente",
        variant: "destructive",
      })
      console.error('Update error:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleCancel = () => {
    router.push('/customers')
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2)
  }

  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/customers" className="hover:text-foreground">
          Lista Contatti
        </Link>
        <span>/</span>
        <span>Dettaglio Contatto</span>
      </div>

      {/* Header with Avatar and Basic Info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="w-20 h-20">
            <AvatarFallback className="text-lg font-semibold bg-orange-500 text-white">
              {getInitials(customer.name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-3xl font-semibold">{customer.name}</h1>
            <p className="text-muted-foreground">{formData.indirizzo} - {formData.città} ({formData.provincia})</p>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-blue-600 border-blue-200">
                {customer.type} {formData.soggetto}
              </Badge>
              <span className="text-muted-foreground">collegato a</span>
              <Button variant="link" className="p-0 h-auto text-blue-600">
                {formData.associatoA}
              </Button>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleCancel} disabled={isUpdating}>
            annulla
          </Button>
          <Button size="sm" onClick={handleSave} disabled={isUpdating}>
            <IconCheck className="w-4 h-4 mr-1" />
            {isUpdating ? 'Salvataggio...' : 'Salva'}
          </Button>
        </div>
      </div>

      {/* Step Navigation */}
      <div className="space-y-6">
        {/* Step Progress */}
        <div className="flex items-center justify-between mb-8">
          {steps.map((step, index) => {
            const Icon = step.icon
            const isActive = currentStep === step.id
            const isCompleted = currentStep > step.id

            return (
              <div key={step.id} className="flex items-center flex-1">
                <button
                  onClick={() => setCurrentStep(step.id)}
                  className="flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer"
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    isCompleted
                      ? 'bg-primary text-primary-foreground'
                      : isActive
                        ? 'bg-primary/10 text-primary border-2 border-primary'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}>
                    {isCompleted ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <Icon className="w-5 h-5" />
                    )}
                  </div>
                  <div className="hidden lg:block text-left">
                    <div className={`font-medium ${isActive ? 'text-primary' : isCompleted ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
                      {step.title}
                    </div>
                    <div className="text-sm text-muted-foreground">{step.description}</div>
                  </div>
                </button>
                {index < steps.length - 1 && (
                  <div className={`flex-1 h-px mx-4 ${
                    currentStep > step.id ? 'bg-primary' : 'bg-border'
                  }`} />
                )}
              </div>
            )
          })}
        </div>

        {/* Step Content */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <Building2 className="w-6 h-6 text-primary" />
              <div>
                <h2 className="text-2xl font-semibold">Anagrafica</h2>
                <p className="text-muted-foreground">Inserisci le informazioni aziendali di base del contatto.</p>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Colonna principale */}
            <div className="lg:col-span-2 space-y-6">
              {/* Dati Anagrafici */}
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-3">
                      <Label htmlFor="ragioneSociale" className="text-sm font-medium">
                        Ragione Sociale <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="ragioneSociale"
                        value={formData.ragioneSociale}
                        onChange={(e) => handleInputChange('ragioneSociale', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="tipoUtente" className="text-sm font-medium">
                        Tipo Utente <span className="text-red-500">*</span>
                      </Label>
                      <Select value={formData.tipoUtente} onValueChange={(value) => handleInputChange('tipoUtente', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cliente">Cliente</SelectItem>
                          <SelectItem value="intermediario">Intermediario</SelectItem>
                          <SelectItem value="rivenditore">Rivenditore</SelectItem>
                          <SelectItem value="potenziale">Potenziale</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="soggetto" className="text-sm font-medium">
                        Soggetto
                      </Label>
                      <Select value={formData.soggetto} onValueChange={(value) => handleInputChange('soggetto', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="professionista">Professionista</SelectItem>
                          <SelectItem value="società">Società</SelectItem>
                          <SelectItem value="pa">PA</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="stato" className="text-sm font-medium">
                        Stato <span className="text-red-500">*</span>
                      </Label>
                      <Select value={formData.stato} onValueChange={(value) => handleInputChange('stato', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="attivo">Attivo</SelectItem>
                          <SelectItem value="disabilitato">Disabilitato</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="partitaIva" className="text-sm font-medium">
                        P.Iva <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="partitaIva"
                        value={formData.partitaIva}
                        onChange={(e) => handleInputChange('partitaIva', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="codiceFiscale" className="text-sm font-medium">
                        Codice Fiscale
                      </Label>
                      <Input
                        id="codiceFiscale"
                        value={formData.codiceFiscale}
                        onChange={(e) => handleInputChange('codiceFiscale', e.target.value)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Riferimenti */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Riferimenti</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="email" className="text-sm font-medium">
                        Email <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="pecEmail" className="text-sm font-medium">
                        PEC Email
                      </Label>
                      <Input
                        id="pecEmail"
                        type="email"
                        value={formData.pecEmail}
                        onChange={(e) => handleInputChange('pecEmail', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="telefono" className="text-sm font-medium">
                        Telefono
                      </Label>
                      <Input
                        id="telefono"
                        value={formData.telefono}
                        onChange={(e) => handleInputChange('telefono', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="telefonoAlt" className="text-sm font-medium">
                        Telefono Alt
                      </Label>
                      <Input
                        id="telefonoAlt"
                        value={formData.telefonoAlt}
                        onChange={(e) => handleInputChange('telefonoAlt', e.target.value)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Indirizzo */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Indirizzo</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="indirizzo" className="text-sm font-medium">
                      Via / Indirizzo <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="indirizzo"
                      value={formData.indirizzo}
                      onChange={(e) => handleInputChange('indirizzo', e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="città" className="text-sm font-medium">
                        Città <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="città"
                        value={formData.città}
                        onChange={(e) => handleInputChange('città', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="cap" className="text-sm font-medium">
                        CAP <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="cap"
                        value={formData.cap}
                        onChange={(e) => handleInputChange('cap', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="provincia" className="text-sm font-medium">
                        Prov. <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="provincia"
                        value={formData.provincia}
                        onChange={(e) => handleInputChange('provincia', e.target.value)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Associato/Collegato a */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Associato/Collegato a</CardTitle>
                  <CardDescription>
                    selezionare un contatto per creare l'associazione con il parent
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Input
                      value={formData.associatoA}
                      onChange={(e) => handleInputChange('associatoA', e.target.value)}
                      className="flex-1"
                    />
                    <Button variant="outline" size="icon">
                      <IconX className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="mt-2 text-sm text-blue-600">
                    199# AteneoWeb Srl
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Via Gregorio X, 46 - Piacenza (PC)
                  </div>
                </CardContent>
              </Card>

              {/* Note Aggiuntive */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Note Aggiuntive</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={formData.noteAggiuntive}
                    onChange={(e) => handleInputChange('noteAggiuntive', e.target.value)}
                    placeholder="Inserisci note..."
                    className="min-h-[100px]"
                  />
                </CardContent>
              </Card>
            </div>
            </div>
          </div>
        )}

        {/* Step 2: Riferimenti */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <User className="w-6 h-6 text-primary" />
              <div>
                <h2 className="text-2xl font-semibold">Riferimenti</h2>
                <p className="text-muted-foreground">Inserisci email e contatti telefonici.</p>
              </div>
            </div>
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email" className="text-sm font-medium">
                      Email <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="pecEmail" className="text-sm font-medium">
                      PEC Email
                    </Label>
                    <Input
                      id="pecEmail"
                      type="email"
                      value={formData.pecEmail}
                      onChange={(e) => handleInputChange('pecEmail', e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="telefono" className="text-sm font-medium">
                      Telefono
                    </Label>
                    <Input
                      id="telefono"
                      value={formData.telefono}
                      onChange={(e) => handleInputChange('telefono', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="telefonoAlt" className="text-sm font-medium">
                      Telefono Alt
                    </Label>
                    <Input
                      id="telefonoAlt"
                      value={formData.telefonoAlt}
                      onChange={(e) => handleInputChange('telefonoAlt', e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 3: Indirizzo */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <MapPin className="w-6 h-6 text-primary" />
              <div>
                <h2 className="text-2xl font-semibold">Indirizzo</h2>
                <p className="text-muted-foreground">Inserisci la sede legale e operativa.</p>
              </div>
            </div>
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div>
                  <Label htmlFor="indirizzo" className="text-sm font-medium">
                    Via / Indirizzo <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="indirizzo"
                    value={formData.indirizzo}
                    onChange={(e) => handleInputChange('indirizzo', e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="città" className="text-sm font-medium">
                      Città <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="città"
                      value={formData.città}
                      onChange={(e) => handleInputChange('città', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="cap" className="text-sm font-medium">
                      CAP <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="cap"
                      value={formData.cap}
                      onChange={(e) => handleInputChange('cap', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="provincia" className="text-sm font-medium">
                      Prov. <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="provincia"
                      value={formData.provincia}
                      onChange={(e) => handleInputChange('provincia', e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 4: Licenze */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <Settings className="w-6 h-6 text-primary" />
              <div>
                <h2 className="text-2xl font-semibold">Licenze Associate</h2>
                <p className="text-muted-foreground">Gestisci la configurazione moduli e permessi.</p>
              </div>
            </div>

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
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {mockLicensesData.map((license) => (
                  <LicenseUsageCard
                    key={license.id}
                    license={license}
                    showActions={canManageLicenses}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-6">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 1 || isUpdating}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Indietro
          </Button>
          <Button
            onClick={currentStep === steps.length ? handleSave : nextStep}
            disabled={isUpdating}
            className="flex items-center gap-2"
          >
            {currentStep === steps.length ? (
              <>
                <IconCheck className="w-4 h-4" />
                {isUpdating ? 'Salvataggio...' : 'Salva Modifiche'}
              </>
            ) : (
              <>
                Avanti
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </div>
      </div>

      {/* License Assignment Dialog */}
      {canManageLicenses && (
        <LicenseAssignmentDialogDemo
          open={isAssignDialogOpen}
          onOpenChange={setIsAssignDialogOpen}
          userId={customer.id}
          userName={customer.name}
        />
      )}
    </div>
  )
}