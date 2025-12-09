import { TablePageSkeleton } from "@/components/skeletons"

export default function EquipamentosLoading() {
  return (
    <TablePageSkeleton
      filterInputs={4}
      tableColumns={[
        { width: "w-14" },           // Image
        { width: "w-32" },           // Nome
        { width: "w-24" },           // Categoria
        { width: "w-24" },           // Preço/Dia
        { width: "w-24" },           // Preço/Hora
        { width: "w-16", align: "center" }, // Quantidade
        { width: "w-20", align: "center" }, // Status
        { width: "w-24", align: "right" },  // Ações
      ]}
    />
  )
}
