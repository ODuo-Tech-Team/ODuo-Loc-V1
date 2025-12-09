import { TablePageSkeleton } from "@/components/skeletons"

export default function LogsLoading() {
  return (
    <TablePageSkeleton
      filterInputs={2}
      tableColumns={[
        { width: "w-32" },
        { width: "w-24" },
        { width: "w-48" },
        { width: "w-64" },
        { width: "w-32" },
      ]}
      tableRows={10}
    />
  )
}
