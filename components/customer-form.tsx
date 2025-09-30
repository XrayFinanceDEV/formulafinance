"use client"

import { useState } from "react"
import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { useRouter } from "next/navigation"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Circle, ArrowRight, ArrowLeft, Building2, User, MapPin, CreditCard, Settings } from "lucide-react"
import { useCreateCustomer, type Customer } from "@/hooks/use-customers"
import { toast } from "sonner"

// Step 1: Anagrafica Schema
const anagraficaSchema = z.object({
  ragioneSociale: z.string().min(2, {
    message: "La ragione sociale deve essere di almeno 2 caratteri.",
  }),
  partitaIva: z.string().min(11, {
    message: "La Partita IVA deve essere di almeno 11 caratteri.",
  }),
  codiceFiscale: z.string().optional(),
  tipoUtente: z.enum(["cliente", "intermediario", "rivenditore", "potenziale"]),
  soggetto: z.enum(["professionista", "societa", "pa"]),
  stato: z.enum(["attivo", "disabilitato"]).default("attivo"),
})

// Step 2: Riferimenti Schema
const riferimentiSchema = z.object({
  email: z.string().email({
    message: "Inserire un indirizzo email valido.",
  }),
  pecEmail: z.string().email().optional().or(z.literal("")),
  telefono: z.string().min(10, {
    message: "Il telefono deve essere di almeno 10 caratteri.",
  }),
  telefonoAlt: z.string().optional(),
})

// Step 3: Indirizzo Schema
const indirizzoSchema = z.object({
  via: z.string().min(5, {
    message: "L'indirizzo deve essere di almeno 5 caratteri.",
  }),
  citta: z.string().min(2, {
    message: "La città deve essere di almeno 2 caratteri.",
  }),
  cap: z.string().min(5, {
    message: "Il CAP deve essere di almeno 5 caratteri.",
  }),
  provincia: z.string().min(2, {
    message: "La provincia deve essere di almeno 2 caratteri.",
  }),
})

// Step 4: Relazioni Schema
const relazioniSchema = z.object({
  parentId: z.string().optional(), // Only for Cliente and Potenziale types
  noteAggiuntive: z.string().optional(),
})

// Step 5: Licenze Schema
const licenzeSchema = z.object({
  moduli: z.array(z.object({
    moduloId: z.string(),
    nomeModulo: z.string(),
    quantita: z.number().min(1, "La quantità deve essere almeno 1"),
    dataAttivazione: z.string(),
    dataScadenza: z.string(),
  })).min(1, "È richiesto almeno un modulo"),
})

// Combined Schema
const customerFormSchema = z.object({
  anagrafica: anagraficaSchema,
  riferimenti: riferimentiSchema,
  indirizzo: indirizzoSchema,
  relazioni: relazioniSchema,
  licenze: licenzeSchema,
})

type CustomerFormValues = z.infer<typeof customerFormSchema>

// Available modules (this would come from your API)
const moduliDisponibili = [
  { id: "1", name: "cr_advanced", displayName: "CR Avanzata", description: "Analisi avanzata del rischio di credito" },
  { id: "2", name: "balance_analysis", displayName: "Analisi di Bilancio", description: "Analisi del bilancio aziendale" },
  { id: "3", name: "competitors_balance", displayName: "Bilancio Competitors", description: "Analisi bilancio della concorrenza" },
]

export function CustomerForm() {
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedModules, setSelectedModules] = useState<string[]>([])
  const [userType, setUserType] = useState<string>("cliente")
  const router = useRouter()

  const { createCustomer, isLoading: isCreating } = useCreateCustomer()

  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: {
      anagrafica: {
        ragioneSociale: "",
        partitaIva: "",
        codiceFiscale: "",
        tipoUtente: "cliente",
        soggetto: "societa",
        stato: "attivo",
      },
      riferimenti: {
        email: "",
        pecEmail: "",
        telefono: "",
        telefonoAlt: "",
      },
      indirizzo: {
        via: "",
        citta: "",
        cap: "",
        provincia: "",
      },
      relazioni: {
        parentId: "",
        noteAggiuntive: "",
      },
      licenze: {
        moduli: []
      }
    },
  })

  // Watch for changes in user type
  const watchedUserType = form.watch("anagrafica.tipoUtente")

  // Update userType state when form value changes
  React.useEffect(() => {
    setUserType(watchedUserType)
    // Clear parentId if user type is rivenditore or intermediario
    if (watchedUserType === "rivenditore" || watchedUserType === "intermediario") {
      form.setValue("relazioni.parentId", "")
    }
  }, [watchedUserType, form])

  const steps = [
    { id: 1, title: "Anagrafica", description: "Informazioni aziendali di base", icon: Building2 },
    { id: 2, title: "Riferimenti", description: "Email e contatti telefonici", icon: User },
    { id: 3, title: "Indirizzo", description: "Sede legale e operativa", icon: MapPin },
    { id: 4, title: "Relazioni", description: "Collegamenti e note aggiuntive", icon: CreditCard },
    { id: 5, title: "Licenze", description: "Configurazione moduli e permessi", icon: Settings }
  ]

  const getStepFieldName = (step: number) => {
    switch (step) {
      case 1: return 'anagrafica'
      case 2: return 'riferimenti'
      case 3: return 'indirizzo'
      case 4: return 'relazioni'
      case 5: return 'licenze'
      default: return 'anagrafica'
    }
  }

  const nextStep = async () => {
    const fieldName = getStepFieldName(currentStep)
    const isStepValid = await form.trigger(fieldName as any)
    if (isStepValid && currentStep < 5) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const addModule = (moduleId: string) => {
    if (!selectedModules.includes(moduleId)) {
      const module = moduliDisponibili.find(m => m.id === moduleId)
      if (module) {
        const currentModules = form.getValues("licenze.moduli") || []
        const newModule = {
          moduloId: moduleId,
          nomeModulo: module.displayName,
          quantita: 1,
          dataAttivazione: new Date().toISOString().split('T')[0],
          dataScadenza: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 year from now
        }
        form.setValue("licenze.moduli", [...currentModules, newModule])
        setSelectedModules([...selectedModules, moduleId])
      }
    }
  }

  const removeModule = (moduleId: string) => {
    const currentModules = form.getValues("licenze.moduli") || []
    const updatedModules = currentModules.filter(m => m.moduloId !== moduleId)
    form.setValue("licenze.moduli", updatedModules)
    setSelectedModules(selectedModules.filter(id => id !== moduleId))
  }

  const updateModuleQuantity = (moduleId: string, quantita: number) => {
    const currentModules = form.getValues("licenze.moduli") || []
    const updatedModules = currentModules.map(m =>
      m.moduloId === moduleId ? { ...m, quantita } : m
    )
    form.setValue("licenze.moduli", updatedModules)
  }

  const onSubmit = async (values: CustomerFormValues) => {
    try {
      // Map the customer type to match our data structure
      const typeMap: Record<string, Customer['type']> = {
        'cliente': 'Cliente',
        'rivenditore': 'Rivenditore',
        'intermediario': 'Intermediario',
        'potenziale': 'Potenziale'
      }

      // Calculate initial license usage (start at 0 for new customers)
      const totalLicenses = values.licenze.moduli.reduce((acc, modulo) => acc + modulo.quantita, 0)

      // Map status
      const statusMap: Record<string, Customer['status']> = {
        'attivo': 'Attivo',
        'disabilitato': 'Attivo' // We don't have a disabled status in our Customer type
      }

      // Create customer data matching our Customer interface
      const customerData: Omit<Customer, 'id' | 'joinDate'> = {
        name: values.anagrafica.ragioneSociale,
        email: values.riferimenti.email,
        type: typeMap[values.anagrafica.tipoUtente] || 'Cliente',
        licenseUsage: 0, // Start at 0 for new customers
        maxLicenses: totalLicenses || 10, // Default to 10 if no licenses configured
        status: statusMap[values.anagrafica.stato] || 'Attivo'
      }

      // Save to fake API
      await createCustomer(customerData)

      toast.success('Cliente creato con successo!', {
        description: `${customerData.name} è stato aggiunto al sistema.`
      })

      // Redirect to customers list
      router.push('/customers')
    } catch (error) {
      console.error('Error creating customer:', error)
      toast.error('Errore durante la creazione', {
        description: 'Si è verificato un errore durante il salvataggio del cliente.'
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-8 overflow-x-auto">
        {steps.map((step, index) => {
          const StepIcon = step.icon
          return (
            <div key={step.id} className="flex items-center min-w-0">
              <div className="flex flex-col items-center">
                <div className={`flex items-center justify-center w-12 h-12 rounded-full transition-colors ${
                  currentStep >= step.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {currentStep > step.id ? (
                    <CheckCircle className="w-6 h-6" />
                  ) : (
                    <StepIcon className="w-6 h-6" />
                  )}
                </div>
                <div className="text-center mt-2 max-w-24">
                  <div className="text-sm font-medium">{step.title}</div>
                  <div className="text-xs text-muted-foreground">{step.description}</div>
                </div>
              </div>
              {index < steps.length - 1 && (
                <div className={`h-px w-8 mx-4 ${
                  currentStep > step.id ? 'bg-primary' : 'bg-muted'
                }`} />
              )}
            </div>
          )
        })}
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

          {/* Step 1: Anagrafica */}
          {currentStep === 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  Anagrafica
                </CardTitle>
                <CardDescription>
                  Inserisci le informazioni aziendali di base del nuovo contatto.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="anagrafica.ragioneSociale"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ragione Sociale *</FormLabel>
                      <FormControl>
                        <Input placeholder="Inserisci la ragione sociale" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="anagrafica.partitaIva"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>P.IVA *</FormLabel>
                        <FormControl>
                          <Input placeholder="Inserisci la Partita IVA" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="anagrafica.codiceFiscale"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Codice Fiscale</FormLabel>
                        <FormControl>
                          <Input placeholder="Inserisci il Codice Fiscale" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="anagrafica.tipoUtente"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo Utente *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="- seleziona la tipo -" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="cliente">Cliente</SelectItem>
                            <SelectItem value="rivenditore">Rivenditore</SelectItem>
                            <SelectItem value="intermediario">Intermediario</SelectItem>
                            <SelectItem value="potenziale">Potenziale</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="anagrafica.soggetto"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Soggetto *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="- seleziona -" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="professionista">Professionista</SelectItem>
                            <SelectItem value="societa">Società</SelectItem>
                            <SelectItem value="pa">P.A.</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="anagrafica.stato"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Stato *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="- seleziona lo stato -" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="attivo">Attivo</SelectItem>
                            <SelectItem value="disabilitato">Disabilitato</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Riferimenti */}
          {currentStep === 2 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Riferimenti
                </CardTitle>
                <CardDescription>
                  Inserisci email e contatti telefonici per le comunicazioni.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="riferimenti.email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email *</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="Inserisci l'indirizzo email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="riferimenti.pecEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>PEC Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="Inserisci l'indirizzo PEC" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="riferimenti.telefono"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefono *</FormLabel>
                        <FormControl>
                          <Input type="tel" placeholder="Inserisci il numero di telefono" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="riferimenti.telefonoAlt"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefono Alternativo</FormLabel>
                        <FormControl>
                          <Input type="tel" placeholder="Inserisci telefono alternativo" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Indirizzo */}
          {currentStep === 3 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Indirizzo
                </CardTitle>
                <CardDescription>
                  Inserisci la sede legale o operativa del contatto.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="indirizzo.via"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Via / Indirizzo *</FormLabel>
                      <FormControl>
                        <Input placeholder="Inserisci l'indirizzo completo" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="indirizzo.citta"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Città *</FormLabel>
                        <FormControl>
                          <Input placeholder="Inserisci la città" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="indirizzo.cap"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CAP *</FormLabel>
                        <FormControl>
                          <Input placeholder="Inserisci il CAP" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="indirizzo.provincia"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Prov. *</FormLabel>
                        <FormControl>
                          <Input placeholder="Inserisci la provincia" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 4: Relazioni */}
          {currentStep === 4 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Relazioni
                </CardTitle>
                <CardDescription>
                  {userType === "cliente"
                    ? "Configura il collegamento con il tuo Rivenditore o Intermediario (opzionale)."
                    : userType === "rivenditore" || userType === "intermediario"
                    ? "Come " + userType + " potrai gestire i tuoi clienti collegati dopo la creazione dell'account."
                    : "Configura i collegamenti e aggiungi note aggiuntive."
                  }
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Show parent association only for Cliente and Potenziale */}
                {(userType === "cliente" || userType === "potenziale") && (
                  <FormField
                    control={form.control}
                    name="relazioni.parentId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {userType === "cliente" ? "Rivenditore/Intermediario di riferimento" : "Associato/Collegato a"}
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="cerca ragione sociale del rivenditore o intermediario..."
                            {...field}
                            className="cursor-pointer"
                          />
                        </FormControl>
                        <p className="text-xs text-muted-foreground">
                          {userType === "cliente"
                            ? "🔍 Opzionale: seleziona il rivenditore o intermediario che gestisce questo cliente"
                            : "🔍 Seleziona un contatto per creare l'associazione"
                          }
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {/* Information for Rivenditore and Intermediario */}
                {(userType === "rivenditore" || userType === "intermediario") && (
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h4 className="font-medium text-blue-900 mb-2">
                      ℹ️ Gestione Clienti
                    </h4>
                    <p className="text-sm text-blue-800">
                      Come <strong>{userType}</strong>, una volta creato questo account potrai:
                    </p>
                    <ul className="list-disc list-inside text-sm text-blue-800 mt-2 space-y-1">
                      <li>Aggiungere nuovi clienti sotto la tua gestione</li>
                      <li>Visualizzare tutti i clienti a te collegati</li>
                      <li>Gestire le licenze dei tuoi clienti</li>
                      <li>Monitorare l'utilizzo delle licenze</li>
                    </ul>
                  </div>
                )}

                <FormField
                  control={form.control}
                  name="relazioni.noteAggiuntive"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Note Aggiuntive</FormLabel>
                      <FormControl>
                        <textarea
                          className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          placeholder="Inserisci eventuali note o informazioni aggiuntive..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          )}

          {/* Step 5: Licenze */}
          {currentStep === 5 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Configurazione Licenze
                </CardTitle>
                <CardDescription>
                  Seleziona i moduli e configura il numero di licenze per questo cliente.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Available Modules */}
                <div>
                  <h3 className="text-lg font-medium mb-4">Moduli Disponibili</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {moduliDisponibili.map((modulo) => (
                      <Card key={modulo.id} className={`cursor-pointer transition-colors ${
                        selectedModules.includes(modulo.id)
                          ? 'border-primary bg-primary/5'
                          : 'hover:border-primary/50'
                      }`}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium">{modulo.displayName}</h4>
                              <p className="text-sm text-muted-foreground mt-1">{modulo.description}</p>
                            </div>
                            <Button
                              type="button"
                              variant={selectedModules.includes(modulo.id) ? "destructive" : "outline"}
                              size="sm"
                              onClick={() => selectedModules.includes(modulo.id)
                                ? removeModule(modulo.id)
                                : addModule(modulo.id)
                              }
                            >
                              {selectedModules.includes(modulo.id) ? 'Rimuovi' : 'Aggiungi'}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Selected Modules Configuration */}
                {selectedModules.length > 0 && (
                  <div>
                    <Separator />
                    <h3 className="text-lg font-medium mb-4 mt-6">Configurazione Licenze</h3>
                    <div className="space-y-4">
                      {form.watch("licenze.moduli")?.map((modulo, index) => (
                        <Card key={modulo.moduloId}>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-medium">{modulo.nomeModulo}</h4>
                                <Badge variant="outline" className="mt-1">
                                  {moduliDisponibili.find(m => m.id === modulo.moduloId)?.name}
                                </Badge>
                              </div>
                              <div className="flex items-center space-x-4">
                                <div className="flex flex-col">
                                  <label className="text-sm font-medium mb-1">Quantità</label>
                                  <Input
                                    type="number"
                                    min="1"
                                    value={modulo.quantita}
                                    onChange={(e) => updateModuleQuantity(modulo.moduloId, parseInt(e.target.value) || 1)}
                                    className="w-20"
                                  />
                                </div>
                                <div className="flex flex-col">
                                  <label className="text-sm font-medium mb-1">Data Attivazione</label>
                                  <Input
                                    type="date"
                                    value={modulo.dataAttivazione}
                                    onChange={(e) => {
                                      const currentModules = form.getValues("licenze.moduli")
                                      const updatedModules = currentModules.map((m, i) =>
                                        i === index ? { ...m, dataAttivazione: e.target.value } : m
                                      )
                                      form.setValue("licenze.moduli", updatedModules)
                                    }}
                                  />
                                </div>
                                <div className="flex flex-col">
                                  <label className="text-sm font-medium mb-1">Data Scadenza</label>
                                  <Input
                                    type="date"
                                    value={modulo.dataScadenza}
                                    onChange={(e) => {
                                      const currentModules = form.getValues("licenze.moduli")
                                      const updatedModules = currentModules.map((m, i) =>
                                        i === index ? { ...m, dataScadenza: e.target.value } : m
                                      )
                                      form.setValue("licenze.moduli", updatedModules)
                                    }}
                                  />
                                </div>
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => removeModule(modulo.moduloId)}
                                >
                                  Rimuovi
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Indietro
            </Button>

            {currentStep < 5 ? (
              <Button type="button" onClick={nextStep}>
                Avanti
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                type="submit"
                className="bg-primary hover:bg-primary/90"
                disabled={isCreating}
              >
                {isCreating ? "Salvataggio..." : "💾 Salva Contatto"}
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  )
}