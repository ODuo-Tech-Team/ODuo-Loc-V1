import { TablePageSkeleton } from "@/components/skeletons"

export default function ReservasLoading() {
  return (
    <TablePageSkeleton
      filterInputs={1}
      tableColumns={[
        { width: "w-32" },           // Cliente
        { width: "w-32" },           // Equipamento
        { width: "w-36" },           // Período
        { width: "w-24" },           // Valor
        { width: "w-20", align: "center" }, // Status
        { width: "w-20", align: "right" },  // Ações
      ]}
    />
  )
}
