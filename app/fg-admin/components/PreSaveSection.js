import Image from 'next/image';
import styles from '../page.module.css';

const PLATFORM_PRESETS = [
  { id: 'spotify', label: 'Spotify' },
  { id: 'apple-music', label: 'Apple Music' },
  { id: 'amazon-music', label: 'Amazon Music' },
  { id: 'youtube-music', label: 'YouTube Music' },
  { id: 'deezer', label: 'Deezer' },
  { id: 'tidal', label: 'TIDAL' },
];

const formatDate = (value) => {
  if (!value) return 'Sin fecha';
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('es-MX', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
};

export default function PreSaveSection({
  preSaves,
  draft,
  isNew,
  selectedId,
  uploadingCover,
  uploadingBackground,
  saving,
  error,
  message,
  onNew,
  onSelect,
  onChange,
  onCoverUpload,
  onBackgroundUpload,
  onBackgroundClear,
  onPlatformChange,
  onSave,
  onDelete,
}) {
  return (
    <div className={styles.preSaveSection}>
      <div className={styles.sectionTitleRow}>
        <div>
          <p className={styles.sectionEyebrow}>Campañas</p>
          <h2>Pre-save</h2>
          <p className={styles.editorHint}>
            Prepara enlaces para próximos estrenos y publícalos en fragmentado.com/pre-save.
          </p>
        </div>
        <a className={styles.previewSiteLink} href="/pre-save" target="_blank" rel="noopener noreferrer">
          Ver página pública ↗
        </a>
      </div>

      <div className={styles.preSaveWorkspace}>
        <aside className={styles.preSaveList}>
          <button type="button" className={styles.preSaveNewButton} onClick={onNew}>
            <span aria-hidden="true">+</span>
            Nueva campaña
          </button>

          <div className={styles.preSaveItems}>
            {preSaves.length ? preSaves.map((campaign) => (
              <button
                key={campaign.id}
                type="button"
                className={campaign.id === selectedId ? styles.preSaveItemActive : styles.preSaveItem}
                onClick={() => onSelect(campaign)}
              >
                <Image
                  src={campaign.cover || '/pausa-min.jpg'}
                  alt=""
                  width={58}
                  height={58}
                />
                <span>
                  <strong>{campaign.title}</strong>
                  <small>{formatDate(campaign.releaseDate)}</small>
                </span>
                <em className={campaign.published ? styles.statusPublished : styles.statusDraft}>
                  {campaign.published ? 'Publicada' : 'Borrador'}
                </em>
              </button>
            )) : (
              <div className={styles.preSaveEmpty}>
                <strong>Aún no hay campañas</strong>
                <p>Crea la primera para preparar tu próximo lanzamiento.</p>
              </div>
            )}
          </div>
        </aside>

        <form className={`${styles.form} ${styles.preSaveEditor}`} onSubmit={onSave}>
          <div className={styles.preSaveEditorHead}>
            <div>
              <p className={styles.sectionEyebrow}>{isNew ? 'Nueva campaña' : 'Editando campaña'}</p>
              <h3>{draft.title || 'Próximo lanzamiento'}</h3>
            </div>
            <label className={styles.publishToggle}>
              <input
                type="checkbox"
                checked={Boolean(draft.published)}
                onChange={(event) => onChange('published', event.target.checked)}
              />
              <span>{draft.published ? 'Publicada' : 'Borrador'}</span>
            </label>
          </div>

          <div className={styles.preSaveMainFields}>
            <section className={styles.preSaveCoverArea}>
              <div className={styles.preSaveCoverPreview}>
                <Image
                  src={draft.cover || '/pausa-min.jpg'}
                  alt={draft.title ? `Portada de ${draft.title}` : 'Portada del lanzamiento'}
                  width={460}
                  height={460}
                />
              </div>
              <label className={styles.preSaveUploadButton}>
                {uploadingCover ? 'Subiendo portada...' : 'Cambiar portada'}
                <input
                  className={styles.hiddenInput}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/avif"
                  onChange={onCoverUpload}
                  disabled={uploadingCover}
                />
              </label>
            </section>

            <div className={styles.preSaveFields}>
              <label>
                Título del lanzamiento
                <input
                  value={draft.title}
                  onChange={(event) => onChange('title', event.target.value)}
                  placeholder="Nombre de la canción"
                  required
                  maxLength={140}
                />
              </label>
              <label>
                Fecha de estreno
                <input
                  type="date"
                  value={draft.releaseDate}
                  onChange={(event) => onChange('releaseDate', event.target.value)}
                />
              </label>
              <label>
                Texto breve
                <textarea
                  value={draft.description}
                  onChange={(event) => onChange('description', event.target.value)}
                  placeholder="Una frase para acompañar el lanzamiento."
                  maxLength={600}
                  rows={5}
                />
              </label>
            </div>
          </div>

          <section className={styles.preSaveBackgroundArea}>
            <div className={styles.preSaveBackgroundHead}>
              <div>
                <p className={styles.sectionEyebrow}>Página pública</p>
                <h3>Fondo de campaña</h3>
              </div>
              <p>1920 × 1080 px · JPG, PNG, WebP o AVIF · máximo 20 MB.</p>
            </div>
            <div className={styles.preSaveBackgroundPreview}>
              <Image
                src={draft.background || draft.cover || '/pausa-min.jpg'}
                alt="Vista previa del fondo de campaña"
                width={1280}
                height={720}
              />
              <span>{draft.background ? 'Fondo personalizado' : 'Usando la portada'}</span>
            </div>
            <div className={styles.preSaveBackgroundActions}>
              <label className={styles.preSaveUploadButton}>
                {uploadingBackground
                  ? 'Subiendo fondo...'
                  : draft.background
                    ? 'Cambiar fondo'
                    : 'Subir fondo'}
                <input
                  className={styles.hiddenInput}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/avif"
                  onChange={onBackgroundUpload}
                  disabled={uploadingBackground}
                />
              </label>
              {draft.background ? (
                <button
                  type="button"
                  className={styles.preSaveClearBackground}
                  onClick={onBackgroundClear}
                  disabled={uploadingBackground}
                >
                  Usar portada
                </button>
              ) : null}
            </div>
          </section>

          <section className={styles.preSavePlatforms}>
            <div className={styles.preSavePlatformsHead}>
              <div>
                <p className={styles.sectionEyebrow}>Destinos</p>
                <h3>Enlaces de pre-save</h3>
              </div>
              <p>Deja vacío lo que todavía no esté disponible.</p>
            </div>
            <div className={styles.preSavePlatformGrid}>
              {PLATFORM_PRESETS.map((platform) => (
                <label key={platform.id}>
                  <span>{platform.label}</span>
                  <input
                    type="url"
                    value={draft.platforms?.find((item) => item.id === platform.id)?.link || ''}
                    onChange={(event) => onPlatformChange(platform, event.target.value)}
                    placeholder="https://..."
                  />
                </label>
              ))}
            </div>
          </section>

          {error ? <p className={styles.error}>{error}</p> : null}
          {message ? <p className={styles.message}>{message}</p> : null}

          <div className={`${styles.actions} ${styles.preSaveActions}`}>
            <button
              type="submit"
              className={styles.saveButton}
              disabled={saving || uploadingCover || uploadingBackground}
            >
              {saving ? 'Guardando...' : isNew ? 'Crear campaña' : 'Guardar cambios'}
            </button>
            {!isNew ? (
              <button type="button" className={styles.delete} onClick={onDelete} disabled={saving}>
                Eliminar campaña
              </button>
            ) : null}
          </div>
        </form>
      </div>
    </div>
  );
}
