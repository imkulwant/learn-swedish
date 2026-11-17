import { Outlet, useLocation } from 'react-router'
import { TabBar } from './TabBar'

/**
 * The frame of the five tab screens: scrolling content over a tab bar.
 * Keying the content on the path restarts the short fade-in on every
 * navigation.
 */
export function AppShell() {
  const { pathname } = useLocation()

  return (
    <div className="flex h-full flex-col">
      <main className="px-safe min-h-0 flex-1 overflow-y-auto">
        <div key={pathname} className="screen-enter">
          <Outlet />
        </div>
      </main>
      <TabBar />
    </div>
  )
}
