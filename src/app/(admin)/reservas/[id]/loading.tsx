import { DetailPageSkeleton } from "@/components/skeletons"

export default function ReservaDetailLoading() {
  return <DetailPageSkeleton showTabs tabCount={3} formSections={2} fieldsPerSection={6} />
}
