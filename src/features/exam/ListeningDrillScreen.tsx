import { useParams } from 'react-router'
import { loadListeningPack } from '../../data/content'
import { EmptyState } from '../../ui/EmptyState'
import { Loading } from '../../ui/Loading'
import { Screen } from '../../ui/Screen'
import { useAsync } from '../../ui/useAsync'
import { DrillRunner } from './DrillRunner'
import { ListeningClipView } from './ListeningClipView'

export function ListeningDrillScreen() {
  const { packId = '' } = useParams()
  const pack = useAsync(() => loadListeningPack(packId), packId)

  return (
    <Screen
      title={pack.status === 'ready' ? pack.value.title : 'Höra'}
      back="/exam/hora"
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
          unitName="Clip"
          backTo="/exam/hora"
          units={pack.value.clips.map((clip) => ({
            id: clip.id,
            items: clip.items,
            render: (answeredAll) => (
              <ListeningClipView
                clip={clip}
                audioPath={pack.value.audio[clip.id]!}
                answeredAll={answeredAll}
              />
            ),
          }))}
        />
      )}
    </Screen>
  )
}
