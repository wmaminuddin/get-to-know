interface Props {
  title: string
  detail?: string
}

export function WaitingState({ title, detail }: Props) {
  return (
    <div className="waiting">
      <div className="dot-pulse" aria-hidden />
      <h2>{title}</h2>
      {detail ? <p className="muted">{detail}</p> : null}
    </div>
  )
}
