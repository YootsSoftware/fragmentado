import Image from 'next/image';
import Link from 'next/link';
import { unstable_cache } from 'next/cache';
import monogram from '../assets/Monograma.avif';
import { getPreSaves } from '../../lib/server/content-store';
import {
  CAMPAIGN_PHASE_COPY,
  getCampaignPhase,
  getMexicoDateKey,
  sortCampaignsForDisplay,
} from '../../lib/campaign-state';
import styles from './page.module.css';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const getCachedPreSaves = unstable_cache(
  getPreSaves,
  ['fragmentado-public-pre-saves'],
  { revalidate: 60, tags: ['public-pre-saves'] },
);

export async function generateMetadata() {
  const today = getMexicoDateKey();
  const featured = sortCampaignsForDisplay(
    (await getCachedPreSaves()).filter((campaign) => campaign.published),
    today,
  )[0] ?? null;
  const phase = featured ? getCampaignPhase(featured.releaseDate, today) : 'upcoming';
  const title = featured ? `${featured.title} | Fragmentado` : 'Lanzamiento | Fragmentado';
  const description = featured
    ? phase === 'upcoming'
      ? `Haz pre-save de ${featured.title}, el próximo lanzamiento de Fragmentado.`
      : `Escucha ${featured.title}, ${CAMPAIGN_PHASE_COPY[phase].eyebrow.toLowerCase()} de Fragmentado.`
    : 'Descubre el próximo lanzamiento de Fragmentado.';
  const socialImage = featured?.background || featured?.cover || '/pausa-min.jpg';

  return {
    title,
    description,
    alternates: { canonical: '/lanzamiento' },
    openGraph: {
      title,
      description,
      url: '/lanzamiento',
      images: [{ url: socialImage, alt: featured?.title || 'Fragmentado' }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [socialImage],
    },
  };
}

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

const getTrackedUrl = (url, campaignId, platformId, phase) => {
  try {
    const tracked = new URL(url);
    tracked.searchParams.set('utm_source', 'fragmentado_site');
    tracked.searchParams.set('utm_medium', phase === 'upcoming' ? 'pre_save' : 'release_page');
    tracked.searchParams.set('utm_campaign', campaignId);
    tracked.searchParams.set('utm_content', platformId);
    return tracked.toString();
  } catch {
    return url;
  }
};

const getPlatformUrl = (platform, phase) => (
  phase === 'upcoming' ? platform.link : platform.releaseLink || platform.link
);

export default async function LaunchPage() {
  const today = getMexicoDateKey();
  const campaigns = sortCampaignsForDisplay(
    (await getCachedPreSaves()).filter((campaign) => campaign.published),
    today,
  );
  const featured = campaigns[0] ?? null;
  const remaining = campaigns.slice(1);
  const featuredPhase = featured ? getCampaignPhase(featured.releaseDate, today) : 'upcoming';
  const featuredCopy = CAMPAIGN_PHASE_COPY[featuredPhase];

  if (!featured) {
    return (
      <main className={styles.emptyPage}>
        <Link className={styles.wordmark} href="/">
          <Image
            className={styles.headerMonogram}
            src={monogram}
            alt=""
            aria-hidden="true"
            priority
          />
          <span>Fragmentado</span>
        </Link>
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
        <Link className={styles.wordmark} href="/">
          <Image
            className={styles.headerMonogram}
            src={monogram}
            alt=""
            aria-hidden="true"
            priority
          />
          <span>Fragmentado</span>
        </Link>
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
          <p className={styles.eyebrow}>{featuredCopy.eyebrow} · {featured.artist}</p>
          <h1>{featured.title}</h1>
          <p className={styles.releaseDate}>{formatDate(featured.releaseDate)}</p>
          {featured.description ? <p className={styles.description}>{featured.description}</p> : null}
          <div className={styles.platforms} aria-label="Plataformas del lanzamiento">
            {featured.platforms
              .filter((platform) => getPlatformUrl(platform, featuredPhase))
              .map((platform) => (
              <a
                key={platform.id}
                href={getTrackedUrl(
                  getPlatformUrl(platform, featuredPhase),
                  featured.id,
                  platform.id,
                  featuredPhase,
                )}
                target="_blank"
                rel="noopener noreferrer"
              >
                <span>{platform.label}</span>
                <strong>{featuredCopy.action}</strong>
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
            {remaining.map((campaign) => {
              const campaignPhase = getCampaignPhase(campaign.releaseDate, today);
              return (
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
                    {campaign.platforms
                      .filter((platform) => getPlatformUrl(platform, campaignPhase))
                      .map((platform) => (
                      <a
                        key={platform.id}
                        href={getTrackedUrl(
                          getPlatformUrl(platform, campaignPhase),
                          campaign.id,
                          platform.id,
                          campaignPhase,
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {platform.label} ↗
                      </a>
                      ))}
                  </div>
                </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className={styles.signature}>
            <p>Gracias por acompañar esta historia.</p>
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
