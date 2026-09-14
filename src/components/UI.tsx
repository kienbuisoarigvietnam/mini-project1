import { SyncStatus } from '../types';

export function StatusBadge({ status }: { status: SyncStatus }) {
  const map: Record<SyncStatus, { label: string; cls: string }> = {
    [SyncStatus.DRAFT]: { label: 'Nháp', cls: 'status-draft' },
    [SyncStatus.PENDING_SYNC]: { label: 'Chờ đồng bộ', cls: 'status-pending' },
    [SyncStatus.SYNCING]: { label: 'Đang đồng bộ', cls: 'status-syncing' },
    [SyncStatus.SYNCED]: { label: 'Đã đồng bộ', cls: 'status-synced' },
    [SyncStatus.FAILED]: { label: 'Lỗi', cls: 'status-failed' }
  };
  const cfg = map[status];
  return <span className={`status-badge ${cfg.cls}`}>{cfg.label}</span>;
}

export function RatingStars({ value, onChange, size = 'md' }: { value: number; onChange?: (v: number) => void; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClass = size === 'sm' ? 'fontSize: 22px' : size === 'lg' ? 'fontSize: 48px' : 'fontSize: 36px';
  return (
    <div className="rating-stars">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          className={`star-btn ${value >= n ? 'filled' : ''}`}
          style={{ fontSize: size === 'sm' ? 22 : size === 'lg' ? 48 : 42 }}
          onClick={() => onChange?.(n)}
          disabled={!onChange}
          aria-label={`${n} star`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

export function StepsIndicator({ current, total = 4 }: { current: number; total?: number }) {
  return (
    <div className="steps-indicator">
      {Array.from({ length: total }).map((_, i) => {
        const n = i + 1;
        const cls = n < current ? 'done' : n === current ? 'active' : '';
        return <div key={n} className={`step-dot ${cls}`} />;
      })}
    </div>
  );
}

export function CategoryIcon({ category }: { category: string }) {
  const map: Record<string, string> = {
    Hardware: '🖥️',
    Projector: '📽️',
    AC: '❄️',
    Electrical: '⚡',
    Furniture: '🪑'
  };
  return <span>{map[category] || '📝'}</span>;
}

export function formatDate(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) {
    return `Hôm nay ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  }
  return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
}
