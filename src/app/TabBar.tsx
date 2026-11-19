import type { ReactNode } from 'react'
import { NavLink } from 'react-router'

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}

const TABS = [
  {
    to: '/',
    label: 'Today',
    end: true,
    icon: (
      <path d="M3 11l9-8 9 8v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />
    ),
  },
  {
    to: '/learn',
    label: 'Learn',
    end: false,
    icon: (
      <path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2zM4 21V5M19 19v2H6" />
    ),
  },
  {
    to: '/exam',
    label: 'Exam',
    end: false,
    icon: (
      <>
        <path d="M9 3h6l1 2h3v16H5V5h3z" />
        <path d="M9 13l2 2 4-4" />
      </>
    ),
  },
  {
    to: '/everyday',
    label: 'Everyday',
    end: false,
    icon: <path d="M4 5h16v10H9l-5 4z" />,
  },
  {
    to: '/progress',
    label: 'Progress',
    end: false,
    icon: <path d="M5 21V11M12 21V4M19 21v-7" />,
  },
]

export function TabBar() {
  return (
    <nav
      aria-label="Main"
      className="pb-safe px-safe flex border-t border-border bg-surface"
    >
      {TABS.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.end}
          className={({ isActive }) =>
            `tap-target flex flex-1 flex-col items-center gap-0.5 py-2 text-xs font-medium ${
              isActive ? 'text-accent-fg' : 'text-muted'
            }`
          }
        >
          <Icon>{tab.icon}</Icon>
          {tab.label}
        </NavLink>
      ))}
    </nav>
  )
}
