import { CustomerForm } from "@/components/customer-form"

export default function NewCustomerPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Nuovo Contatto</h1>
          <p className="text-muted-foreground mt-2">
            Crea un nuovo contatto e configura il piano licenze associato.
          </p>
        </div>

        <CustomerForm />
      </div>
    </div>
  )
}