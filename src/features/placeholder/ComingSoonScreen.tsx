import { EmptyState } from '../../ui/EmptyState'
import { Screen } from '../../ui/Screen'

/** A tab whose content arrives in a later slice of docs/PLAN.md. */
export function ComingSoonScreen({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <Screen title={title}>
      <EmptyState title="Coming soon" description={description} />
    </Screen>
  )
}
