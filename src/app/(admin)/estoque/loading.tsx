import { TablePageSkeleton } from "@/components/skeletons"

export default function EstoqueLoading() {
  return (
    <TablePageSkeleton
      filterInputs={3}
      tableColumns={[
        { width: "w-14" },           // Imagem
        { width: "w-32" },           // Equipamento
        { width: "w-20", align: "center" }, // Total
        { width: "w-20", align: "center" }, // Disponível
        { width: "w-20", align: "center" }, // Reservado
        { width: "w-20", align: "center" }, // Manutenção
        { width: "w-20", align: "right" },  // Ações
      ]}
    />
  )
}
