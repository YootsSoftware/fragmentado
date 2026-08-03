'use client';

import Image from 'next/image';
import { useEffect, useMemo, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlayCircle } from '@fortawesome/free-regular-svg-icons';
import { faCirclePause } from '@fortawesome/free-solid-svg-icons';
import {
  faFacebookF,
  faInstagram,
  faTiktok,
  faYoutube,
} from '@fortawesome/free-brands-svg-icons';
import monogram from './assets/Monograma.avif';
import { SITE_CONTENT } from '../lib/site-content';
import styles from './page.module.css';

const DARK_BASE = [13, 14, 15];
const DEFAULT_HERO_SETTINGS = {
  mediaType: 'youtube',
  releaseId: 'donde-empieza-termina',
};

const getReleaseTimestamp = (release) => {
  const parsed = new Date(String(release?.releaseDate ?? '').trim());
  return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime();
};

const sortReleasesByDateDesc = (list) =>
  [...list].sort((a, b) => getReleaseTimestamp(b) - getReleaseTimestamp(a));

const clampColor = (value) => Math.max(0, Math.min(255, Math.round(value)));

const mixColor = (a, b, ratio) => [
  clampColor(a[0] * (1 - ratio) + b[0] * ratio),
  clampColor(a[1] * (1 - ratio) + b[1] * ratio),
  clampColor(a[2] * (1 - ratio) + b[2] * ratio),
];

const rgbToString = (rgb) => `${rgb[0]} ${rgb[1]} ${rgb[2]}`;

const getAmbientPaletteFromImage = (src) =>
  new Promise((resolve) => {
    const image = new window.Image();
    image.crossOrigin = 'anonymous';
    image.src = src;

    image.onload = () => {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d', { willReadFrequently: true });
      if (!context) return resolve(null);

      const size = 28;
      canvas.width = size;
      canvas.height = size;
      context.drawImage(image, 0, 0, size, size);

      const { data } = context.getImageData(0, 0, size, size);
      let count = 0;
      let rSum = 0;
      let gSum = 0;
      let bSum = 0;
      let bestScore = -1;
      let vibrant = [120, 120, 120];

      for (let index = 0; index < data.length; index += 4) {
        if (data[index + 3] < 24) continue;
        const color = [data[index], data[index + 1], data[index + 2]];
        const max = Math.max(...color);
        const min = Math.min(...color);
        const saturation = max === 0 ? 0 : (max - min) / max;
        const brightness = color.reduce((sum, value) => sum + value, 0) / 765;
        const score = saturation * 0.76 + brightness * 0.24;

        rSum += color[0];
        gSum += color[1];
        bSum += color[2];
        count += 1;

        if (score > bestScore) {
          bestScore = score;
          vibrant = color;
        }
      }

      if (!count) return resolve(null);
      const average = [rSum / count, gSum / count, bSum / count].map(clampColor);
      const accent = mixColor(average, vibrant, 0.5);

      return resolve({
        a: mixColor(average, DARK_BASE, 0.52),
        b: mixColor(vibrant, DARK_BASE, 0.46),
        c: mixColor(accent, DARK_BASE, 0.6),
      });
    };

    image.onerror = () => resolve(null);
  });

const withTrackingParams = (url, releaseId, content) => {
  if (!url) return '';
  try {
    const parsedUrl = new URL(url);
    if (parsedUrl.protocol !== 'https:' && parsedUrl.protocol !== 'http:') return '';
    parsedUrl.searchParams.set('utm_source', 'fragmentado_site');
    parsedUrl.searchParams.set('utm_medium', 'official_site');
    parsedUrl.searchParams.set('utm_campaign', releaseId || 'fragmentado');
    parsedUrl.searchParams.set('utm_content', content);
    return parsedUrl.toString();
  } catch {
    return url;
  }
};

const formatReleaseDate = (value) => {
  if (!value) return '';
  const normalized = /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T12:00:00` : value;
  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(parsed);
};

const getYouTubeId = (value) => {
  const raw = String(value ?? '').trim();
  if (!raw) return '';
  try {
    const url = new URL(raw);
    if (url.hostname.includes('youtu.be')) return url.pathname.split('/').filter(Boolean)[0] ?? '';
    if (url.pathname.startsWith('/shorts/')) return url.pathname.split('/')[2] ?? '';
    return url.searchParams.get('v') ?? '';
  } catch {
    return '';
  }
};

const SOCIAL_ICON_MAP = {
  facebook: faFacebookF,
  instagram: faInstagram,
  youtube: faYoutube,
  tiktok: faTiktok,
};

const SOCIAL_LABEL_MAP = {
  facebook: 'Facebook',
  instagram: 'Instagram',
  youtube: 'YouTube',
  tiktok: 'TikTok',
};

function ContactForm() {
  const [status, setStatus] = useState({ state: 'idle', message: '' });

  const handleSubmit = async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());

    setStatus({ state: 'sending', message: 'Enviando solicitud...' });
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || 'No se pudo enviar la solicitud.');

      form.reset();
      setStatus({
        state: 'success',
        message: 'Solicitud recibida. El equipo de Fragmentado dará seguimiento a tu mensaje.',
      });
    } catch (error) {
      setStatus({
        state: 'error',
        message: error instanceof Error ? error.message : 'No se pudo enviar la solicitud.',
      });
    }
  };

  return (
    <form className={styles.contactForm} onSubmit={handleSubmit}>
      <div className={styles.honeypot} aria-hidden="true">
        <label htmlFor="website">Sitio web</label>
        <input id="website" name="website" tabIndex="-1" autoComplete="off" />
      </div>
      <label>
        Nombre <span>*</span>
        <input name="name" required maxLength="100" autoComplete="name" />
      </label>
      <label>
        Organización, municipio o empresa
        <input name="organization" maxLength="140" autoComplete="organization" />
      </label>
      <label>
        Correo electrónico <span>*</span>
        <input name="email" type="email" required maxLength="180" autoComplete="email" />
      </label>
      <label>
        Teléfono
        <input name="phone" type="tel" maxLength="40" autoComplete="tel" />
      </label>
      <label>
        Lugar del evento
        <input name="location" maxLength="180" />
      </label>
      <label>
        Fecha
        <input name="eventDate" type="date" />
      </label>
      <label>
        Tipo de evento <span>*</span>
        <select name="eventType" required defaultValue="">
          <option value="" disabled>Selecciona una opción</option>
          {SITE_CONTENT.eventTypes.map((eventType) => (
            <option key={eventType} value={eventType}>{eventType}</option>
          ))}
        </select>
      </label>
      <label>
        Duración aproximada
        <input name="duration" maxLength="80" placeholder="Ej. 60 minutos" />
      </label>
      <label>
        ¿Requiere equipo de audio?
        <select name="requiresAudio" defaultValue="Por definir">
          <option>Por definir</option>
          <option>Sí</option>
          <option>No</option>
        </select>
      </label>
      <label className={styles.messageField}>
        Mensaje <span>*</span>
        <textarea name="message" required maxLength="2400" rows="6" />
      </label>
      <div className={styles.formFooter}>
        <button type="submit" disabled={status.state === 'sending'}>
          {status.state === 'sending' ? 'Enviando...' : 'Enviar solicitud'}
        </button>
        <p className={status.state === 'error' ? styles.formError : styles.formStatus} role="status">
          {status.message}
        </p>
      </div>
    </form>
  );
}

export default function Home() {
  const audioPlayer = useRef(null);
  const [albums, setAlbums] = useState([]);
  const [releases, setReleases] = useState([]);
  const [artistName, setArtistName] = useState(SITE_CONTENT.name);
  const [heroSettings, setHeroSettings] = useState(DEFAULT_HERO_SETTINGS);
  const [socialLinks, setSocialLinks] = useState({});
  const [activeReleaseId, setActiveReleaseId] = useState('');
  const [previewByRelease, setPreviewByRelease] = useState({});
  const [isPlaying, setIsPlaying] = useState(false);
  const [isInitialDataReady, setIsInitialDataReady] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeVideoId, setActiveVideoId] = useState('');
  const [isHeroVideoReady, setIsHeroVideoReady] = useState(false);
  const [ambientPalette, setAmbientPalette] = useState({
    a: [45, 38, 31],
    b: [93, 43, 35],
    c: [48, 66, 57],
  });

  const sortedReleases = useMemo(() => sortReleasesByDateDesc(releases), [releases]);
  const activeRelease = useMemo(() => {
    if (!sortedReleases.length) return null;
    return sortedReleases.find((release) => release.id === activeReleaseId) ?? sortedReleases[0];
  }, [activeReleaseId, sortedReleases]);
  const albumById = useMemo(
    () => Object.fromEntries(albums.map((album) => [album.id, album])),
    [albums],
  );
  const activeAlbum = activeRelease ? albumById[activeRelease.albumId] : null;
  const releaseGroups = useMemo(() => {
    const groups = [];
    const byAlbum = new Map();
    sortedReleases.forEach((release) => {
      const id = release.albumId || 'sin-album';
      if (!byAlbum.has(id)) {
        const group = {
          id,
          title: albumById[id]?.title ?? 'Lanzamientos',
          year: albumById[id]?.year ?? '',
          releases: [],
        };
        byAlbum.set(id, group);
        groups.push(group);
      }
      byAlbum.get(id).releases.push(release);
    });
    return groups;
  }, [albumById, sortedReleases]);
  const videoReleases = useMemo(
    () => sortedReleases.filter((release) => getYouTubeId(release.youtube)),
    [sortedReleases],
  );
  const upcomingRelease = useMemo(
    () =>
      sortedReleases
        .filter((release) => release.isUpcoming)
        .sort((a, b) => getReleaseTimestamp(a) - getReleaseTimestamp(b))[0] ?? null,
    [sortedReleases],
  );
  const availableSocialLinks = useMemo(
    () => Object.entries(socialLinks).filter(([, url]) => Boolean(String(url ?? '').trim())),
    [socialLinks],
  );
  const heroVideoRelease = useMemo(
    () => releases.find((release) => release.id === heroSettings.releaseId) ?? null,
    [heroSettings.releaseId, releases],
  );
  const heroVideoId =
    heroSettings.mediaType === 'youtube' ? getYouTubeId(heroVideoRelease?.youtube) : '';
  const activePreviewAudio = activeRelease?.previewAudio || previewByRelease[activeRelease?.id] || '';
  const hasPreview = Boolean(activePreviewAudio);

  useEffect(() => {
    setIsHeroVideoReady(false);
  }, [heroVideoId]);

  useEffect(() => {
    let cancelled = false;
    let readyTimer;
    const loadingStartedAt = performance.now();
    const loadContent = async () => {
      try {
        const response = await fetch('/api/releases', { cache: 'no-store' });
        if (!response.ok) throw new Error('No se pudo cargar el catálogo.');
        const data = await response.json();
        if (cancelled) return;

        const nextReleases = Array.isArray(data?.releases) ? data.releases : [];
        setAlbums(Array.isArray(data?.albums) ? data.albums : []);
        setReleases(nextReleases);
        setArtistName(String(data?.settings?.artistName ?? '').trim() || SITE_CONTENT.name);
        setHeroSettings({
          mediaType: data?.settings?.hero?.mediaType === 'image' ? 'image' : 'youtube',
          releaseId: String(
            data?.settings?.hero?.releaseId ?? DEFAULT_HERO_SETTINGS.releaseId,
          ),
        });
        setSocialLinks(data?.settings?.socials ?? {});
        setActiveReleaseId(sortReleasesByDateDesc(nextReleases)[0]?.id ?? '');
      } catch {
        if (!cancelled) setReleases([]);
      } finally {
        const remainingAnimationTime = Math.max(0, 1050 - (performance.now() - loadingStartedAt));
        readyTimer = window.setTimeout(() => {
          if (!cancelled) setIsInitialDataReady(true);
        }, remainingAnimationTime);
      }
    };

    loadContent();
    return () => {
      cancelled = true;
      window.clearTimeout(readyTimer);
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 24);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!activeRelease) return;
    const player = audioPlayer.current;
    if (player) {
      player.pause();
      player.load();
    }
    setIsPlaying(false);

    let cancelled = false;
    getAmbientPaletteFromImage(activeRelease.cover || '/pausa-min.jpg').then((palette) => {
      if (!cancelled && palette) setAmbientPalette(palette);
    });
    return () => {
      cancelled = true;
    };
  }, [activeRelease]);

  useEffect(() => {
    if (!activeRelease || activeRelease.previewAudio || previewByRelease[activeRelease.id]) return;
    const spotifyLink = activeRelease.platforms?.find(
      (platform) => String(platform.title ?? '').toLowerCase().trim() === 'spotify',
    )?.link;
    if (!spotifyLink) return;

    let cancelled = false;
    fetch(`/api/spotify/preview?url=${encodeURIComponent(spotifyLink)}`, { cache: 'no-store' })
      .then((response) => response.json().then((data) => ({ ok: response.ok, data })))
      .then(({ ok, data }) => {
        if (!cancelled && ok && data?.previewUrl) {
          setPreviewByRelease((current) => ({
            ...current,
            [activeRelease.id]: String(data.previewUrl),
          }));
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [activeRelease, previewByRelease]);

  const trackClick = (channel, releaseId = activeRelease?.id) => {
    if (!releaseId) return;
    fetch('/api/track-click', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ releaseId, channel }),
    }).catch(() => {});
  };

  const toggleAudio = async () => {
    if (!hasPreview || !audioPlayer.current) return;
    if (isPlaying) {
      audioPlayer.current.pause();
      setIsPlaying(false);
      return;
    }
    try {
      await audioPlayer.current.play();
      setIsPlaying(true);
    } catch {
      setIsPlaying(false);
    }
  };

  const selectRelease = (releaseId) => {
    setActiveReleaseId(releaseId);
    window.requestAnimationFrame(() => {
      document.getElementById('lanzamiento')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const openVideo = (release) => {
    const youtubeId = getYouTubeId(release.youtube);
    if (!youtubeId) return;
    setActiveVideoId(youtubeId);
    trackClick('youtube', release.id);
    window.requestAnimationFrame(() => {
      document.getElementById('videos')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  if (!isInitialDataReady) {
    return (
      <main className={styles.loadingScreen} role="status" aria-live="polite">
        <video
          className={styles.loadingMonogram}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          poster={monogram.src}
          aria-hidden="true"
        >
          <source src="/fragmentado-loader.webm" type="video/webm" />
          <source src="/fragmentado-loader.mp4" type="video/mp4" />
        </video>
        <p>Fragmentado...</p>
      </main>
    );
  }

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'MusicGroup',
    name: artistName,
    url: 'https://fragmentado.com',
    genre: 'Música regional mexicana',
    foundingLocation: { '@type': 'Place', name: 'Sierra Mixe, Oaxaca, México' },
    sameAs: availableSocialLinks.map(([, url]) => url),
    album: albums.map((album) => ({
      '@type': 'MusicAlbum',
      name: album.title,
      datePublished: album.year,
    })),
  };

  return (
    <div
      className={styles.page}
      style={{
        '--ambient-a': rgbToString(ambientPalette.a),
        '--ambient-b': rgbToString(ambientPalette.b),
        '--ambient-c': rgbToString(ambientPalette.c),
      }}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, '\\u003c') }}
      />

      <header className={`${styles.siteHeader} ${isScrolled ? styles.siteHeaderScrolled : ''}`}>
        <a className={styles.wordmark} href="#inicio" onClick={() => setIsMenuOpen(false)}>
          {artistName}
        </a>
        <button
          type="button"
          className={styles.menuButton}
          aria-expanded={isMenuOpen}
          aria-controls="site-navigation"
          aria-label={isMenuOpen ? 'Cerrar navegación' : 'Abrir navegación'}
          onClick={() => setIsMenuOpen((current) => !current)}
        >
          <span />
          <span />
        </button>
        <nav id="site-navigation" className={`${styles.navigation} ${isMenuOpen ? styles.navigationOpen : ''}`}>
          {SITE_CONTENT.nav.map((item) => (
            <a key={item.href} href={item.href} onClick={() => setIsMenuOpen(false)}>{item.label}</a>
          ))}
        </nav>
      </header>

      <main>
        <section className={styles.hero} id="inicio">
          <Image
            className={styles.heroImage}
            src="/pausa-min.jpg"
            alt="Integrantes de Fragmentado en el arte audiovisual de Pausa al Amor"
            fill
            priority
            sizes="100vw"
          />
          {heroVideoId ? (
            <div className={styles.heroVideoFrame} aria-hidden="true">
              <iframe
                className={`${styles.heroVideo} ${isHeroVideoReady ? styles.heroVideoReady : ''}`}
                src={`https://www.youtube-nocookie.com/embed/${heroVideoId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${heroVideoId}&playsinline=1&rel=0&iv_load_policy=3&disablekb=1&fs=0`}
                title={`Video de fondo: ${heroVideoRelease?.title ?? 'Fragmentado'}`}
                allow="autoplay; encrypted-media"
                referrerPolicy="strict-origin-when-cross-origin"
                tabIndex="-1"
                onLoad={() => setIsHeroVideoReady(true)}
              />
            </div>
          ) : null}
          <div className={styles.heroShade} />
          <div className={styles.heroContent}>
            <h1>{artistName}</h1>
            <div className={styles.heroActions}>
              <a className={styles.primaryButton} href="#musica">Escuchar música</a>
              <a className={styles.secondaryButton} href="#videos">Ver videos</a>
              <a className={styles.secondaryButton} href="#contrataciones">Contrataciones</a>
            </div>
            {availableSocialLinks.length ? (
              <div className={styles.heroSocialLinks} aria-label="Redes sociales de Fragmentado">
                <span>Síguenos</span>
                {availableSocialLinks.map(([network, url]) => (
                  <a
                    key={network}
                    href={url}
                    onClick={() => trackClick(`social:${network}`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={SOCIAL_LABEL_MAP[network] ?? network}
                    title={SOCIAL_LABEL_MAP[network] ?? network}
                  >
                    {SOCIAL_ICON_MAP[network] ? (
                      <FontAwesomeIcon icon={SOCIAL_ICON_MAP[network]} aria-hidden="true" />
                    ) : (
                      <span aria-hidden="true">{network.slice(0, 2)}</span>
                    )}
                  </a>
                ))}
              </div>
            ) : null}
            {upcomingRelease ? (
              <button
                type="button"
                className={styles.heroAnnouncement}
                onClick={() => selectRelease(upcomingRelease.id)}
              >
                Próximo lanzamiento · {upcomingRelease.title} · {formatReleaseDate(upcomingRelease.releaseDate)}
              </button>
            ) : null}
          </div>
          <p className={styles.heroCredit}>
            {heroVideoId
              ? `Video oficial · ${heroVideoRelease?.title ?? 'Fragmentado'}`
              : 'Arte audiovisual · Pausa al Amor'}
          </p>
          <a className={styles.scrollCue} href="#presentacion" aria-label="Continuar al contenido">
            <span />
          </a>
        </section>

        <section className={styles.introduction} id="presentacion">
          <p className={styles.sectionNumber}>01</p>
          <div>
            <p className={styles.eyebrow}>El proyecto</p>
            <h2>Historias propias.<br />Raíz oaxaqueña.<br />Una mirada actual.</h2>
          </div>
          <p className={styles.introCopy}>{SITE_CONTENT.introduction}</p>
        </section>

        {activeRelease ? (
          <section className={styles.featuredSection} id="lanzamiento">
            <div className={styles.sectionHeading}>
              <div>
                <p className={styles.eyebrow}>Lanzamiento destacado</p>
                <h2>Escucha Fragmentado</h2>
              </div>
              <p>{sortedReleases.length} lanzamientos disponibles</p>
            </div>

            <div className={styles.featuredRelease}>
              <div className={styles.featuredArtwork}>
                <Image
                  src={activeRelease.cover}
                  alt={`Portada de ${activeRelease.title}`}
                  width={720}
                  height={720}
                  priority
                  sizes="(max-width: 800px) 100vw, 50vw"
                />
                <button
                  type="button"
                  className={styles.audioButton}
                  onClick={toggleAudio}
                  disabled={!hasPreview}
                  aria-label={hasPreview ? (isPlaying ? 'Pausar preview' : 'Reproducir preview') : 'Preview no disponible'}
                >
                  <FontAwesomeIcon icon={isPlaying ? faCirclePause : faPlayCircle} />
                </button>
              </div>

              <div className={styles.featuredInfo}>
                <div className={styles.releaseMeta}>
                  <span>{activeRelease.badge}</span>
                  <span>{activeAlbum?.title ?? 'Lanzamiento'}</span>
                  <span>{formatReleaseDate(activeRelease.releaseDate)}</span>
                </div>
                <h3>{activeRelease.title}</h3>
                <p>
                  Canción de {artistName}, disponible en plataformas digitales
                  {activeRelease.youtube ? ' y con video oficial' : ''}.
                </p>
                <audio ref={audioPlayer} src={activePreviewAudio || undefined} preload="none" />
                {!hasPreview ? <p className={styles.previewNote}>Preview de audio no disponible para este lanzamiento.</p> : null}

                <div className={styles.platformActions} aria-label="Plataformas disponibles">
                  {(activeRelease.platforms ?? []).map((platform) => (
                    <a
                      key={`${activeRelease.id}-${platform.title}`}
                      href={withTrackingParams(platform.link, activeRelease.id, `platform_${platform.title}`)}
                      onClick={() => trackClick(`platform:${platform.title}`)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Image src={platform.icon} alt="" width={96} height={28} />
                      <span>{platform.title}</span>
                    </a>
                  ))}
                </div>

                {activeRelease.youtube ? (
                  <button type="button" className={styles.videoLinkButton} onClick={() => openVideo(activeRelease)}>
                    Ver video oficial
                  </button>
                ) : null}
              </div>
            </div>
          </section>
        ) : null}

        <section className={styles.catalogSection} id="musica">
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.eyebrow}>Discografía</p>
              <h2>Canciones y álbumes</h2>
            </div>
            <p>Selecciona una canción para explorarla</p>
          </div>

          {releaseGroups.length ? releaseGroups.map((group) => (
            <div className={styles.albumGroup} key={group.id}>
              <div className={styles.albumHeading}>
                <h3>{group.title}</h3>
                <p>{group.year} · {group.releases.length} {group.releases.length === 1 ? 'canción' : 'canciones'}</p>
              </div>
              <div className={styles.releaseGrid}>
                {group.releases.map((release) => (
                  <button
                    type="button"
                    key={release.id}
                    className={`${styles.releaseCard} ${release.id === activeRelease?.id ? styles.releaseCardActive : ''}`}
                    onClick={() => selectRelease(release.id)}
                    aria-label={`Ver detalles de ${release.title}`}
                  >
                    <span className={styles.releaseArtwork}>
                      <Image
                        src={release.cover}
                        alt=""
                        fill
                        sizes="(max-width: 640px) 50vw, (max-width: 1000px) 33vw, 25vw"
                      />
                    </span>
                    <span className={styles.releaseCardCopy}>
                      <strong>{release.title}</strong>
                      <small>{release.year || formatReleaseDate(release.releaseDate)}</small>
                    </span>
                    <span className={styles.releaseArrow} aria-hidden="true">↗</span>
                  </button>
                ))}
              </div>
            </div>
          )) : (
            <p className={styles.emptyState}>El catálogo no está disponible en este momento.</p>
          )}
        </section>

        <section className={styles.videoSection} id="videos">
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.eyebrow}>Audiovisual</p>
              <h2>Videos oficiales</h2>
            </div>
            <p>Producción visual de cada lanzamiento</p>
          </div>

          {activeVideoId ? (
            <div className={styles.videoPlayer}>
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${activeVideoId}?autoplay=1`}
                title="Video de Fragmentado"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
              <button type="button" onClick={() => setActiveVideoId('')}>Cerrar video</button>
            </div>
          ) : null}

          <div className={styles.videoGrid}>
            {videoReleases.slice(0, 6).map((release) => {
              const youtubeId = getYouTubeId(release.youtube);
              return (
                <button type="button" key={release.id} onClick={() => openVideo(release)}>
                  <span className={styles.videoThumbnail}>
                    <Image
                      src={`https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`}
                      alt=""
                      fill
                      loading="lazy"
                      sizes="(max-width: 760px) 100vw, 33vw"
                    />
                    <i aria-hidden="true">▶</i>
                  </span>
                  <strong>{release.title}</strong>
                  <small>Video oficial</small>
                </button>
              );
            })}
          </div>
        </section>

        <section className={styles.historySection} id="historia">
          <div className={styles.historyImage}>
            <Image
              src="/DondeEmpieza.jpg"
              alt="Arte del lanzamiento Donde Empieza y Termina de Fragmentado"
              fill
              loading="lazy"
              sizes="(max-width: 800px) 100vw, 48vw"
            />
          </div>
          <div className={styles.historyCopy}>
            <p className={styles.eyebrow}>Historia</p>
            <h2>Desde Oaxaca, con historias que piden escenario.</h2>
            {SITE_CONTENT.history.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            <p className={styles.productionCredit}>{SITE_CONTENT.productionCredit}</p>
          </div>
        </section>

        <section className={styles.liveSection} id="en-vivo">
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.eyebrow}>En vivo</p>
              <h2>Una propuesta adaptable a cada escenario</h2>
            </div>
            <a className={styles.primaryButton} href="#contrataciones">Solicitar información</a>
          </div>
          <div className={styles.liveLayout}>
            <ul>
              {SITE_CONTENT.liveHighlights.map((highlight) => <li key={highlight}>{highlight}</li>)}
            </ul>
            <div className={styles.visualArchive}>
              {SITE_CONTENT.visualArchive.map((item) => (
                <figure key={item.src}>
                  <Image src={item.src} alt="" fill loading="lazy" sizes="(max-width: 760px) 33vw, 20vw" />
                  <figcaption>{item.label}</figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>

        <section className={styles.pressSection} id="prensa">
          <div className={styles.pressIntro}>
            <p className={styles.eyebrow}>Festivales y promotores</p>
            <h2>{SITE_CONTENT.promoterTitle}</h2>
            <p>{SITE_CONTENT.promoterCopy}</p>
            <a className={styles.secondaryButton} href="#videos">Ver videos</a>
          </div>
          <div className={styles.quickFacts}>
            <h3>Press kit · datos rápidos</h3>
            <dl>
              {SITE_CONTENT.quickFacts.map(([label, value]) => (
                <div key={label}><dt>{label}</dt><dd>{value}</dd></div>
              ))}
              <div><dt>Lanzamientos publicados</dt><dd>{sortedReleases.length}</dd></div>
            </dl>
          </div>
        </section>

        <section className={styles.contactSection} id="contrataciones">
          <div className={styles.contactIntro}>
            <p className={styles.eyebrow}>Contrataciones</p>
            <h2>{SITE_CONTENT.bookingTitle}</h2>
            <p>{SITE_CONTENT.bookingCopy}</p>
            {availableSocialLinks.length ? (
              <div className={styles.socialLinks} aria-label="Redes sociales">
                {availableSocialLinks.map(([network, url]) => (
                  <a
                    key={network}
                    href={url}
                    onClick={() => trackClick(`social:${network}`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={SOCIAL_LABEL_MAP[network] ?? network}
                    title={SOCIAL_LABEL_MAP[network] ?? network}
                  >
                    {SOCIAL_ICON_MAP[network] ? (
                      <FontAwesomeIcon icon={SOCIAL_ICON_MAP[network]} aria-hidden="true" />
                    ) : (
                      <span aria-hidden="true">{network.slice(0, 2)}</span>
                    )}
                  </a>
                ))}
              </div>
            ) : null}
          </div>
          <ContactForm />
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerBrand}>
          <Image className={styles.footerMonogram} src={monogram} alt="" aria-hidden="true" />
          <div>
            <strong>{artistName}</strong>
            <p>{SITE_CONTENT.slogan}</p>
          </div>
        </div>
        <nav aria-label="Navegación del pie de página">
          {SITE_CONTENT.nav.map((item) => <a key={item.href} href={item.href}>{item.label}</a>)}
        </nav>
        <div className={styles.footerLegal}>
          <p>© {new Date().getFullYear()} Fragmentado. Derechos reservados.</p>
          <a href="https://www.yootsmusic.com" target="_blank" rel="noopener noreferrer">Producción · Yoots Music</a>
        </div>
      </footer>
    </div>
  );
}
