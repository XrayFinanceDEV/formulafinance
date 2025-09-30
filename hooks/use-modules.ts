import { useState, useEffect } from 'react';
import { dataProvider } from '@/lib/data-provider';
import type { Module } from '@/types/modules';

export function useModules() {
  const [data, setData] = useState<{ data: Module[]; total: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setIsLoading(true);
    dataProvider
      .getList('modules', {
        pagination: { page: 1, perPage: 100 },
        filter: { is_active: true },
        sort: { field: 'display_name', order: 'ASC' },
      })
      .then((result) => {
        setData(result);
        setIsLoading(false);
      })
      .catch((err) => {
        setError(err);
        setIsLoading(false);
      });
  }, []);

  return { data, isLoading, error };
}

export function useModule(id: number | string) {
  const [data, setData] = useState<Module | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!id) return;

    setIsLoading(true);
    dataProvider
      .getOne('modules', { id })
      .then((result) => {
        setData(result.data);
        setIsLoading(false);
      })
      .catch((err) => {
        setError(err);
        setIsLoading(false);
      });
  }, [id]);

  return { data, isLoading, error };
}