import Image from 'next/image';
import Link from 'next/link';
import monogram from '../assets/Monograma.avif';
import { getPreSaves } from '../../lib/server/content-store';
import styles from './page.module.css';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata = {
  title: 'Pre-save | Fragmentado',
  description: 'Guarda los próximos lanzamientos de Fragmentado antes de su estreno.',
  alternates: { canonical: '/pre-save' },
  openGraph: {
    title: 'Pre-save | Fragmentado',
    description: 'Sé de los primeros en escuchar los próximos lanzamientos de Fragmentado.',
    url: '/pre-save',
  },
};

const formatDate = (value) => {
  if (!value) return '';
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('es-MX', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
};

const getTrackedUrl = (url, campaignId, platformId) => {
  try {
    const tracked = new URL(url);
    tracked.searchParams.set('utm_source', 'fragmentado_site');
    tracked.searchParams.set('utm_medium', 'pre_save');
    tracked.searchParams.set('utm_campaign', campaignId);
    tracked.searchParams.set('utm_content', platformId);
    return tracked.toString();
  } catch {
    return url;
  }
};

export default async function PreSavePage() {
  const today = new Date().toISOString().slice(0, 10);
  const campaigns = (await getPreSaves())
    .filter((campaign) => campaign.published)
    .sort((a, b) => {
      const aUpcoming = String(a.releaseDate) >= today;
      const bUpcoming = String(b.releaseDate) >= today;
      if (aUpcoming !== bUpcoming) return aUpcoming ? -1 : 1;
      return aUpcoming
        ? String(a.releaseDate).localeCompare(String(b.releaseDate))
        : String(b.releaseDate).localeCompare(String(a.releaseDate));
    });
  const featured = campaigns[0] ?? null;
  const remaining = campaigns.slice(1);

  if (!featured) {
    return (
      <main className={styles.emptyPage}>
        <Link className={styles.wordmark} href="/">Fragmentado</Link>
        <div className={styles.emptyContent}>
          <Image className={styles.monogram} src={monogram} alt="Monograma de Fragmentado" priority />
          <p>Próximo lanzamiento</p>
          <h1>Muy pronto</h1>
          <Link className={styles.backLink} href="/">Volver al sitio</Link>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link className={styles.wordmark} href="/">Fragmentado</Link>
        <Link className={styles.siteLink} href="/">Sitio oficial</Link>
      </header>

      <section className={styles.hero}>
        <Image
          className={styles.heroImage}
          src={featured.background || featured.cover || '/pausa-min.jpg'}
          alt={`Fondo de ${featured.title}`}
          fill
          priority
          sizes="100vw"
        />
        <div className={styles.heroShade} />
        <div className={styles.heroContent}>
          <p className={styles.eyebrow}>Nuevo lanzamiento · {featured.artist}</p>
          <h1>{featured.title}</h1>
          <p className={styles.releaseDate}>{formatDate(featured.releaseDate)}</p>
          {featured.description ? <p className={styles.description}>{featured.description}</p> : null}
          <div className={styles.platforms} aria-label="Plataformas de pre-save">
            {featured.platforms.map((platform) => (
              <a
                key={platform.id}
                href={getTrackedUrl(platform.link, featured.id, platform.id)}
                target="_blank"
                rel="noopener noreferrer"
              >
                <span>{platform.label}</span>
                <strong>Pre-save</strong>
                <span aria-hidden="true">↗</span>
              </a>
            ))}
          </div>
        </div>
        <a className={styles.scrollCue} href="#mas-lanzamientos" aria-label="Ver más lanzamientos">
          <span />
        </a>
      </section>

      <section className={styles.moreSection} id="mas-lanzamientos">
        <div className={styles.sectionHeading}>
          <p>Fragmentado</p>
          <h2>{remaining.length ? 'Más lanzamientos' : 'Relatando Historias'}</h2>
        </div>

        {remaining.length ? (
          <div className={styles.campaignGrid}>
            {remaining.map((campaign) => (
              <article className={styles.campaign} key={campaign.id}>
                <Image
                  src={campaign.cover || '/pausa-min.jpg'}
                  alt={`Portada de ${campaign.title}`}
                  width={640}
                  height={640}
                  sizes="(max-width: 720px) 100vw, 50vw"
                />
                <div>
                  <p>{formatDate(campaign.releaseDate)}</p>
                  <h3>{campaign.title}</h3>
                  <div className={styles.compactLinks}>
                    {campaign.platforms.map((platform) => (
                      <a
                        key={platform.id}
                        href={getTrackedUrl(platform.link, campaign.id, platform.id)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {platform.label} ↗
                      </a>
                    ))}
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className={styles.signature}>
            <Image src={monogram} alt="" aria-hidden="true" />
            <p>Gracias por acompañarnos antes de que comience la historia.</p>
          </div>
        )}
      </section>

      <footer className={styles.footer}>
        <span>© {new Date().getFullYear()} Fragmentado</span>
        <a href="https://www.yootsmusic.com" target="_blank" rel="noopener noreferrer">Producción · Yoots Music</a>
      </footer>
    </main>
  );
}
