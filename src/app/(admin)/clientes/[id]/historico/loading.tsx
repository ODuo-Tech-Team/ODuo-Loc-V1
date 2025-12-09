import { TablePageSkeleton } from "@/components/skeletons"

export default function HistoricoLoading() {
  return (
    <TablePageSkeleton
      filterInputs={0}
      tableColumns={[
        { width: "w-24" },
        { width: "w-48" },
        { width: "w-40" },
        { width: "w-28" },
        { width: "w-24" },
        { width: "w-16" },
      ]}
      tableRows={5}
    />
  )
}
