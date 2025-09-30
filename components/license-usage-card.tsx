'use client';

import { License } from '@/types/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Calendar, AlertCircle, CheckCircle2 } from 'lucide-react';
import {
  getLicenseUsagePercentage,
  getRemainingLicenses,
  isLicenseExpiringSoon,
  isLicenseExpired,
  getLicenseStatusColor,
} from '@/hooks/use-licenses';
import { getProductDisplayName } from '@/hooks/use-products';
import { cn } from '@/lib/utils';

interface LicenseUsageCardProps {
  license: License;
  showActions?: boolean;
  onEdit?: (license: License) => void;
  onRevoke?: (license: License) => void;
}

export function LicenseUsageCard({ license, showActions = false, onEdit, onRevoke }: LicenseUsageCardProps) {
  const usagePercentage = getLicenseUsagePercentage(license);
  const remaining = getRemainingLicenses(license);
  const isExpiringSoon = isLicenseExpiringSoon(license);
  const isExpired = isLicenseExpired(license);
  const statusColor = getLicenseStatusColor(license);

  const productName = license.module?.display_name || getProductDisplayName(license.module_id);

  // Progress bar color based on remaining percentage
  const progressColor = remaining <= license.quantity_total * 0.1
    ? 'bg-red-500'
    : remaining <= license.quantity_total * 0.2
    ? 'bg-yellow-500'
    : 'bg-green-500';

  // Status badge
  const getStatusBadge = () => {
    if (isExpired) {
      return <Badge variant="destructive">Scaduta</Badge>;
    }
    if (license.status === 'suspended') {
      return <Badge variant="secondary">Sospesa</Badge>;
    }
    if (isExpiringSoon) {
      return <Badge variant="outline" className="border-yellow-500 text-yellow-600">In scadenza</Badge>;
    }
    return <Badge variant="default" className="bg-green-500">Attiva</Badge>;
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <Card className={cn(
      "transition-all hover:shadow-md",
      isExpired && "opacity-75 border-red-200"
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">{productName}</CardTitle>
            <CardDescription className="flex items-center gap-2 text-xs">
              <Calendar className="h-3 w-3" />
              <span>Scadenza: {formatDate(license.expiration_date)}</span>
            </CardDescription>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Usage statistics */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Utilizzo</span>
            <span className="font-medium">
              {license.quantity_used} / {license.quantity_total}
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
            <div
              className={cn("h-2 transition-all", progressColor)}
              style={{ width: `${usagePercentage}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className={cn(
              "font-medium",
              remaining <= license.quantity_total * 0.1 ? "text-red-600" :
              remaining <= license.quantity_total * 0.2 ? "text-yellow-600" :
              "text-green-600"
            )}>
              {remaining} rimanenti
            </span>
            <span className="text-muted-foreground">{usagePercentage}% utilizzato</span>
          </div>
        </div>

        {/* Warnings */}
        {isExpiringSoon && !isExpired && (
          <div className="flex items-start gap-2 rounded-md bg-yellow-50 p-3 text-xs text-yellow-800">
            <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <p>Questa licenza scadrà entro 30 giorni</p>
          </div>
        )}

        {isExpired && (
          <div className="flex items-start gap-2 rounded-md bg-red-50 p-3 text-xs text-red-800">
            <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <p>Licenza scaduta il {formatDate(license.expiration_date)}</p>
          </div>
        )}

        {remaining === 0 && !isExpired && (
          <div className="flex items-start gap-2 rounded-md bg-red-50 p-3 text-xs text-red-800">
            <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <p>Tutte le licenze sono state utilizzate</p>
          </div>
        )}

        {/* Activation date */}
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
          <span>Attivazione: {formatDate(license.activation_date)}</span>
          {license.created_at && (
            <span>ID: {license.id}</span>
          )}
        </div>

        {/* Action buttons (superuser only) */}
        {showActions && (
          <div className="flex gap-2 pt-2">
            {onEdit && (
              <button
                onClick={() => onEdit(license)}
                className="flex-1 rounded-md bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Modifica
              </button>
            )}
            {onRevoke && (
              <button
                onClick={() => onRevoke(license)}
                className="flex-1 rounded-md bg-destructive px-3 py-2 text-xs font-medium text-destructive-foreground hover:bg-destructive/90 transition-colors"
              >
                Revoca
              </button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}