'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useProducts } from '@/hooks/use-products';
import { LicenseAssignmentData } from '@/types/auth';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface LicenseAssignmentDialogDemoProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: number;
  userName?: string;
}

export function LicenseAssignmentDialogDemo({
  open,
  onOpenChange,
  userId,
  userName
}: LicenseAssignmentDialogDemoProps) {
  const [moduleId, setModuleId] = useState<number | null>(null);
  const [quantityTotal, setQuantityTotal] = useState<string>('100');
  const [activationDate, setActivationDate] = useState<Date>(new Date());
  const [expirationDate, setExpirationDate] = useState<Date>(() => {
    const date = new Date();
    date.setFullYear(date.getFullYear() + 1);
    return date;
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: products, isLoading: productsLoading } = useProducts();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!moduleId) {
      alert('Seleziona un prodotto');
      return;
    }

    const quantity = parseInt(quantityTotal);
    if (isNaN(quantity) || quantity <= 0) {
      alert('La quantità deve essere un numero positivo');
      return;
    }

    if (expirationDate <= activationDate) {
      alert('La data di scadenza deve essere successiva alla data di attivazione');
      return;
    }

    setIsSubmitting(true);

    try {
      const licenseData: LicenseAssignmentData = {
        user_id: userId,
        module_id: moduleId,
        quantity_total: quantity,
        activation_date: format(activationDate, 'yyyy-MM-dd'),
        expiration_date: format(expirationDate, 'yyyy-MM-dd'),
      };

      // Demo: just log the data
      console.log('License assignment (demo):', licenseData);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      alert('Licenza assegnata con successo (Demo Mode)');
      onOpenChange(false);

      // Reset form
      setModuleId(null);
      setQuantityTotal('100');
      setActivationDate(new Date());
      const newExpDate = new Date();
      newExpDate.setFullYear(newExpDate.getFullYear() + 1);
      setExpirationDate(newExpDate);
    } catch (error) {
      console.error('Error assigning license:', error);
      alert('Errore durante l\'assegnazione della licenza');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Assegna Nuova Licenza (Demo)</DialogTitle>
          <DialogDescription>
            {userName ? `Assegna una licenza a ${userName}` : 'Compila i campi per assegnare una nuova licenza'}
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
          <div className="space-y-2">
            <Label htmlFor="quantity">Quantità *</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              value={quantityTotal}
              onChange={(e) => setQuantityTotal(e.target.value)}
              placeholder="100"
              required
            />
            <p className="text-xs text-muted-foreground">
              Numero di report che possono essere generati con questa licenza
            </p>
          </div>

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
              {isSubmitting ? 'Assegnazione...' : 'Assegna Licenza'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}