import { Bar } from 'react-chartjs-2';
import styles from '../page.module.css';

export default function DashboardSection({
  albums,
  releases,
  preSaves,
  newInquiryCount,
  totalGlobalClicks,
  topChannel,
  releaseStatsSummary,
  dashboardTopReleasesChartData,
  dashboardBarOptions,
  latestReleaseItem,
  nextReleaseItem,
  mostClickedRelease,
  onSetActiveSection,
  onOpenReleaseItem,
  onCreateCampaign,
  onOpenSpotify,
}) {
  const renderReleaseDetails = (item) => (
    <div className={styles.dashboardInfoRows}>
      <p>
        <strong>{item.title}</strong>
      </p>
      <p>{item.releaseDate}</p>
      <p>
        {item._source === 'campaign'
          ? 'Campaña publicada'
          : `Disco: ${albums.find((album) => album.id === item.albumId)?.title || 'Sin disco'}`}
      </p>
      <button
        type="button"
        className={styles.dashboardTextAction}
        onClick={() => onOpenReleaseItem(item)}
      >
        Administrar
      </button>
    </div>
  );

  return (
    <>
      <p className={styles.sectionEyebrow}>Fragmentado</p>
      <h2>Inicio</h2>
      <p className={styles.editorHint}>
        Estado del sitio, próximos lanzamientos y actividad del catálogo.
      </p>

      <section className={styles.dashboardGrid}>
        <article className={styles.dashboardStatCard}>
          <p>Solicitudes nuevas</p>
          <strong>{newInquiryCount}</strong>
        </article>
        <article className={styles.dashboardStatCard}>
          <p>Total de canciones</p>
          <strong>{releases.length}</strong>
        </article>
        <article className={styles.dashboardStatCard}>
          <p>Campañas de lanzamiento</p>
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
            renderReleaseDetails(latestReleaseItem)
          ) : (
            <p className={styles.inlineNote}>Aun no hay lanzamientos.</p>
          )}
        </article>
        <article className={styles.dashboardCard}>
          <h3>Proximo lanzamiento</h3>
          {nextReleaseItem ? (
            renderReleaseDetails(nextReleaseItem)
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
            <button type="button" className={styles.buttonInfo} onClick={onCreateCampaign}>
              Crear campaña
            </button>
            <button type="button" className={styles.buttonInfo} onClick={onOpenSpotify}>
              Importar desde Spotify
            </button>
            <button type="button" className={styles.buttonInfo} onClick={() => onSetActiveSection('contrataciones')}>
              Ver contrataciones
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
