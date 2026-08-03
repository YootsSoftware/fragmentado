import { Bar } from 'react-chartjs-2';
import styles from '../page.module.css';

export default function DashboardSection({
  albums,
  releases,
  preSaves,
  totalGlobalClicks,
  topChannel,
  releaseStatsSummary,
  dashboardTopReleasesChartData,
  dashboardBarOptions,
  latestReleaseItem,
  nextReleaseItem,
  mostClickedRelease,
  onSetActiveSection,
}) {
  return (
    <>
      <p className={styles.sectionEyebrow}>Fragmentado</p>
      <h2>Inicio</h2>
      <p className={styles.editorHint}>
        Estado del sitio, próximos lanzamientos y actividad del catálogo.
      </p>

      <section className={styles.dashboardGrid}>
        <article className={styles.dashboardStatCard}>
          <p>Total de discos</p>
          <strong>{albums.length}</strong>
        </article>
        <article className={styles.dashboardStatCard}>
          <p>Total de canciones</p>
          <strong>{releases.length}</strong>
        </article>
        <article className={styles.dashboardStatCard}>
          <p>Campañas pre-save</p>
          <strong>{preSaves.filter((item) => item.published).length}</strong>
        </article>
        <article className={styles.dashboardStatCard}>
          <p>Clics totales</p>
          <strong>{totalGlobalClicks}</strong>
        </article>
      </section>

      <section className={styles.dashboardGrid}>
        <article className={`${styles.dashboardCard} ${styles.dashboardWideCard}`}>
          <h3>Top 5 lanzamientos por clics</h3>
          {releaseStatsSummary.length ? (
            <div className={styles.dashboardChartCanvas}>
              <Bar data={dashboardTopReleasesChartData} options={dashboardBarOptions} />
            </div>
          ) : (
            <p className={styles.inlineNote}>Sin datos de clics para graficar.</p>
          )}
        </article>
      </section>

      <section className={styles.dashboardGrid}>
        <article className={styles.dashboardCard}>
          <h3>Ultimo lanzamiento</h3>
          {latestReleaseItem ? (
            <div className={styles.dashboardInfoRows}>
              <p>
                <strong>{latestReleaseItem.title}</strong>
              </p>
              <p>{latestReleaseItem.releaseDate}</p>
              <p>
                Disco:{' '}
                {albums.find((album) => album.id === latestReleaseItem.albumId)?.title || 'Sin disco'}
              </p>
            </div>
          ) : (
            <p className={styles.inlineNote}>Aun no hay lanzamientos.</p>
          )}
        </article>
        <article className={styles.dashboardCard}>
          <h3>Proximo lanzamiento</h3>
          {nextReleaseItem ? (
            <div className={styles.dashboardInfoRows}>
              <p>
                <strong>{nextReleaseItem.title}</strong>
              </p>
              <p>{nextReleaseItem.releaseDate}</p>
              <p>
                Disco:{' '}
                {albums.find((album) => album.id === nextReleaseItem.albumId)?.title || 'Sin disco'}
              </p>
            </div>
          ) : (
            <p className={styles.inlineNote}>No hay lanzamientos programados.</p>
          )}
        </article>
      </section>

      <section className={styles.dashboardGrid}>
        <article className={styles.dashboardCard}>
          <h3>Rendimiento</h3>
          {mostClickedRelease ? (
            <div className={styles.dashboardInfoRows}>
              <p>
                <strong>{mostClickedRelease.title}</strong>
              </p>
              <p>{mostClickedRelease.total} clics acumulados</p>
              <p>Canal principal: {topChannel?.channel || 'Sin datos'}</p>
            </div>
          ) : (
            <p className={styles.inlineNote}>Aun no hay clics registrados.</p>
          )}
        </article>
        <article className={styles.dashboardCard}>
          <h3>Acciones rapidas</h3>
          <div className={styles.actions}>
            <button type="button" className={styles.buttonInfo} onClick={() => onSetActiveSection('discografia')}>
              Administrar lanzamientos
            </button>
            <button type="button" className={styles.buttonInfo} onClick={() => onSetActiveSection('pre-save')}>
              Crear pre-save
            </button>
            <button type="button" className={styles.buttonInfo} onClick={() => onSetActiveSection('configuracion')}>
              Importar desde Spotify
            </button>
            <button type="button" className={styles.buttonNeutral} onClick={() => onSetActiveSection('estadisticas')}>
              Ver estadisticas
            </button>
          </div>
        </article>
      </section>
    </>
  );
}
