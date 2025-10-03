"use client"

import * as React from "react"
import { useState } from "react"
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table"
import {
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconDotsVertical,
  IconLayoutColumns,
  IconPlus,
  IconSearch,
  IconTrash,
  IconEdit,
} from "@tabler/icons-react"
import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { useCustomers, useDeleteCustomer, Customer } from "@/hooks/use-customers-query"
import { usePermissions } from "@/lib/auth/auth-provider"

function getUsageColor(usage: number) {
  if (usage >= 95) return "text-red-600 dark:text-red-400"
  if (usage >= 80) return "text-yellow-600 dark:text-yellow-400"
  return "text-green-600 dark:text-green-400"
}

function getStatusColor(status: string) {
  switch (status) {
    case "Attivo":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
    case "Attenzione":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
    case "Oltre il limite":
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
  }
}

export function CustomersTableEnhanced() {
  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState("")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [sorting, setSorting] = useState<SortingState>([])
  const [rowSelection, setRowSelection] = useState({})
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})

  const { toast } = useToast()
  const { canEditCustomers: canEdit, canDeleteCustomers: canDelete, role: userRole } = usePermissions()
  const { mutateAsync: deleteCustomer } = useDeleteCustomer()

  // Fetch customers with ra-core
  // Only include filters if they have values
  const filter: Record<string, string> = {}
  if (searchQuery) filter.q = searchQuery
  if (typeFilter) filter.type = typeFilter

  const { data: customersData, isPending: isLoading, error, refetch } = useCustomers(
    { page, perPage: pageSize },
    { field: sorting[0]?.id || 'id', order: sorting[0]?.desc ? 'DESC' : 'ASC' },
    filter
  )

  const customers = customersData?.data || []
  const totalCount = customersData?.total || 0

  const handleDeleteCustomer = async (id: number) => {
    if (!canDelete) {
      toast({
        title: "Permission denied",
        description: "You don't have permission to delete customers.",
        variant: "destructive",
      })
      return
    }

    try {
      await deleteCustomer(id)
      toast({
        title: "Customer deleted",
        description: "The customer has been successfully deleted.",
      })
      refetch()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete customer.",
        variant: "destructive",
      })
    }
  }

  const columns: ColumnDef<Customer>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <div className="flex items-center justify-center">
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && "indeterminate")
            }
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Select all"
          />
        </div>
      ),
      cell: ({ row }) => (
        <div className="flex items-center justify-center">
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        </div>
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "name",
      header: "Nome",
      cell: ({ row }) => (
        <div className="font-medium">{row.original.name}</div>
      ),
      enableHiding: false,
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => (
        <div className="text-muted-foreground">{row.original.email}</div>
      ),
    },
    {
      accessorKey: "type",
      header: "Tipo",
      cell: ({ row }) => (
        <Badge variant="outline" className="text-muted-foreground px-2">
          {row.original.type}
        </Badge>
      ),
    },
    {
      accessorKey: "licenseUsage",
      header: "Utilizzo Licenze",
      cell: ({ row }) => {
        const usage = row.original.licenseUsage
        const max = row.original.maxLicenses
        const percentage = Math.round((usage / max) * 100)

        return (
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className={`font-medium ${getUsageColor(percentage)}`}>
                {percentage}%
              </span>
              <span className="text-muted-foreground text-sm">
                ({usage}/{max})
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
              <div
                className={`h-1.5 rounded-full ${
                  percentage >= 95
                    ? "bg-red-500"
                    : percentage >= 80
                    ? "bg-yellow-500"
                    : "bg-green-500"
                }`}
                style={{ width: `${Math.min(percentage, 100)}%` }}
              />
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "status",
      header: "Stato",
      cell: ({ row }) => (
        <Badge
          variant="outline"
          className={`px-2 ${getStatusColor(row.original.status)}`}
        >
          {row.original.status}
        </Badge>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="data-[state=open]:bg-muted text-muted-foreground flex size-8"
              size="icon"
            >
              <IconDotsVertical />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem asChild>
              <Link href={`/customers/${row.original.id}`}>
                View Details
              </Link>
            </DropdownMenuItem>
            {canEdit && (
              <DropdownMenuItem asChild>
                <Link href={`/customers/${row.original.id}/edit`}>
                  <IconEdit className="mr-2 h-4 w-4" />
                  Edit Customer
                </Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem>Manage Licenses</DropdownMenuItem>
            <DropdownMenuSeparator />
            {canDelete && (
              <DropdownMenuItem
                onClick={() => handleDeleteCustomer(row.original.id)}
                className="text-red-600"
              >
                <IconTrash className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  const table = useReactTable({
    data: customers,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
    },
    getRowId: (row) => row.id.toString(),
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
    pageCount: Math.ceil(totalCount / pageSize),
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Error loading customers: {error instanceof Error ? error.message : 'Unknown error'}</p>
        <Button onClick={() => refetch()} className="mt-4">Retry</Button>
      </div>
    )
  }

  return (
    <div className="w-full flex-col justify-start gap-6">
      {/* Header with search and filters */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="relative">
            <IconSearch className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cerca clienti..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 w-64"
            />
          </div>
          <Select
            value={typeFilter || "all"}
            onValueChange={(value) => setTypeFilter(value === "all" ? "" : value)}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Tutti i Tipi" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutti i Tipi</SelectItem>
              <SelectItem value="Cliente">Cliente</SelectItem>
              <SelectItem value="Intermediario">Intermediario</SelectItem>
              <SelectItem value="Rivenditore">Rivenditore</SelectItem>
              <SelectItem value="Potenziale">Potenziale</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <IconLayoutColumns />
                <span className="hidden lg:inline">Colonne</span>
                <IconChevronDown />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {table
                .getAllColumns()
                .filter(
                  (column) =>
                    typeof column.accessorFn !== "undefined" &&
                    column.getCanHide()
                )
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  )
                })}
            </DropdownMenuContent>
          </DropdownMenu>
          {canEdit && (
            <Button asChild size="sm">
              <Link href="/customers/new">
                <IconPlus />
                <span className="hidden lg:inline">Aggiungi Cliente</span>
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* User role indicator */}
      <div className="mb-4">
        <Badge variant="secondary" className="text-xs">
          Role: {userRole} |
          {canEdit ? " Can Edit" : " Read Only"} |
          {canDelete ? " Can Delete" : " No Delete"}
        </Badge>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader className="bg-muted sticky top-0 z-10">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} colSpan={header.colSpan}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No customers found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-4 mt-4">
        <div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
          {table.getFilteredSelectedRowModel().rows.length} di{" "}
          {totalCount} cliente(i) selezionato(i).
        </div>
        <div className="flex w-full items-center gap-8 lg:w-fit">
          <div className="hidden items-center gap-2 lg:flex">
            <Label htmlFor="rows-per-page" className="text-sm font-medium">
              Righe per pagina
            </Label>
            <Select
              value={`${pageSize}`}
              onValueChange={(value) => setPageSize(Number(value))}
            >
              <SelectTrigger size="sm" className="w-20" id="rows-per-page">
                <SelectValue placeholder={pageSize} />
              </SelectTrigger>
              <SelectContent side="top">
                {[5, 10, 20, 30, 40, 50].map((size) => (
                  <SelectItem key={size} value={`${size}`}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex w-fit items-center justify-center text-sm font-medium">
            Pagina {page} di {Math.ceil(totalCount / pageSize)}
          </div>
          <div className="ml-auto flex items-center gap-2 lg:ml-0">
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => setPage(1)}
              disabled={page === 1}
            >
              <span className="sr-only">Go to first page</span>
              <IconChevronsLeft />
            </Button>
            <Button
              variant="outline"
              className="size-8"
              size="icon"
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
            >
              <span className="sr-only">Go to previous page</span>
              <IconChevronLeft />
            </Button>
            <Button
              variant="outline"
              className="size-8"
              size="icon"
              onClick={() => setPage(page + 1)}
              disabled={page >= Math.ceil(totalCount / pageSize)}
            >
              <span className="sr-only">Go to next page</span>
              <IconChevronRight />
            </Button>
            <Button
              variant="outline"
              className="hidden size-8 lg:flex"
              size="icon"
              onClick={() => setPage(Math.ceil(totalCount / pageSize))}
              disabled={page >= Math.ceil(totalCount / pageSize)}
            >
              <span className="sr-only">Go to last page</span>
              <IconChevronsRight />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}