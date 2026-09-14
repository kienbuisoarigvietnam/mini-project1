import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { SurveyRecord } from '../types';
import { SyncStatus } from '../types';
import { deleteSurvey, getSurveyById } from '../services/surveys';
import { tryTriggerSync, removeFromSync, queueForSync } from '../services/sync';
import { StatusBadge, RatingStars, CategoryIcon, formatDate } from '../components/UI';

export default function SurveyDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [survey, setSurvey] = useState<SurveyRecord | null>(null);
  const [retryBusy, setRetryBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const load = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const r = await getSurveyById(id);
      setSurvey(r || null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  if (loading) {
    return (
      <div>
        <div className="skeleton skeleton-row" />
        <div className="skeleton skeleton-row" />
      </div>
    );
  }

  if (!survey) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">❓</div>
        <h3 className="empty-state-title">Không tìm thấy phiếu</h3>
        <button className="btn btn-primary" onClick={() => navigate('/')}>Quay về</button>
      </div>
    );
  }

  const canRetry = survey.syncStatus === SyncStatus.FAILED || survey.syncStatus === SyncStatus.PENDING_SYNC;

  const handleRetry = async () => {
    if (!survey || !canRetry) return;
    setRetryBusy(true);
    try {
      await queueForSync(survey.id);
      setTimeout(() => tryTriggerSync(true), 200);
      await load();
    } finally {
      setRetryBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!survey) return;
    await deleteSurvey(survey.id);
    navigate('/', { replace: true });
  };

  const handleRemoveFromQueue = async () => {
    if (!survey) return;
    await removeFromSync(survey.id);
    await load();
  };

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <button className="btn-ghost" onClick={() => navigate(-1)} style={{ paddingLeft: 0 }}>
          ← Quay lại
        </button>
      </div>

      <div className="card" style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12, gap: 10 }}>
          <div>
            <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <CategoryIcon category={survey.category} /> {survey.category}
            </h2>
            <p className="card-subtitle" style={{ margin: 0 }}>
              {survey.location.building} · Tầng {survey.location.floor} · Phòng {survey.location.room}
            </p>
          </div>
          <StatusBadge status={survey.syncStatus} />
        </div>
        <RatingStars value={survey.rating} />
      </div>

      <div className="card" style={{ marginBottom: 14 }}>
        <div className="detail-section">
          <p className="detail-label">Thời gian</p>
          <p className="detail-value">Tạo: {formatDate(survey.createdAt)}</p>
          <p className="detail-value">Cập nhật: {formatDate(survey.updatedAt)}</p>
          {survey.syncedAt && <p className="detail-value">Đồng bộ: {formatDate(survey.syncedAt)}</p>}
        </div>

        {survey.syncAttempts > 0 && (
          <div className="detail-section">
            <p className="detail-label">Đồng bộ</p>
            <p className="detail-value">Số lần thử: {survey.syncAttempts}</p>
          </div>
        )}

        {survey.lastSyncError && (
          <div className="detail-section">
            <p className="detail-label">Lỗi gần nhất</p>
            <div className="error-box" style={{ marginTop: 0 }}>{survey.lastSyncError}</div>
          </div>
        )}

        <div className="detail-section" style={{ marginBottom: 0 }}>
          <p className="detail-label">Ghi chú</p>
          {survey.notes ? (
            <div className="detail-notes">{survey.notes}</div>
          ) : (
            <p className="detail-value" style={{ color: 'var(--text-dim)', fontWeight: 500 }}>Không có ghi chú.</p>
          )}
        </div>
      </div>

      {survey.photos.length > 0 && (
        <div className="card" style={{ marginBottom: 14 }}>
          <p className="detail-label" style={{ marginBottom: 10 }}>Hình ảnh ({survey.photos.length})</p>
          <div className="photo-grid">
            {survey.photos.map((p) => (
              <div key={p.id} className="photo-card" style={{ aspectRatio: 1 }}>
                <img
                  src={p.dataUrl}
                  alt="Survey evidence"
                  onClick={() => window.open(p.dataUrl, '_blank')}
                  style={{ cursor: 'pointer' }}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {survey.syncStatus === SyncStatus.DRAFT && (
          <button
            className="btn btn-primary btn-block"
            onClick={() => navigate(`/survey/${survey.id}/edit`)}
          >
            Tiếp tục chỉnh sửa & Gửi
          </button>
        )}

        {survey.syncStatus !== SyncStatus.DRAFT && survey.syncStatus !== SyncStatus.SYNCED && (
          <>
            <button
              className="btn btn-primary btn-block"
              onClick={handleRetry}
              disabled={retryBusy}
            >
              {retryBusy ? 'Đang thử lại...' : canRetry ? 'Thử đồng bộ lại' : 'Đang đồng bộ...'}
            </button>
            {survey.syncStatus === SyncStatus.PENDING_SYNC && (
              <button className="btn btn-secondary btn-block" onClick={handleRemoveFromQueue}>
                Hủy khỏi hàng đợi
              </button>
            )}
          </>
        )}

        <button
          className="btn btn-secondary btn-block"
          onClick={() => navigate(`/survey/${survey.id}/edit`)}
        >
          Chỉnh sửa
        </button>

        {confirmDelete ? (
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setConfirmDelete(false)}>
              Không
            </button>
            <button className="btn btn-danger" style={{ flex: 1 }} onClick={handleDelete}>
              Xác nhận xóa
            </button>
          </div>
        ) : (
          <button className="btn btn-danger btn-block" onClick={() => setConfirmDelete(true)}>
            Xóa phiếu
          </button>
        )}
      </div>
    </div>
  );
}
