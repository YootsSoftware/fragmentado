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
          <h3 className={styles.subheading}>
            {albumModalMode === 'edit' ? 'Editar disco' : 'Nuevo disco'}
          </h3>
          <button type="button" className={styles.modalClose} onClick={onClose} aria-label="Cerrar modal" title="Cerrar">
            ×
          </button>
        </div>
        <form className={styles.form} onSubmit={onSaveAlbum}>
          <label>
            Titulo del disco
            <input
              value={albumDraft.title}
              onChange={(event) => setAlbumDraft((prev) => ({ ...prev, title: event.target.value }))}
              placeholder="Relatando Historias"
              required
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
          <div className={styles.actions}>
            <button type="submit" className={styles.buttonSuccess}>
              {albumModalMode === 'edit' ? 'Guardar cambios' : 'Crear disco'}
            </button>
            <button type="button" className={styles.buttonNeutral} onClick={onClose}>
              Cancelar
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
