import { TablePageSkeleton } from "@/components/skeletons"

export default function ClientesLoading() {
  return (
    <TablePageSkeleton
      filterInputs={1}
      tableColumns={[
        { width: "w-32" },           // Nome
        { width: "w-40" },           // Contato
        { width: "w-28" },           // CPF/CNPJ
        { width: "w-28" },           // Localização
        { width: "w-16", align: "center" }, // Reservas
        { width: "w-20", align: "right" },  // Ações
      ]}
    />
  )
}
