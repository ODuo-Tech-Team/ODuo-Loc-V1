import { TablePageSkeleton } from "@/components/skeletons"

export default function FreteLoading() {
  return (
    <TablePageSkeleton
      filterInputs={1}
      tableColumns={[
        { width: "w-48" },
        { width: "w-64" },
        { width: "w-32" },
        { width: "w-24" },
      ]}
      tableRows={6}
    />
  )
}
