import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGear, faKey, faUserShield } from '@fortawesome/free-solid-svg-icons';
import styles from '../page.module.css';

export default function ConfigSection({
  accountDraft,
  setAccountDraft,
  accountError,
  accountMessage,
  onUpdateAccount,
  settingsDraft,
  setSettingsDraft,
  spotifyEnv,
  settingsError,
  settingsMessage,
  onSaveSettings,
  onFetchSpotifySongs,
  spotifyFetchLoading,
  spotifyFetchError,
  spotifyNotice,
  spotifyBulkLoading,
  spotifyBulkProgress,
  spotifySongs,
  spotifyMeta,
  spotifySelectedIds,
  onToggleAllSpotifySongs,
  spotifyFallbackAlbumId,
  setSpotifyFallbackAlbumId,
  albums,
  onBulkImportSpotifySongs,
  onToggleSpotifySong,
  resolveAlbumForSpotifySong,
}) {
  return (
    <>
      <h2>Configuracion</h2>
      <p className={styles.editorHint}>
        Administra cuenta, artista global del proyecto y conexion con Spotify API.
      </p>
      <div className={styles.configWrap}>
        <section className={`${styles.platformsSection} ${styles.configCard}`}>
          <div className={styles.configCardHead}>
            <span className={styles.configCardIcon} aria-hidden="true">
              <FontAwesomeIcon icon={faUserShield} />
            </span>
            <div className={styles.configCardTitleGroup}>
              <h3>Cuenta de administrador</h3>
              <p>Credenciales de acceso para fg-admin.</p>
            </div>
          </div>
          <form className={`${styles.form} ${styles.configForm}`} onSubmit={onUpdateAccount}>
            <div className={styles.configGridTwo}>
              <label>
                Usuario
                <input
                  value={accountDraft.username}
                  onChange={(event) =>
                    setAccountDraft((prev) => ({ ...prev, username: event.target.value }))
                  }
                  required
                  minLength={4}
                />
              </label>
              <label>
                Contrasena actual
                <input
                  type="password"
                  value={accountDraft.currentPassword}
                  onChange={(event) =>
                    setAccountDraft((prev) => ({ ...prev, currentPassword: event.target.value }))
                  }
                  required
                />
              </label>
              <label>
                Nueva contrasena
                <input
                  type="password"
                  value={accountDraft.newPassword}
                  onChange={(event) =>
                    setAccountDraft((prev) => ({ ...prev, newPassword: event.target.value }))
                  }
                  minLength={8}
                  placeholder="Opcional si no deseas cambiarla"
                />
              </label>
              <label>
                Confirmar nueva contrasena
                <input
                  type="password"
                  value={accountDraft.confirmPassword}
                  onChange={(event) =>
                    setAccountDraft((prev) => ({ ...prev, confirmPassword: event.target.value }))
                  }
                  minLength={8}
                />
              </label>
            </div>
            {accountError ? <p className={styles.error}>{accountError}</p> : null}
            {accountMessage ? <p className={styles.message}>{accountMessage}</p> : null}
            <div className={`${styles.actions} ${styles.configActions}`}>
              <button type="submit" className={styles.buttonSuccess}>
                <FontAwesomeIcon icon={faKey} />
                Guardar cuenta
              </button>
            </div>
          </form>
        </section>

        <section className={`${styles.platformsSection} ${styles.configCard}`}>
          <div className={styles.configCardHead}>
            <span className={styles.configCardIcon} aria-hidden="true">
              <FontAwesomeIcon icon={faGear} />
            </span>
            <div className={styles.configCardTitleGroup}>
              <h3>Proyecto y Spotify API</h3>
              <p>Datos globales para sincronizacion automatica.</p>
            </div>
          </div>
          <form className={`${styles.form} ${styles.configForm}`} onSubmit={onSaveSettings}>
            <div className={styles.configGridTwo}>
              <label>
                Nombre artistico global
                <input
                  value={settingsDraft.artistName}
                  onChange={(event) =>
                    setSettingsDraft((prev) => ({ ...prev, artistName: event.target.value }))
                  }
                />
              </label>
              <div className={styles.configFieldSpanTwo}>
                <p className={styles.inlineNote}>Redes sociales del grupo (visibles en el Hero).</p>
              </div>
              <label>
                Facebook
                <input
                  type="url"
                  placeholder="https://facebook.com/..."
                  value={settingsDraft.socials?.facebook ?? ''}
                  onChange={(event) =>
                    setSettingsDraft((prev) => ({
                      ...prev,
                      socials: {
                        ...(prev.socials ?? {}),
                        facebook: event.target.value,
                      },
                    }))
                  }
                />
              </label>
              <label>
                Instagram
                <input
                  type="url"
                  placeholder="https://instagram.com/..."
                  value={settingsDraft.socials?.instagram ?? ''}
                  onChange={(event) =>
                    setSettingsDraft((prev) => ({
                      ...prev,
                      socials: {
                        ...(prev.socials ?? {}),
                        instagram: event.target.value,
                      },
                    }))
                  }
                />
              </label>
              <label>
                YouTube
                <input
                  type="url"
                  placeholder="https://youtube.com/..."
                  value={settingsDraft.socials?.youtube ?? ''}
                  onChange={(event) =>
                    setSettingsDraft((prev) => ({
                      ...prev,
                      socials: {
                        ...(prev.socials ?? {}),
                        youtube: event.target.value,
                      },
                    }))
                  }
                />
              </label>
              <label>
                TikTok
                <input
                  type="url"
                  placeholder="https://tiktok.com/@..."
                  value={settingsDraft.socials?.tiktok ?? ''}
                  onChange={(event) =>
                    setSettingsDraft((prev) => ({
                      ...prev,
                      socials: {
                        ...(prev.socials ?? {}),
                        tiktok: event.target.value,
                      },
                    }))
                  }
                />
              </label>
              <div className={styles.configFieldSpanTwo}>
                <p className={styles.inlineNote}>
                  Spotify se configura por variables de entorno: <code>SPOTIFY_CLIENT_ID</code>,{' '}
                  <code>SPOTIFY_CLIENT_SECRET</code>, <code>SPOTIFY_ARTIST_ID</code>,{' '}
                  <code>SPOTIFY_MARKET</code>.
                </p>
                <p className={styles.inlineNote}>
                  Estado: {spotifyEnv.configured ? 'configurado' : 'incompleto'} | Artist ID:{' '}
                  <strong>{spotifyEnv.artistId || '-'}</strong> | Market:{' '}
                  <strong>{spotifyEnv.market || 'MX'}</strong>
                </p>
              </div>
            </div>
            {settingsError ? <p className={styles.error}>{settingsError}</p> : null}
            {settingsMessage ? <p className={styles.message}>{settingsMessage}</p> : null}
            <div className={`${styles.actions} ${styles.configActions}`}>
              <button type="submit" className={styles.buttonSuccess}>Guardar configuracion</button>
              <button
                type="button"
                className={`${styles.buttonInfo} ${styles.spotifySyncButton}`}
                onClick={onFetchSpotifySongs}
                disabled={spotifyFetchLoading}
              >
                <span className={styles.spotifySyncIcon} aria-hidden="true">
                  <svg viewBox="0 0 24 24" role="presentation" focusable="false">
                    <path d="M12 0a12 12 0 1 0 0 24 12 12 0 0 0 0-24zm5.4 17.3a.74.74 0 0 1-1.02.24 10.4 10.4 0 0 0-8.94-1.06.74.74 0 0 1-.47-1.4 11.9 11.9 0 0 1 10.22 1.2c.35.2.47.66.2 1.02zm1.45-3.04a.93.93 0 0 1-1.27.3 13.06 13.06 0 0 0-11.13-1.3.93.93 0 1 1-.6-1.76 14.92 14.92 0 0 1 12.71 1.5c.44.24.6.8.29 1.26zm.13-3.17a1.1 1.1 0 0 1-1.5.36 16.3 16.3 0 0 0-12.95-1.64 1.1 1.1 0 1 1-.68-2.1 18.5 18.5 0 0 1 14.7 1.88c.52.3.69.97.43 1.5z" />
                  </svg>
                </span>
                {spotifyFetchLoading ? 'Consultando...' : 'Traer canciones de Spotify'}
              </button>
            </div>
          </form>
          {spotifyFetchError ? <p className={styles.error}>{spotifyFetchError}</p> : null}
          {spotifyNotice ? <p className={styles.message}>{spotifyNotice}</p> : null}
          {spotifyFetchLoading ? (
            <div className={styles.loaderRow} role="status" aria-live="polite">
              <span className={styles.loaderDot} />
              <span>Cargando canciones de Spotify...</span>
            </div>
          ) : null}
          {spotifyBulkLoading ? (
            <div className={styles.loaderRow} role="status" aria-live="polite">
              <span className={styles.loaderDot} />
              <span>
                Importando canciones a discos... {spotifyBulkProgress.current}/{spotifyBulkProgress.total}
              </span>
            </div>
          ) : null}
          {spotifySongs.length ? (
            <div className={styles.statsBox}>
              <p>
                Albums: <strong>{spotifyMeta.totalAlbums}</strong> | Canciones:{' '}
                <strong>{spotifyMeta.totalTracks}</strong> | Mercado:{' '}
                <strong>{spotifyMeta.market || '-'}</strong>
              </p>
              <div className={styles.spotifyBulkBar}>
                <label className={styles.spotifyCheckLabel}>
                  <input
                    type="checkbox"
                    checked={
                      spotifySelectedIds.length > 0 &&
                      spotifySelectedIds.length === spotifySongs.length
                    }
                    onChange={onToggleAllSpotifySongs}
                  />
                  Seleccionar todas
                </label>
                <label className={styles.spotifyFallbackField}>
                  Disco fallback
                  <select
                    value={spotifyFallbackAlbumId}
                    onChange={(event) => setSpotifyFallbackAlbumId(event.target.value)}
                  >
                    <option value="">Solo auto-asignar por nombre de disco</option>
                    {albums.map((album) => (
                      <option key={album.id} value={album.id}>
                        {album.title}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  type="button"
                  className={styles.spotifyImportButton}
                  onClick={onBulkImportSpotifySongs}
                  disabled={spotifyBulkLoading || !spotifySelectedIds.length}
                >
                  {spotifyBulkLoading
                    ? 'Importando...'
                    : `Importar seleccionadas (${spotifySelectedIds.length})`}
                </button>
              </div>
              <ul className={styles.statsList}>
                {spotifySongs.slice(0, 30).map((song) => {
                  const resolvedAlbumId = resolveAlbumForSpotifySong(song);
                  const resolvedAlbumTitle = albums.find((album) => album.id === resolvedAlbumId)?.title;
                  return (
                    <li key={`${song.id}-${song.albumId}`}>
                      <span>
                        <label className={styles.spotifyCheckLabel}>
                          <input
                            type="checkbox"
                            checked={spotifySelectedIds.includes(song.id)}
                            onChange={() => onToggleSpotifySong(song.id)}
                            disabled={spotifyBulkLoading}
                          />
                          <span />
                        </label>{' '}
                        {song.title} <small>({song.albumName})</small>
                      </span>
                      <div className={styles.spotifySongActions}>
                        <strong>{song.releaseDate || '-'}</strong>
                        <small>
                          {resolvedAlbumId ? `-> ${resolvedAlbumTitle || 'disco'}` : 'sin match'}
                        </small>
                      </div>
                    </li>
                  );
                })}
              </ul>
              {spotifySongs.length > 30 ? (
                <p className={styles.inlineNote}>Mostrando 30 de {spotifySongs.length} canciones.</p>
              ) : null}
            </div>
          ) : null}
        </section>
      </div>
    </>
  );
}
