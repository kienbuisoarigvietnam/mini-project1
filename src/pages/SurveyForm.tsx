import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { SurveyRecord, Category as CategoryType, FormStep, SurveyPhoto } from '../types';
import { SyncStatus, CATEGORY_LIST, BUILDING_LIST, FLOOR_LIST } from '../types';
import {
  createEmptySurvey,
  saveDraft,
  getDraft,
  submitSurvey,
  saveSurveyAsDraft,
  getSurveyById,
  updateSurveyLocation,
  addSurveyPhoto,
  removeSurveyPhoto,
  isSurveyComplete
} from '../services/surveys';
import { takePhoto } from '../services/native';
import { StepsIndicator, RatingStars, CategoryIcon } from '../components/UI';

export default function SurveyForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();

  const [step, setStep] = useState<FormStep>(1);
  const [survey, setSurvey] = useState<SurveyRecord>(() => createEmptySurvey());
  const [saving, setSaving] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (id) {
        const existing = await getSurveyById(id);
        const draft = await getDraft(id);
        if (existing && !cancelled) {
          setSurvey({ ...existing, ...(draft as Partial<SurveyRecord>) });
        } else if (draft && !cancelled) {
          setSurvey({ ...createEmptySurvey(), ...(draft as Partial<SurveyRecord>), id });
        }
      } else {
        const draft = await getDraft(survey.id);
        if (draft && !cancelled) {
          setSurvey({ ...createEmptySurvey(), ...(draft as Partial<SurveyRecord>) });
        }
      }
      if (!cancelled) setInitialized(true);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (!initialized) return;
    const t = setTimeout(() => {
      saveDraft(survey.id, survey);
    }, 500);
    return () => clearTimeout(t);
  }, [initialized, survey]);

  const canNext = useMemo(() => {
    switch (step) {
      case 1:
        return !!survey.location.building && !!survey.location.floor && !!survey.location.room;
      case 2:
        return !!survey.category;
      case 3:
        return survey.rating >= 1 && survey.rating <= 5;
      case 4:
        return true;
      default:
        return false;
    }
  }, [step, survey]);

  const goNext = () => {
    if (!canNext) return;
    if (step < 4) setStep(((step + 1) as FormStep));
  };
  const goBack = () => {
    if (step > 1) setStep(((step - 1) as FormStep));
  };

  const updateLoc = (patch: Partial<SurveyRecord['location']>) =>
    setSurvey((s) => updateSurveyLocation(s, patch));

  const setCategory = (c: CategoryType) => setSurvey((s) => ({ ...s, category: c, updatedAt: Date.now() }));
  const setRating = (r: number) => setSurvey((s) => ({ ...s, rating: r, updatedAt: Date.now() }));
  const setNotes = (v: string) => setSurvey((s) => ({ ...s, notes: v, updatedAt: Date.now() }));

  const handleTakePhoto = async () => {
    const p = await takePhoto();
    if (p) setSurvey((s) => addSurveyPhoto(s, p));
  };
  const handleRemovePhoto = (photoId: string) => setSurvey((s) => removeSurveyPhoto(s, photoId));

  const handleSaveDraft = async () => {
    setSaving(true);
    try {
      await saveSurveyAsDraft(survey);
      navigate('/', { replace: true });
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!isSurveyComplete(survey)) return;
    setSaving(true);
    try {
      await submitSurvey(survey);
      navigate('/', { replace: true });
    } finally {
      setSaving(false);
    }
  };

  const cancel = () => navigate('/', { replace: true });

  if (!initialized) {
    return (
      <div>
        <div className="skeleton skeleton-row" />
        <div className="skeleton skeleton-row" />
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button className="btn-ghost" onClick={cancel} style={{ fontSize: 14 }}>
          ← Hủy
        </button>
        <button className="btn-ghost" onClick={handleSaveDraft} disabled={saving} style={{ fontSize: 14 }}>
          Lưu nháp
        </button>
      </div>

      <StepsIndicator current={step} />

      {step === 1 && (
        <Step1 survey={survey} updateLoc={updateLoc} />
      )}
      {step === 2 && (
        <Step2 survey={survey} setCategory={setCategory} />
      )}
      {step === 3 && (
        <Step3 survey={survey} setRating={setRating} />
      )}
      {step === 4 && (
        <Step4
          survey={survey}
          setNotes={setNotes}
          onAddPhoto={handleTakePhoto}
          onRemovePhoto={handleRemovePhoto}
        />
      )}

      <div className="btn-row">
        <button className="btn btn-secondary" onClick={goBack} disabled={step === 1}>
          Quay lại
        </button>
        {step < 4 ? (
          <button className="btn btn-primary" onClick={goNext} disabled={!canNext}>
            Tiếp theo
          </button>
        ) : (
          <button className="btn btn-primary" onClick={handleSubmit} disabled={!isSurveyComplete(survey) || saving}>
            {saving ? 'Đang gửi...' : 'Gửi & Đồng bộ'}
          </button>
        )}
      </div>
    </div>
  );
}

function Step1({ survey, updateLoc }: { survey: SurveyRecord; updateLoc: (p: Partial<SurveyRecord['location']>) => void }) {
  return (
    <div>
      <div className="step-header">
        <h2 className="step-title">Vị trí</h2>
        <p className="step-subtitle">Chọn tòa nhà, tầng và số phòng cần kiểm tra</p>
      </div>

      <div className="card">
        <div className="form-group">
          <label className="form-label">Tòa nhà</label>
          <select
            className="form-select"
            value={survey.location.building}
            onChange={(e) => updateLoc({ building: e.target.value })}
          >
            <option value="">-- Chọn tòa nhà --</option>
            {BUILDING_LIST.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Tầng</label>
          <select
            className="form-select"
            value={survey.location.floor}
            onChange={(e) => updateLoc({ floor: e.target.value })}
          >
            <option value="">-- Chọn tầng --</option>
            {FLOOR_LIST.map((f) => (
              <option key={f} value={f}>
                Tầng {f}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Số phòng</label>
          <input
            type="text"
            className="form-input"
            placeholder="Ví dụ: 101, 203A, Lab 01..."
            value={survey.location.room}
            onChange={(e) => updateLoc({ room: e.target.value })}
          />
        </div>
      </div>
    </div>
  );
}

function Step2({ survey, setCategory }: { survey: SurveyRecord; setCategory: (c: CategoryType) => void }) {
  return (
    <div>
      <div className="step-header">
        <h2 className="step-title">Danh mục</h2>
        <p className="step-subtitle">Chọn loại cơ sở vật chất cần đánh giá</p>
      </div>

      <div className="category-grid">
        {CATEGORY_LIST.map((c) => (
          <button
            key={c}
            type="button"
            className={`category-chip ${survey.category === c ? 'selected' : ''}`}
            onClick={() => setCategory(c)}
          >
            <span className="icon"><CategoryIcon category={c} /></span>
            <span>{c}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function Step3({ survey, setRating }: { survey: SurveyRecord; setRating: (r: number) => void }) {
  const labelMap: Record<number, string> = {
    1: 'Rất hỏng hóc - Cần thay thế ngay',
    2: 'Nặng hỏng - Cần sửa chữa lớn',
    3: 'Bình thường - Có lỗi nhỏ',
    4: 'Tốt - Hoạt động ổn định',
    5: 'Rất tốt - Hoàn hảo'
  };
  return (
    <div>
      <div className="step-header">
        <h2 className="step-title">Đánh giá tình trạng</h2>
        <p className="step-subtitle">Chọn số sao phản ánh chất lượng của thiết bị</p>
      </div>

      <div className="card" style={{ padding: '20px 14px' }}>
        <div style={{ textAlign: 'center', fontSize: 48, marginBottom: 8 }}>
          <CategoryIcon category={survey.category} />
        </div>
        <div style={{ textAlign: 'center', fontWeight: 600, marginBottom: 8 }}>{survey.category}</div>
        <RatingStars value={survey.rating} onChange={setRating} size="lg" />
        <p className="rating-label">{labelMap[survey.rating]}</p>
      </div>
    </div>
  );
}

function Step4({
  survey,
  setNotes,
  onAddPhoto,
  onRemovePhoto
}: {
  survey: SurveyRecord;
  setNotes: (v: string) => void;
  onAddPhoto: () => void;
  onRemovePhoto: (id: string) => void;
}) {
  return (
    <div>
      <div className="step-header">
        <h2 className="step-title">Ghi chú & Hình ảnh</h2>
        <p className="step-subtitle">Mô tả chi tiết vấn đề và chụp ảnh bằng chứng</p>
      </div>

      <div className="location-summary">
        <div className="icon">📍</div>
        <div className="text">
          <div className="title">{survey.location.building || 'Tòa nhà chưa chọn'}</div>
          <div className="sub">
            Tầng {survey.location.floor || '-'} · Phòng {survey.location.room || '-'} · {survey.category}
          </div>
        </div>
        <div style={{ fontSize: 24 }}>
          <CategoryIcon category={survey.category} />
        </div>
      </div>

      <div className="card">
        <div className="form-group">
          <label className="form-label">Hình ảnh (tối đa 6)</label>
          <div className="photo-grid">
            {survey.photos.map((p) => (
              <div key={p.id} className="photo-card">
                <img src={p.dataUrl} alt="Survey" />
                <button
                  type="button"
                  className="photo-remove"
                  onClick={() => onRemovePhoto(p.id)}
                  aria-label="Remove photo"
                >
                  ×
                </button>
              </div>
            ))}
            {survey.photos.length < 6 && (
              <button type="button" className="photo-add" onClick={onAddPhoto}>
                <span className="plus">+</span>
                <span>Chụp ảnh</span>
              </button>
            )}
          </div>
        </div>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Ghi chú khuyết tật</label>
          <textarea
            className="form-textarea"
            placeholder="Mô tả chi tiết tình trạng hư hỏng, vị trí cụ thể, mức độ ảnh hưởng..."
            value={survey.notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
