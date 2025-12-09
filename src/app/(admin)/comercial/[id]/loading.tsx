import { DetailPageSkeleton } from "@/components/skeletons"

export default function LeadDetailLoading() {
  return <DetailPageSkeleton showTabs tabCount={4} formSections={3} fieldsPerSection={4} />
}
