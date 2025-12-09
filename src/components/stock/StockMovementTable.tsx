"use client"

import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { movementTypeLabels, movementTypeColors, type MovementType } from "@/lib/validations/stock"

interface StockMovement {
  id: string
  type: MovementType
  quantity: number
  previousStock: number
  newStock: number
  reason?: string | null
  createdAt: string
  user?: {
    id: string
    name: string
  }
  booking?: {
    id: string
    bookingNumber: string
  } | null
}

interface StockMovementTableProps {
  movements: StockMovement[]
  showEquipment?: boolean
  equipment?: {
    id: string
    name: string
  }
}

export function StockMovementTable({
  movements,
  showEquipment = false,
  equipment,
}: StockMovementTableProps) {
  if (movements.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Nenhuma movimentação registrada
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Data/Hora</TableHead>
          <TableHead>Tipo</TableHead>
          <TableHead className="text-right">Quantidade</TableHead>
          <TableHead className="text-right">Estoque</TableHead>
          <TableHead>Motivo</TableHead>
          <TableHead>Usuário</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {movements.map((movement) => {
          const isIncrease = ["PURCHASE", "RENTAL_RETURN", "MAINTENANCE_IN", "ADJUSTMENT"].includes(movement.type)
            && movement.newStock > movement.previousStock

          return (
            <TableRow key={movement.id}>
              <TableCell className="whitespace-nowrap">
                {format(new Date(movement.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
              </TableCell>
              <TableCell>
                <Badge
                  className={`${movementTypeColors[movement.type]} text-white`}
                >
                  {movementTypeLabels[movement.type]}
                </Badge>
              </TableCell>
              <TableCell className="text-right font-medium">
                <span className={isIncrease ? "text-green-600" : "text-red-600"}>
                  {isIncrease ? "+" : "-"}{movement.quantity}
                </span>
              </TableCell>
              <TableCell className="text-right">
                <span className="text-muted-foreground">{movement.previousStock}</span>
                <span className="mx-1">→</span>
                <span className="font-medium">{movement.newStock}</span>
              </TableCell>
              <TableCell className="max-w-[200px] truncate">
                {movement.reason || "-"}
                {movement.booking && (
                  <a
                    href={`/reservas/${movement.booking.id}`}
                    className="ml-1 text-blue-600 hover:underline"
                  >
                    #{movement.booking.bookingNumber}
                  </a>
                )}
              </TableCell>
              <TableCell>
                {movement.user?.name || "-"}
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
