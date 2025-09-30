import { redirect } from 'next/navigation';

interface CustomerDetailPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function CustomerDetailPage({ params }: CustomerDetailPageProps) {
  const { id } = await params;
  redirect(`/customers/${id}/edit`);
}