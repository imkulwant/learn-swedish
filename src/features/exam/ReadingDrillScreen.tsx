import { useParams } from 'react-router'
import { loadReadingPack } from '../../data/content'
import { EmptyState } from '../../ui/EmptyState'
import { Loading } from '../../ui/Loading'
import { Screen } from '../../ui/Screen'
import { useAsync } from '../../ui/useAsync'
import { DrillRunner } from './DrillRunner'
import { ReadingTextView } from './ReadingTextView'

export function ReadingDrillScreen() {
  const { packId = '' } = useParams()
  const pack = useAsync(() => loadReadingPack(packId), packId)

  return (
    <Screen
      title={pack.status === 'ready' ? pack.value.title : 'Läsa'}
      back="/exam/lasa"
    >
      {pack.status === 'loading' && <Loading />}
      {pack.status === 'error' && (
        <EmptyState
          title="This pack could not be opened"
          description={pack.message}
        />
      )}
      {pack.status === 'ready' && (
        <DrillRunner
          key={pack.value.id}
          pack={pack.value}
          unitName="Text"
          backTo="/exam/lasa"
          units={pack.value.texts.map((text) => ({
            id: text.id,
            items: text.items,
            render: () => <ReadingTextView text={text} />,
          }))}
        />
      )}
    </Screen>
  )
}
