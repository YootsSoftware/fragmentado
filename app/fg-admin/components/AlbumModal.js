import styles from '../page.module.css';

export default function AlbumModal({
  showAlbumModal,
  onClose,
  albumModalMode,
  albumDraft,
  setAlbumDraft,
  YEAR_OPTIONS,
  onSaveAlbum,
}) {
  if (!showAlbumModal) return null;

  return (
    <div className={styles.modalBackdrop} onClick={onClose} role="presentation">
      <section
        className={styles.modalCard}
        role="dialog"
        aria-modal="true"
        aria-label={albumModalMode === 'edit' ? 'Editar disco' : 'Crear nuevo disco'}
        onClick={(event) => event.stopPropagation()}
      >
        <div className={styles.modalHead}>
          <div className={styles.modalTitleGroup}>
            <p className={styles.sectionEyebrow}>Discografía</p>
            <h3>{albumModalMode === 'edit' ? 'Editar disco' : 'Nuevo disco'}</h3>
            <p>
              {albumModalMode === 'edit'
                ? 'Actualiza la información que organiza este lanzamiento.'
                : 'Crea un espacio para agrupar sus canciones.'}
            </p>
          </div>
          <button type="button" className={styles.modalClose} onClick={onClose} aria-label="Cerrar modal" title="Cerrar">
            ×
          </button>
        </div>
        <form className={`${styles.form} ${styles.albumModalForm}`} onSubmit={onSaveAlbum}>
          <div className={styles.albumModalFields}>
            <label>
              Título del disco
              <input
                value={albumDraft.title}
                onChange={(event) => setAlbumDraft((prev) => ({ ...prev, title: event.target.value }))}
                placeholder="Relatando Historias"
                required
                autoFocus
              />
            </label>
            <label>
              Año
              <select
                value={albumDraft.year}
                onChange={(event) => setAlbumDraft((prev) => ({ ...prev, year: event.target.value }))}
              >
                {YEAR_OPTIONS.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className={`${styles.actions} ${styles.albumModalActions}`}>
            <button type="button" className={styles.buttonNeutral} onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className={styles.buttonSuccess}>
              {albumModalMode === 'edit' ? 'Guardar cambios' : 'Crear disco'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
