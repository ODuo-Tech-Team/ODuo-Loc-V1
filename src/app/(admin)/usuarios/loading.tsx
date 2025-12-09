import { TablePageSkeleton } from "@/components/skeletons"

export default function UsuariosLoading() {
  return (
    <TablePageSkeleton
      filterInputs={2}
      tableColumns={[
        { width: "w-32" },           // Nome
        { width: "w-40" },           // Email
        { width: "w-24", align: "center" }, // Cargo
        { width: "w-28" },           // Criado em
        { width: "w-20", align: "right" },  // Ações
      ]}
    />
  )
}
