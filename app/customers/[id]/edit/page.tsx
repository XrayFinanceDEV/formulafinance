import { CustomerEditPageClient } from "./page-client"

interface CustomerEditPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function CustomerEditPage({ params }: CustomerEditPageProps) {
  const { id } = await params

  return <CustomerEditPageClient customerId={id} />
}