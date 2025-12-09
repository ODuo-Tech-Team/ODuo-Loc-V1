import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface SkeletonTableColumn {
  width?: string
  align?: "left" | "center" | "right"
}

interface SkeletonTableProps {
  rows?: number
  columns: SkeletonTableColumn[]
}

export function SkeletonTable({ rows = 5, columns }: SkeletonTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow className="border-zinc-800">
          {columns.map((col, i) => (
            <TableHead
              key={i}
              className={cn(
                col.align === "right" && "text-right",
                col.align === "center" && "text-center"
              )}
            >
              <Skeleton className={cn("h-4", col.width || "w-20")} />
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <TableRow key={rowIndex} className="border-zinc-800">
            {columns.map((col, colIndex) => (
              <TableCell
                key={colIndex}
                className={cn(
                  col.align === "right" && "text-right",
                  col.align === "center" && "text-center"
                )}
              >
                <Skeleton className={cn("h-4", col.width || "w-20")} />
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
