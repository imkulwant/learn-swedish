import type { ReactNode } from 'react'

/** The verdict under a checked question, read out by screen readers. */
export function Feedback({
  right,
  title,
  children,
}: {
  right: boolean
  title: string
  children?: ReactNode
}) {
  return (
    <div
      role="status"
      className={`rounded-control border p-3 ${right ? 'border-accent' : 'border-danger'}`}
    >
      <p className={`font-semibold ${right ? 'text-accent' : 'text-danger'}`}>
        {title}
      </p>
      {children && (
        <div className="mt-1 flex flex-col gap-1 text-sm text-muted">
          {children}
        </div>
      )}
    </div>
  )
}
