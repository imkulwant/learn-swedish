import { BrowserRouter } from 'react-router'
import { Boot } from './Boot'
import { ErrorBoundary } from './ErrorBoundary'
import { StorageFailureGate } from './StorageFailureGate'
import { AppRoutes } from './routes'

function App() {
  return (
    <>
      <StorageFailureGate />
      <ErrorBoundary>
        <Boot>
          {/* BASE_URL is "/" in dev and the deployment path in builds. */}
          <BrowserRouter basename={import.meta.env.BASE_URL}>
            <AppRoutes />
          </BrowserRouter>
        </Boot>
      </ErrorBoundary>
    </>
  )
}

export default App
