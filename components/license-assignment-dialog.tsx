'use client';

import * as React from 'react';
import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useCreateLicense, useUpdateLicense } from '@/hooks/use-licenses-query';
import { useProducts } from '@/hooks/use-products';
import { LicenseAssignmentData, License } from '@/types/auth';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';

interface LicenseAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: number;
  userName?: string;
  existingLicense?: License | null;
}

export function LicenseAssignmentDialog({
  open,
  onOpenChange,
  userId,
  userName,
  existingLicense
}: LicenseAssignmentDialogProps) {
  const isEditMode = !!existingLicense;
  const [moduleId, setModuleId] = useState<number | null>(null);
  const [quantityTotal, setQuantityTotal] = useState<string>('100');
  const [quantityUsed, setQuantityUsed] = useState<string>('0');
  const [activationDate, setActivationDate] = useState<Date>(new Date());
  const [expirationDate, setExpirationDate] = useState<Date>(() => {
    const date = new Date();
    date.setFullYear(date.getFullYear() + 1);
    return date;
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: products, isPending: productsLoading } = useProducts();
  const { mutateAsync: createLicense } = useCreateLicense();
  const { mutateAsync: updateLicense } = useUpdateLicense();
  const queryClient = useQueryClient();

  // Populate form when editing an existing license
  React.useEffect(() => {
    if (existingLicense && open) {
      setModuleId(existingLicense.module_id);
      setQuantityTotal(existingLicense.quantity_total.toString());
      setQuantityUsed(existingLicense.quantity_used.toString());
      setActivationDate(new Date(existingLicense.activation_date));
      setExpirationDate(new Date(existingLicense.expiration_date));
    } else if (!existingLicense && open) {
      // Reset to defaults when creating new
      setModuleId(null);
      setQuantityTotal('100');
      setQuantityUsed('0');
      setActivationDate(new Date());
      const newExpDate = new Date();
      newExpDate.setFullYear(newExpDate.getFullYear() + 1);
      setExpirationDate(newExpDate);
    }
  }, [existingLicense, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!moduleId) {
      toast.warning('Seleziona un prodotto');
      return;
    }

    const quantity = parseInt(quantityTotal);
    const used = parseInt(quantityUsed);
    if (isNaN(quantity) || quantity <= 0) {
      toast.warning('La quantità deve essere un numero positivo');
      return;
    }

    if (isNaN(used) || used < 0) {
      toast.warning('L\'utilizzo deve essere un numero valido');
      return;
    }

    if (used > quantity) {
      toast.warning('L\'utilizzo non può superare la quantità totale');
      return;
    }

    if (expirationDate <= activationDate) {
      toast.warning('La data di scadenza deve essere successiva alla data di attivazione');
      return;
    }

    setIsSubmitting(true);

    try {
      if (isEditMode && existingLicense) {
        // Update existing license
        await updateLicense({
          id: existingLicense.id,
          data: {
            user_id: userId,
            module_id: moduleId,
            quantity_total: quantity,
            quantity_used: used,
            activation_date: format(activationDate, 'yyyy-MM-dd'),
            expiration_date: format(expirationDate, 'yyyy-MM-dd'),
            status: existingLicense.status || 'active',
          },
        });
        toast.success('Licenza aggiornata con successo');
      } else {
        // Create new license
        const licenseData: LicenseAssignmentData = {
          user_id: userId,
          module_id: moduleId,
          quantity_total: quantity,
          quantity_used: used,
          activation_date: format(activationDate, 'yyyy-MM-dd'),
          expiration_date: format(expirationDate, 'yyyy-MM-dd'),
        };
        await createLicense(licenseData);
        toast.success('Licenza assegnata con successo');
      }

      queryClient.invalidateQueries({ queryKey: queryKeys.licenses.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.customers.all });
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving license:', error);
      toast.error(isEditMode ? 'Errore durante l\'aggiornamento della licenza' : 'Errore durante l\'assegnazione della licenza');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Modifica Licenza' : 'Assegna Nuova Licenza'}</DialogTitle>
          <DialogDescription>
            {isEditMode
              ? 'Modifica i dettagli della licenza esistente'
              : (userName ? `Assegna una licenza a ${userName}` : 'Compila i campi per assegnare una nuova licenza')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Product Selection */}
          <div className="space-y-2">
            <Label htmlFor="product">Prodotto *</Label>
            <Select
              value={moduleId?.toString() || ''}
              onValueChange={(value) => setModuleId(parseInt(value))}
              disabled={productsLoading}
            >
              <SelectTrigger id="product">
                <SelectValue placeholder="Seleziona un prodotto" />
              </SelectTrigger>
              <SelectContent>
                {products?.map((product) => (
                  <SelectItem key={product.id} value={product.id.toString()}>
                    {product.display_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Quantity */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantità Totale *</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={quantityTotal}
                onChange={(e) => setQuantityTotal(e.target.value)}
                placeholder="100"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantityUsed">Utilizzate</Label>
              <Input
                id="quantityUsed"
                type="number"
                min="0"
                max={quantityTotal}
                value={quantityUsed}
                onChange={(e) => setQuantityUsed(e.target.value)}
                placeholder="0"
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground -mt-2">
            Numero di report disponibili: {parseInt(quantityTotal) - parseInt(quantityUsed) || 0}
          </p>

          {/* Activation Date */}
          <div className="space-y-2">
            <Label>Data di Attivazione *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !activationDate && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {activationDate ? format(activationDate, 'PPP', { locale: it }) : 'Seleziona data'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={activationDate}
                  onSelect={(date) => date && setActivationDate(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Expiration Date */}
          <div className="space-y-2">
            <Label>Data di Scadenza *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !expirationDate && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {expirationDate ? format(expirationDate, 'PPP', { locale: it }) : 'Seleziona data'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={expirationDate}
                  onSelect={(date) => date && setExpirationDate(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Annulla
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? (isEditMode ? 'Salvataggio...' : 'Assegnazione...')
                : (isEditMode ? 'Salva Modifiche' : 'Assegna Licenza')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}