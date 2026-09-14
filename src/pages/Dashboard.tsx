import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { SurveyRecord } from '../types';
import { SyncStatus } from '../types';
import { getAllSurveys } from '../services/surveys';
import { StatusBadge, RatingStars, CategoryIcon, formatDate } from '../components/UI';

type Filter = 'all' | SyncStatus.DRAFT | SyncStatus.PENDING_SYNC | SyncStatus.SYNCED;

export default function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [surveys, setSurveys] = useState<SurveyRecord[]>([]);
  const [filter, setFilter] = useState<Filter>('all');

  const loadData = async () => {
    setLoading(true);
    try {
      const list = await getAllSurveys();
      setSurveys(list);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const onFocus = () => loadData();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  const filtered =
    filter === 'all' ? surveys : surveys.filter((s) => s.syncStatus === filter);

  const counts = {
    all: surveys.length,
    [SyncStatus.DRAFT]: surveys.filter((s) => s.syncStatus === SyncStatus.DRAFT).length,
    [SyncStatus.PENDING_SYNC]: surveys.filter(
      (s) => s.syncStatus === SyncStatus.PENDING_SYNC || s.syncStatus === SyncStatus.SYNCING || s.syncStatus === SyncStatus.FAILED
    ).length,
    [SyncStatus.SYNCED]: surveys.filter((s) => s.syncStatus === SyncStatus.SYNCED).length
  };

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <div className="card">
          <h2 className="card-title">Kiểm tra cơ sở vật chất VKU</h2>
          <p className="card-subtitle" style={{ marginBottom: 0 }}>
            Ghi nhận tình trạng thiết bị tại các tòa nhà. Dữ liệu được lưu cục bộ và tự động đồng bộ khi có mạng.
          </p>
        </div>
      </div>

      <div className="tabs">
        {(['all', SyncStatus.DRAFT, SyncStatus.PENDING_SYNC, SyncStatus.SYNCED] as Filter[]).map((k) => (
          <button
            key={k}
            className={`tab ${filter === k ? 'active' : ''}`}
            onClick={() => setFilter(k)}
          >
            {k === 'all' ? 'Tất cả' : k === SyncStatus.DRAFT ? 'Nháp' : k === SyncStatus.PENDING_SYNC ? 'Chờ sync' : 'Hoàn tất'}
            <span style={{ marginLeft: 4, opacity: 0.6 }}>({k === 'all' ? counts.all : counts[k]})</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div>
          <div className="skeleton skeleton-row" />
          <div className="skeleton skeleton-row" />
          <div className="skeleton skeleton-row" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <h3 className="empty-state-title">Chưa có phiếu khảo sát nào</h3>
          <p className="empty-state-text">
            Nhấn nút <strong>+</strong> bên dưới để tạo phiếu kiểm tra cơ sở vật chất mới.
          </p>
        </div>
      ) : (
        <div className="survey-list">
          {filtered.map((s) => (
            <div
              key={s.id}
              className="survey-item"
              onClick={() => navigate(`/survey/${s.id}`)}
            >
              <div className="survey-thumb">
                {s.photos[0] ? <img src={s.photos[0].dataUrl} alt="" /> : <CategoryIcon category={s.category} />}
              </div>
              <div className="survey-body">
                <div className="survey-head">
                  <p className="survey-name">
                    {s.location.building || 'Chưa chọn tòa'} · {s.location.room || '?'}
                  </p>
                  <StatusBadge status={s.syncStatus} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>
                    <CategoryIcon category={s.category} /> {s.category}
                  </span>
                  <div style={{ transform: 'scale(0.55)', transformOrigin: 'left center', margin: '-8px 0' }}>
                    <RatingStars value={s.rating} size="sm" />
                  </div>
                </div>
                <div className="survey-meta">
                  <span>🏢 Tầng {s.location.floor || '-'}</span>
                  <span>🕒 {formatDate(s.updatedAt)}</span>
                  {s.photos.length > 0 && <span>📷 {s.photos.length}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
