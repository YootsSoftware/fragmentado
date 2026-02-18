import { Bar, Doughnut } from 'react-chartjs-2';
import styles from '../page.module.css';

export default function StatsSection({
  totalGlobalClicks,
  releaseStatsSummary,
  globalChannelSummary,
  globalTopReleasesChartData,
  barChartOptions,
  globalChannelsChartData,
  doughnutChartOptions,
  onLoadStats,
}) {
  return (
    <>
      <h2>Estadisticas</h2>
      <p className={styles.editorHint}>
        Vista general de rendimiento de toda la discografia.
      </p>
      <section className={styles.platformsSection}>
        <div className={styles.platformsHead}>
          <h3>Resumen general</h3>
          <button type="button" className={styles.buttonInfo} onClick={onLoadStats}>
            Actualizar
          </button>
        </div>
        <div className={styles.statsBox}>
          <p>
            Clics salientes totales: <strong>{totalGlobalClicks}</strong>
          </p>
          <p>
            Lanzamientos monitoreados: <strong>{releaseStatsSummary.length}</strong>
          </p>
          <p>
            Canales activos: <strong>{globalChannelSummary.length}</strong>
          </p>
        </div>
      </section>
      <section className={styles.platformsSection}>
        <div className={styles.platformsHead}>
          <h3>Top lanzamientos (global)</h3>
        </div>
        {releaseStatsSummary.length ? (
          <>
            <div className={styles.chartsGrid}>
              <article className={styles.chartCard}>
                <h4>Top lanzamientos por clics</h4>
                <div className={styles.chartCanvas}>
                  <Bar data={globalTopReleasesChartData} options={barChartOptions} />
                </div>
              </article>
              {globalChannelSummary.length ? (
                <article className={styles.chartCard}>
                  <h4>Canales con mas salida</h4>
                  <div className={styles.chartCanvas}>
                    <Doughnut data={globalChannelsChartData} options={doughnutChartOptions} />
                  </div>
                </article>
              ) : null}
            </div>
            <ul className={styles.statsList}>
              {releaseStatsSummary.map((item) => (
                <li key={item.id}>
                  <span>{item.title}</span>
                  <strong>{item.total}</strong>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className={styles.inlineNote}>Aun no hay clics registrados.</p>
        )}
      </section>
    </>
  );
}
