import Image from 'next/image';
import styles from '../page.module.css';

export default function DiscographyEditorSection({
  isNew,
  selectedRelease,
  showManualEditor,
  onSetActiveSection,
  toggleManualMode,
  handleSave,
  hasCover,
  draft,
  uploadingCover,
  handleCoverUpload,
  setDraft,
  globalArtistName,
  previewFetchStatus,
  hasPreviewAudio,
  previewFetchMessage,
  hasSpotifyPlatformLink,
  resolvingSpotifyPreview,
  handleResolveSpotifyPreview,
  PLATFORM_PRESETS,
  getPlatformLink,
  setPlatformLink,
  saveError,
  message,
  handleDelete,
}) {
  return (
    <>
      <h2>{isNew ? 'Nuevo lanzamiento' : `Editar: ${selectedRelease?.title ?? ''}`}</h2>
      <p className={styles.editorHint}>
        Edita los datos del lanzamiento y guarda para reflejar cambios en el sitio.
      </p>
      <p className={styles.inlineNote}>
        El estado se calcula automaticamente segun la fecha de lanzamiento.
      </p>

      {!showManualEditor ? (
        <section className={styles.platformsSection}>
          <p className={styles.inlineNote}>
            Usa <strong>Configuracion</strong> para importar canciones desde Spotify.
          </p>
          <div className={styles.actions}>
            <button type="button" className={styles.buttonInfo} onClick={() => onSetActiveSection('configuracion')}>
              Ir a Spotify
            </button>
            <button type="button" className={styles.buttonNeutral} onClick={toggleManualMode}>
              Activar modo manual
            </button>
          </div>
        </section>
      ) : (
        <form className={styles.form} onSubmit={handleSave}>
          <section className={styles.coverSection}>
            <h3 className={styles.subheading}>Portada</h3>
            <div className={styles.coverManager}>
              {hasCover ? (
                <Image
                  className={styles.coverHero}
                  src={draft.cover}
                  alt="Portada actual"
                  width={360}
                  height={360}
                />
              ) : (
                <div className={styles.coverEmpty}>
                  <span>Sin portada cargada</span>
                </div>
              )}

              <label className={hasCover ? styles.coverOverlayButton : styles.coverAddButton}>
                {uploadingCover
                  ? 'Subiendo...'
                  : hasCover
                    ? 'Reemplazar portada'
                    : 'Agregar portada'}
                <input
                  className={styles.hiddenInput}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleCoverUpload}
                />
              </label>
            </div>
            {draft.cover ? <span className={styles.inlineNote}>Actual: {draft.cover}</span> : null}
          </section>

          <div className={styles.grid}>
            <label>
              Titulo
              <input
                value={draft.title}
                onChange={(event) => setDraft((prev) => ({ ...prev, title: event.target.value }))}
                required
                placeholder="Tuyo Nomas"
              />
            </label>
            <label>
              Fecha de lanzamiento
              <input
                type="date"
                value={draft.releaseDate}
                onChange={(event) => setDraft((prev) => ({ ...prev, releaseDate: event.target.value }))}
              />
            </label>
            <label>
              Link de YouTube
              <input
                value={draft.youtube}
                onChange={(event) => setDraft((prev) => ({ ...prev, youtube: event.target.value }))}
                placeholder="https://youtu.be/..."
              />
            </label>
          </div>
          <p className={styles.inlineNote}>
            Artista global aplicado: <strong>{globalArtistName}</strong>
          </p>

          <p className={styles.inlineNote}>
            Preview de audio: se obtiene automaticamente desde Spotify (si esta disponible).
          </p>
          <div className={styles.previewStatusRow}>
            <span
              className={
                previewFetchStatus === 'error'
                  ? styles.previewErrorBadge
                  : hasPreviewAudio
                    ? styles.previewReadyBadge
                    : previewFetchStatus === 'loading'
                      ? styles.previewLoadingBadge
                      : styles.previewMissingBadge
              }
            >
              {previewFetchStatus === 'error'
                ? 'Error preview'
                : previewFetchStatus === 'loading'
                  ? 'Obteniendo...'
                  : hasPreviewAudio
                    ? 'Preview detectado'
                    : 'Sin preview'}
            </span>
            <span className={styles.inlineNote}>
              {previewFetchMessage
                ? previewFetchMessage
                : hasPreviewAudio
                  ? 'Guarda para persistir este preview en el lanzamiento.'
                  : hasSpotifyPlatformLink
                    ? 'Spotify puede no tener preview para este track.'
                    : 'Agrega primero el link de Spotify para consultarlo.'}
            </span>
          </div>
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.buttonInfo}
              onClick={handleResolveSpotifyPreview}
              disabled={resolvingSpotifyPreview || !hasSpotifyPlatformLink}
            >
              {resolvingSpotifyPreview
                ? 'Obteniendo preview...'
                : hasPreviewAudio
                  ? 'Actualizar preview de Spotify'
                  : 'Obtener preview de Spotify'}
            </button>
          </div>
          {draft.previewAudio ? (
            <audio className={styles.audioPreview} src={draft.previewAudio} controls preload="none" />
          ) : null}

          <section className={styles.platformsSection}>
            <div className={styles.platformsHead}>
              <h3>Plataformas</h3>
              <span className={styles.inlineNote}>
                Fijas: Spotify, Apple Music, Amazon Music y Deezer
              </span>
            </div>

            <div className={styles.platformRows}>
              {PLATFORM_PRESETS.map((preset) => (
                <article className={styles.platformRow} key={preset.id}>
                  <Image
                    className={styles.platformPreview}
                    src={preset.icon}
                    alt={preset.title}
                    width={120}
                    height={34}
                  />
                  <label>
                    Link de {preset.title}
                    <input
                      value={getPlatformLink(preset.id)}
                      onChange={(event) => setPlatformLink(preset, event.target.value)}
                      placeholder="https://..."
                    />
                  </label>
                </article>
              ))}
            </div>
          </section>

          {saveError ? <p className={styles.error}>{saveError}</p> : null}
          {message ? <p className={styles.message}>{message}</p> : null}

          <div className={styles.actions}>
            <button type="submit" className={styles.saveButton}>
              Guardar
            </button>
            {!isNew ? (
              <button type="button" className={styles.delete} onClick={handleDelete}>
                Eliminar lanzamiento
              </button>
            ) : null}
          </div>
        </form>
      )}
    </>
  );
}
