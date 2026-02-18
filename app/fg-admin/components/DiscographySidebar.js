import Image from 'next/image';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPenToSquare } from '@fortawesome/free-solid-svg-icons';
import styles from '../page.module.css';

export default function DiscographySidebar({
  manualMode,
  toggleManualMode,
  bulkSelectMode,
  setBulkSelectMode,
  handleOpenAlbumModal,
  releasesByAlbum,
  setSelectedAlbumId,
  toggleAlbum,
  expandedAlbums,
  handleOpenEditAlbumModal,
  bulkDeleteByAlbum,
  handleBulkDeleteInAlbum,
  handleNewDraftInAlbum,
  toggleBulkDeleteSelection,
  selectedId,
  handleSelectRelease,
}) {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.sidebarHead}>
        <h2>Lanzamientos</h2>
        <div className={styles.sidebarHeadActions}>
          <button
            type="button"
            className={manualMode ? styles.selectionToggleActive : styles.selectionToggle}
            onClick={toggleManualMode}
            aria-label={manualMode ? 'Ocultar modo manual' : 'Activar modo manual'}
            title={manualMode ? 'Ocultar modo manual' : 'Activar modo manual'}
          >
            <span className={styles.selectionToggleIcon} aria-hidden="true">
              {manualMode ? '✎' : '⌁'}
            </span>
          </button>
          <button
            type="button"
            className={bulkSelectMode ? styles.selectionToggleActive : styles.selectionToggle}
            onClick={() => setBulkSelectMode((prev) => !prev)}
            aria-label={bulkSelectMode ? 'Ocultar seleccion multiple' : 'Activar seleccion multiple'}
            title={bulkSelectMode ? 'Ocultar seleccion multiple' : 'Activar seleccion multiple'}
          >
            <span className={styles.selectionToggleIcon} aria-hidden="true">
              {bulkSelectMode ? '✓' : '☷'}
            </span>
          </button>
        </div>
      </div>
      <button type="button" className={styles.newAlbumButton} onClick={handleOpenAlbumModal}>
        <span className={styles.actionIcon}>+</span>
        <span>Nuevo disco</span>
      </button>
      <div className={styles.tree}>
        {releasesByAlbum.map(({ album, releases: albumReleases }) => (
          <section className={styles.treeAlbum} key={album.id}>
            <div className={styles.treeAlbumHeadRow}>
              <button
                type="button"
                className={styles.treeAlbumHead}
                onClick={() => {
                  setSelectedAlbumId(album.id);
                  toggleAlbum(album.id);
                }}
              >
                <span className={styles.treeAlbumTitleWrap}>
                  <span className={styles.treeAlbumGlyph}>◌</span>
                  <span className={styles.treeAlbumTitle}>{album.title}</span>
                </span>
                <span className={styles.treeAlbumMeta}>
                  <span className={styles.treeAlbumCount}>{albumReleases.length}</span>
                  {expandedAlbums[album.id] ? '▾' : '▸'}
                </span>
              </button>
              <button
                type="button"
                className={styles.treeAlbumEditIcon}
                onClick={() => handleOpenEditAlbumModal(album)}
                aria-label={`Editar disco ${album.title}`}
                title="Editar disco"
              >
                <FontAwesomeIcon icon={faPenToSquare} />
              </button>
            </div>
            {expandedAlbums[album.id] ? (
              <div className={styles.treeSongs}>
                {bulkSelectMode && (bulkDeleteByAlbum[album.id]?.length ?? 0) > 0 ? (
                  <button
                    type="button"
                    className={styles.bulkDeleteButton}
                    onClick={() => handleBulkDeleteInAlbum(album.id)}
                  >
                    <span className={styles.actionIcon}>x</span>
                    <span>Borrar seleccionadas ({bulkDeleteByAlbum[album.id].length})</span>
                  </button>
                ) : null}
                {manualMode ? (
                  <button
                    type="button"
                    className={styles.addSongButton}
                    onClick={() => handleNewDraftInAlbum(album.id)}
                  >
                    <span className={styles.actionIcon}>+</span>
                    <span>Agregar cancion</span>
                  </button>
                ) : null}
                {albumReleases.map((release) =>
                  bulkSelectMode ? (
                    <div key={release.id} className={styles.songRow}>
                      <label className={styles.songCheckbox}>
                        <input
                          type="checkbox"
                          checked={(bulkDeleteByAlbum[album.id] ?? []).includes(release.id)}
                          onChange={() => toggleBulkDeleteSelection(album.id, release.id)}
                        />
                      </label>
                      <button
                        type="button"
                        className={release.id === selectedId ? styles.itemActive : styles.item}
                        onClick={() => handleSelectRelease(release)}
                      >
                        <Image
                          className={styles.treeSongCover}
                          src={release.cover || '/pausa-min.jpg'}
                          alt={`Portada de ${release.title}`}
                          width={54}
                          height={54}
                        />
                        <span className={styles.treeSongBody}>
                          <span className={styles.songTitleRow}>
                            <strong>{release.title}</strong>
                          </span>
                          <small>{release.releaseDate}</small>
                        </span>
                      </button>
                    </div>
                  ) : (
                    <button
                      key={release.id}
                      type="button"
                      className={release.id === selectedId ? styles.itemActive : styles.item}
                      onClick={() => handleSelectRelease(release)}
                    >
                      <Image
                        className={styles.treeSongCover}
                        src={release.cover || '/pausa-min.jpg'}
                        alt={`Portada de ${release.title}`}
                        width={54}
                        height={54}
                      />
                      <span className={styles.treeSongBody}>
                        <span className={styles.songTitleRow}>
                          <strong>{release.title}</strong>
                        </span>
                        <small>{release.releaseDate}</small>
                      </span>
                    </button>
                  ),
                )}
              </div>
            ) : null}
          </section>
        ))}
      </div>
    </aside>
  );
}
