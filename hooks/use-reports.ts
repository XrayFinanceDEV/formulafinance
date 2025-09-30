import { useState, useEffect } from 'react';
import { dataProvider } from '@/lib/data-provider';
import type { Report, CreateReportInput } from '@/types/reports';

export function useReports(params?: {
  page?: number;
  perPage?: number;
  filter?: Record<string, any>;
}) {
  const [data, setData] = useState<{ data: Report[]; total: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setIsLoading(true);
    dataProvider
      .getList('reports', {
        pagination: { page: params?.page || 1, perPage: params?.perPage || 10 },
        filter: params?.filter || {},
        sort: { field: 'created_at', order: 'DESC' },
      })
      .then((result) => {
        setData(result);
        setIsLoading(false);
      })
      .catch((err) => {
        setError(err);
        setIsLoading(false);
      });
  }, [params?.page, params?.perPage]);

  return { data, isLoading, error };
}

export function useReport(id: number | string) {
  const [data, setData] = useState<Report | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!id) return;

    setIsLoading(true);
    dataProvider
      .getOne('reports', { id })
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

export function useCreateReport() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const createReport = async (data: CreateReportInput) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await dataProvider.create('reports', { data });
      setIsLoading(false);
      return result;
    } catch (err) {
      setError(err as Error);
      setIsLoading(false);
      throw err;
    }
  };

  return { createReport, isLoading, error };
}