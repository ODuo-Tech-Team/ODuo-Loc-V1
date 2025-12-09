import { TablePageSkeleton } from "@/components/skeletons"

export default function NotasFiscaisLoading() {
  return (
    <TablePageSkeleton
      filterInputs={2}
      tableColumns={[
        { width: "w-24" },
        { width: "w-32" },
        { width: "w-48" },
        { width: "w-32" },
        { width: "w-24" },
        { width: "w-24" },
      ]}
      tableRows={8}
    />
  )
}
