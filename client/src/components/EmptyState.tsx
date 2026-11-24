export function EmptyState({ emoji, text }: { emoji: string; text: string }) {
  return (
    <div className="empty-state">
      <span className="empty-emoji" aria-hidden>
        {emoji}
      </span>
      <p>{text}</p>
    </div>
  );
}
