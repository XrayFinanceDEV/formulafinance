"use client"

import * as React from "react"
import { Check, ChevronsUpDown, X, Building2 } from "lucide-react"
import { useAuth } from "@/lib/auth/auth-provider"
import { useSearchParents, useCreateAssociation, useDeleteAssociation } from "@/hooks/use-associations"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { UserRole } from "@/types/rbac"

interface AssociationSelectorProps {
  customerId: number
  customerType: UserRole
  currentParent?: {
    id: number
    name: string
    type: UserRole
    association_type: string
    location?: string
  } | null
  onAssociationChange?: () => void
}

export function AssociationSelector({
  customerId,
  customerType,
  currentParent,
  onAssociationChange,
}: AssociationSelectorProps) {
  const { role } = useAuth()
  const [open, setOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")

  const { data: searchResults, isLoading: isSearching } = useSearchParents(
    customerId,
    customerType,
    searchQuery
  )

  const createAssociation = useCreateAssociation()
  const deleteAssociation = useDeleteAssociation()

  // Only show to superadmin
  if (role !== 'superadmin') {
    // Show read-only view for non-superadmin
    if (!currentParent) return null

    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Associato/Collegato a</CardTitle>
          <CardDescription>
            Relazione con il contatto principale
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarFallback className="bg-primary/10">
                {currentParent.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{currentParent.name}</p>
              <p className="text-sm text-muted-foreground truncate">
                {currentParent.location || 'Nessuna sede'}
              </p>
            </div>
            <Badge variant="secondary">
              {currentParent.type === 'rivenditore' ? 'Rivenditore' : 'Intermediario'}
            </Badge>
          </div>
        </CardContent>
      </Card>
    )
  }

  const handleSelect = async (parentId: number) => {
    try {
      await createAssociation.mutateAsync({
        parentId,
        childId: customerId,
      })

      toast.success('Associazione creata con successo')
      setOpen(false)
      setSearchQuery("")
      onAssociationChange?.()
    } catch (error: any) {
      toast.error(error.message || 'Errore durante la creazione dell\'associazione')
    }
  }

  const handleRemove = async () => {
    if (!currentParent) return

    try {
      // We need the association ID - for now, we'll need to fetch it
      // In a real implementation, currentParent should include the association ID
      toast.info('Funzionalità di rimozione in sviluppo')
      // await deleteAssociation.mutateAsync(associationId)
      // toast.success('Associazione rimossa con successo')
      // onAssociationChange?.()
    } catch (error: any) {
      toast.error(error.message || 'Errore durante la rimozione dell\'associazione')
    }
  }

  // Determine helper text based on customer type
  const getHelperText = () => {
    switch (customerType) {
      case 'cliente':
      case 'potenziale':
        return 'Seleziona un Rivenditore o Intermediario da associare'
      case 'intermediario':
        return 'Seleziona un Rivenditore da associare'
      default:
        return 'Questo tipo di contatto non può essere associato'
    }
  }

  // Check if customer can have a parent
  const canHaveParent = ['cliente', 'potenziale', 'intermediario'].includes(customerType)

  if (!canHaveParent) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Associato/Collegato a</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            I contatti di tipo &quot;{customerType}&quot; non possono essere associati ad altri contatti.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Associato/Collegato a</CardTitle>
        <CardDescription>{getHelperText()}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current parent (if exists) */}
        {currentParent && (
          <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/50">
            <Avatar>
              <AvatarFallback className="bg-primary/10">
                {currentParent.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{currentParent.name}</p>
              <p className="text-sm text-muted-foreground truncate">
                {currentParent.location || 'Nessuna sede'}
              </p>
            </div>
            <Badge variant="secondary">
              {currentParent.type === 'rivenditore' ? 'Rivenditore' : 'Intermediario'}
            </Badge>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={handleRemove}
              disabled={deleteAssociation.isPending}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Search and add new parent */}
        {!currentParent && (
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="w-full justify-between"
              >
                <span className="truncate">Cerca contatto...</span>
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[400px] p-0" align="start">
              <Command shouldFilter={false}>
                <CommandInput
                  placeholder="Cerca per nome, città..."
                  value={searchQuery}
                  onValueChange={setSearchQuery}
                />
                <CommandList>
                  {isSearching && (
                    <CommandEmpty>Caricamento...</CommandEmpty>
                  )}
                  {!isSearching && searchQuery.length < 2 && (
                    <CommandEmpty>Inserisci almeno 2 caratteri per cercare</CommandEmpty>
                  )}
                  {!isSearching && searchQuery.length >= 2 && (!searchResults || searchResults.length === 0) && (
                    <CommandEmpty>Nessun contatto trovato</CommandEmpty>
                  )}
                  {!isSearching && searchResults && searchResults.length > 0 && (
                    <CommandGroup>
                      {searchResults.map((customer: any) => (
                        <CommandItem
                          key={customer.id}
                          value={customer.id.toString()}
                          onSelect={() => handleSelect(customer.id)}
                          className="flex items-start gap-3 py-3"
                          disabled={createAssociation.isPending}
                        >
                          <Avatar className="h-8 w-8 mt-0.5">
                            <AvatarFallback className="bg-primary/10 text-xs">
                              {customer.ragione_sociale.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col gap-1 flex-1 min-w-0">
                            <div className="font-medium truncate">
                              {customer.ragione_sociale}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              {customer.citta && customer.provincia && (
                                <span className="truncate">
                                  {customer.citta} ({customer.provincia})
                                </span>
                              )}
                              {customer.tipo_utente && (
                                <Badge variant="outline" className="text-xs shrink-0">
                                  {customer.tipo_utente}
                                </Badge>
                              )}
                            </div>
                          </div>
                          {createAssociation.isPending && (
                            <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
                          )}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        )}

        {/* Info message */}
        <p className="text-xs text-muted-foreground">
          Solo i superadmin possono modificare le associazioni tra contatti.
        </p>
      </CardContent>
    </Card>
  )
}
