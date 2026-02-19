'use client';

import Image from 'next/image';
import styles from './page.module.css';
import { useEffect, useMemo, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlayCircle } from '@fortawesome/free-regular-svg-icons';
import { faCirclePause } from '@fortawesome/free-solid-svg-icons';

const getReleaseTimestamp = (release) => {
  const raw = String(release?.releaseDate ?? '').trim();
  if (!raw) return 0;
  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime())) return parsed.getTime();
  return 0;
};

const sortReleasesByDateDesc = (list) =>
  [...list].sort((a, b) => getReleaseTimestamp(b) - getReleaseTimestamp(a));

const DARK_BASE = [16, 18, 21];

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
      if (!context) {
        resolve(null);
        return;
      }

      const size = 26;
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

      for (let i = 0; i < data.length; i += 4) {
        const alpha = data[i + 3];
        if (alpha < 24) continue;

        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        rSum += r;
        gSum += g;
        bSum += b;
        count += 1;

        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const saturation = max === 0 ? 0 : (max - min) / max;
        const brightness = (r + g + b) / 765;
        const score = saturation * 0.75 + brightness * 0.25;

        if (score > bestScore) {
          bestScore = score;
          vibrant = [r, g, b];
        }
      }

      if (!count) {
        resolve(null);
        return;
      }

      const average = [rSum / count, gSum / count, bSum / count].map(clampColor);
      const accent = mixColor(average, vibrant, 0.48);

      resolve({
        a: mixColor(average, DARK_BASE, 0.64),
        b: mixColor(vibrant, DARK_BASE, 0.58),
        c: mixColor(accent, DARK_BASE, 0.7),
      });
    };

    image.onerror = () => resolve(null);
  });

const withTrackingParams = (url, releaseId, content) => {
  if (!url) return '';

  try {
    const parsedUrl = new URL(url);
    parsedUrl.searchParams.set('utm_source', 'fragmentado_site');
    parsedUrl.searchParams.set('utm_medium', 'release_page');
    parsedUrl.searchParams.set('utm_campaign', releaseId);
    parsedUrl.searchParams.set('utm_content', content);
    return parsedUrl.toString();
  } catch {
    return url;
  }
};

const formatReleaseDate = (value) => {
  if (!value) return '';

  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime()) && value.includes('-')) {
    return new Intl.DateTimeFormat('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(parsed);
  }

  return value;
};

const SOCIAL_ICON_MAP = {
  facebook: (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M13.5 21v-8.1h2.8l.4-3.2h-3.2V7.6c0-.9.3-1.6 1.7-1.6h1.8V3.1c-.3 0-1.4-.1-2.7-.1-2.7 0-4.5 1.6-4.5 4.6v2.1H7v3.2h2.8V21h3.7z" />
    </svg>
  ),
  instagram: (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M12 7.3A4.7 4.7 0 1 0 12 16.7 4.7 4.7 0 0 0 12 7.3zm0 7.7A3 3 0 1 1 12 9a3 3 0 0 1 0 6zm6-7.9a1.1 1.1 0 1 1-2.2 0 1.1 1.1 0 0 1 2.2 0zM12 2.8c2.9 0 3.2 0 4.4.1 1.1.1 1.8.2 2.2.4.5.2.9.4 1.3.8s.6.8.8 1.3c.2.4.3 1.1.4 2.2.1 1.2.1 1.5.1 4.4s0 3.2-.1 4.4c-.1 1.1-.2 1.8-.4 2.2a3.6 3.6 0 0 1-2.1 2.1c-.4.2-1.1.3-2.2.4-1.2.1-1.5.1-4.4.1s-3.2 0-4.4-.1c-1.1-.1-1.8-.2-2.2-.4a3.6 3.6 0 0 1-2.1-2.1c-.2-.4-.3-1.1-.4-2.2-.1-1.2-.1-1.5-.1-4.4s0-3.2.1-4.4c.1-1.1.2-1.8.4-2.2.2-.5.4-.9.8-1.3s.8-.6 1.3-.8c.4-.2 1.1-.3 2.2-.4 1.2-.1 1.5-.1 4.4-.1zm0-1.8c-2.9 0-3.3 0-4.5.1-1.2.1-2 .2-2.7.5a5.3 5.3 0 0 0-1.9 1.2A5.3 5.3 0 0 0 1.6 4.7c-.3.7-.4 1.5-.5 2.7C1 8.7 1 9.1 1 12s0 3.3.1 4.5c.1 1.2.2 2 .5 2.7.3.7.7 1.4 1.2 1.9s1.2.9 1.9 1.2c.7.3 1.5.4 2.7.5 1.2.1 1.6.1 4.5.1s3.3 0 4.5-.1c1.2-.1 2-.2 2.7-.5.7-.3 1.4-.7 1.9-1.2s.9-1.2 1.2-1.9c.3-.7.4-1.5.5-2.7.1-1.2.1-1.6.1-4.5s0-3.3-.1-4.5c-.1-1.2-.2-2-.5-2.7a5.3 5.3 0 0 0-1.2-1.9 5.3 5.3 0 0 0-1.9-1.2c-.7-.3-1.5-.4-2.7-.5C15.3 1 14.9 1 12 1z" />
    </svg>
  ),
  youtube: (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31.7 31.7 0 0 0 0 12a31.7 31.7 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1A31.7 31.7 0 0 0 24 12a31.7 31.7 0 0 0-.5-5.8zM9.7 15.6V8.4L16 12l-6.3 3.6z" />
    </svg>
  ),
  tiktok: (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M17.8 5.1a4.9 4.9 0 0 0 2.9 1v3a8 8 0 0 1-2.9-.6v6.4a6 6 0 1 1-5.2-6v3.1a3 3 0 1 0 2.1 2.9V1.9h3.1v3.2z" />
    </svg>
  ),
};

export default function Home() {
  const audioPlayer = useRef(null);
  const [albums, setAlbums] = useState([]);
  const [releases, setReleases] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [previewByRelease, setPreviewByRelease] = useState({});
  const [activeReleaseId, setActiveReleaseId] = useState('');
  const [ambientPalette, setAmbientPalette] = useState({
    a: [50, 56, 66],
    b: [64, 54, 48],
    c: [44, 50, 60],
  });
  const [isHeroLoading, setIsHeroLoading] = useState(true);
  const [isInitialDataReady, setIsInitialDataReady] = useState(false);
  const [isInitialCoverReady, setIsInitialCoverReady] = useState(false);
  const [socialLinks, setSocialLinks] = useState({
    facebook: '',
    instagram: '',
    youtube: '',
    tiktok: '',
  });

  const sortedReleases = useMemo(() => sortReleasesByDateDesc(releases), [releases]);
  const activeRelease = useMemo(() => {
    if (!sortedReleases.length) return null;
    return (
      sortedReleases.find((release) => release.id === activeReleaseId) ??
      sortedReleases[0]
    );
  }, [activeReleaseId, sortedReleases]);
  const activeAlbumTitle = useMemo(() => {
    if (!activeRelease) return '';
    return albums.find((album) => album.id === activeRelease.albumId)?.title ?? 'Relatando Historias';
  }, [activeRelease, albums]);
  const releaseAlbumById = useMemo(
    () => Object.fromEntries(albums.map((album) => [album.id, album.title])),
    [albums],
  );
  const releasesForIndex = sortedReleases;
  const activePreviewAudio =
    activeRelease?.previewAudio ||
    previewByRelease[activeRelease?.id ?? ''] ||
    '';
  const hasPreview = Boolean(activePreviewAudio);
  const upcomingRelease = useMemo(() => {
    const list = releases.filter((release) => release.isUpcoming);
    if (!list.length) return null;
    return [...list].sort((a, b) => String(a.releaseDate).localeCompare(String(b.releaseDate)))[0];
  }, [releases]);
  const availableSocialLinks = useMemo(
    () =>
      Object.entries(socialLinks).filter(([, url]) => Boolean(String(url ?? '').trim())),
    [socialLinks],
  );

  useEffect(() => {
    let cancelled = false;

    const loadReleases = async () => {
      try {
        const response = await fetch('/api/releases', { cache: 'no-store' });
        if (!response.ok) return;
        const data = await response.json();
        if (cancelled) return;

        setSocialLinks({
          facebook: String(data?.settings?.socials?.facebook ?? ''),
          instagram: String(data?.settings?.socials?.instagram ?? ''),
          youtube: String(data?.settings?.socials?.youtube ?? ''),
          tiktok: String(data?.settings?.socials?.tiktok ?? ''),
        });

        if (Array.isArray(data?.albums) && data.albums.length) {
          setAlbums(data.albums);
        }
        if (Array.isArray(data?.releases) && data.releases.length) {
          setReleases(data.releases);
          setActiveReleaseId((currentId) => {
            if (data.releases.some((release) => release.id === currentId)) return currentId;
            const latestByDate = sortReleasesByDateDesc(data.releases)[0] ?? data.releases[0];
            return latestByDate.id;
          });
        }
      } catch {
        // Keep empty state if API is unavailable.
      } finally {
        if (!cancelled) setIsInitialDataReady(true);
      }
    };

    loadReleases();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isHeroLoading) return;
    setIsInitialCoverReady(false);
  }, [activeRelease?.id, isHeroLoading]);

  useEffect(() => {
    if (!isHeroLoading) return;
    if (!isInitialDataReady || !isInitialCoverReady) return;
    const timeoutId = window.setTimeout(() => {
      setIsHeroLoading(false);
    }, 180);
    return () => window.clearTimeout(timeoutId);
  }, [isHeroLoading, isInitialDataReady, isInitialCoverReady]);

  useEffect(() => {
    if (!isHeroLoading) return;
    const timeoutId = window.setTimeout(() => {
      setIsHeroLoading(false);
    }, 3500);
    return () => window.clearTimeout(timeoutId);
  }, [isHeroLoading]);

  useEffect(() => {
    if (!activeRelease) return;
    const player = audioPlayer.current;
    if (!player) return;

    player.pause();
    player.load();
    setIsPlaying(false);
  }, [activeRelease]);

  useEffect(() => {
    if (!activeRelease) return;
    let cancelled = false;

    const applyPalette = async () => {
      const palette = await getAmbientPaletteFromImage(activeRelease.cover || '/pausa-min.jpg');
      if (!cancelled && palette) {
        setAmbientPalette(palette);
      }
    };

    applyPalette();

    return () => {
      cancelled = true;
    };
  }, [activeRelease]);

  useEffect(() => {
    if (!activeRelease) return;
    if (activeRelease.previewAudio) return;
    if (previewByRelease[activeRelease.id]) return;

    const spotifyLink =
      activeRelease.platforms?.find(
        (platform) => String(platform.title ?? '').toLowerCase().trim() === 'spotify',
      )?.link ?? '';
    if (!spotifyLink) return;

    let cancelled = false;
    const loadPreview = async () => {
      try {
        const response = await fetch(
          `/api/spotify/preview?url=${encodeURIComponent(spotifyLink)}`,
          { cache: 'no-store' },
        );
        const data = await response.json();
        if (!response.ok) return;
        if (!cancelled && data?.previewUrl) {
          setPreviewByRelease((prev) => ({
            ...prev,
            [activeRelease.id]: String(data.previewUrl),
          }));
        }
      } catch {
        // ignore preview fetch failures
      }
    };

    loadPreview();
    return () => {
      cancelled = true;
    };
  }, [activeRelease, previewByRelease]);

  const trackClick = (channel) => {
    if (!activeRelease) return;
    fetch('/api/track-click', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ releaseId: activeRelease.id, channel }),
    }).catch(() => {
      // Ignore tracking failures to avoid blocking UX.
    });
  };

  const toggleAudio = async () => {
    if (!activeRelease || !hasPreview) return;

    const player = audioPlayer.current;
    if (!player) return;

    if (isPlaying) {
      player.pause();
      setIsPlaying(false);
      return;
    }

    try {
      await player.play();
      setIsPlaying(true);
    } catch (error) {
      console.error('No se pudo reproducir el audio:', error);
    }
  };

  if (!isInitialDataReady) {
    return (
      <main className={styles.main}>
        <div className={styles.heroLoaderOverlay} role="status" aria-live="polite">
          <div className={styles.heroLoaderCard}>
            <span className={styles.heroLoaderDot} />
            <p>Cargando lanzamiento...</p>
          </div>
        </div>
        <footer className={styles.footer}>
          <a href="http://www.yootsmusic.com" target="_blank" rel="noopener noreferrer">
            created by Yoots Music®
          </a>
        </footer>
      </main>
    );
  }

  if (!activeRelease) {
    return (
      <main className={styles.main}>
        <section className={styles.emptyStateCard}>
          <h1>Sin lanzamientos disponibles</h1>
          <p>Este artista aun no tiene lanzamientos disponibles. Vuelve pronto.</p>
        </section>
        <footer className={styles.footer}>
          <a href="http://www.yootsmusic.com" target="_blank" rel="noopener noreferrer">
            created by Yoots Music®
          </a>
        </footer>
      </main>
    );
  }

  return (
    <div
      className={styles.main}
      style={{
        '--ambient-a': rgbToString(ambientPalette.a),
        '--ambient-b': rgbToString(ambientPalette.b),
        '--ambient-c': rgbToString(ambientPalette.c),
      }}
    >
      {isHeroLoading ? (
        <div className={styles.heroLoaderOverlay} role="status" aria-live="polite">
          <div className={styles.heroLoaderCard}>
            <span className={styles.heroLoaderDot} />
            <p>Cargando lanzamiento...</p>
          </div>
        </div>
      ) : null}
      <main className={styles.hero}>
        <section className={styles.center}>
          <p className={styles.heroEyebrow}>Relatando Historias</p>
          <h1 className={styles.releaseTitle}>{activeRelease.title}</h1>
          <div className={styles.heroPills}>
            <span className={styles.heroPill}>{activeRelease.badge}</span>
            <span className={styles.heroPill}>{activeAlbumTitle}</span>
            <span className={styles.heroPill}>{formatReleaseDate(activeRelease.releaseDate)}</span>
          </div>

          <audio
            id="audio-player"
            src={activePreviewAudio || undefined}
            loop
            ref={audioPlayer}
          />

          <div className={styles.coverContainer}>
            <button
              type="button"
              className={`${styles.playButton} ${!hasPreview ? styles.playButtonDisabled : ''}`}
              onClick={toggleAudio}
              aria-label={
                hasPreview
                  ? isPlaying
                    ? 'Pausar audio'
                    : 'Reproducir audio'
                  : 'Preview no disponible'
              }
              disabled={!hasPreview}
            >
              <FontAwesomeIcon
                icon={isPlaying ? faCirclePause : faPlayCircle}
                className={styles.play_icon}
              />
            </button>
            <Image
              className={styles.cover}
              src={activeRelease.cover}
              alt={activeRelease.title}
              width={420}
              height={420}
              priority
              onLoadingComplete={() => {
                if (isHeroLoading) setIsInitialCoverReady(true);
              }}
              onError={() => {
                if (isHeroLoading) setIsInitialCoverReady(true);
              }}
            />
          </div>

          <p className={styles.artistName}>{activeRelease.artist}</p>
          <div className={styles.releaseMetaRow}>
            <p className={styles.albumTitle}>{activeAlbumTitle}</p>
            <p className={styles.releaseDate}>{formatReleaseDate(activeRelease.releaseDate)}</p>
          </div>
          <p className={styles.kicker}>{activeRelease.badge}</p>
          {availableSocialLinks.length ? (
            <div className={styles.socialRow} aria-label="Redes sociales">
              {availableSocialLinks.map(([network, url]) => (
                <a
                  key={network}
                  href={url}
                  onClick={() => trackClick(`social:${network}`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.socialIconLink}
                  aria-label={network}
                >
                  {SOCIAL_ICON_MAP[network]}
                </a>
              ))}
            </div>
          ) : null}
          {upcomingRelease && upcomingRelease.id !== activeRelease.id ? (
            <button
              type="button"
              className={styles.upcomingCallout}
              onClick={() => setActiveReleaseId(upcomingRelease.id)}
            >
              Proximo: {upcomingRelease.title} - {formatReleaseDate(upcomingRelease.releaseDate)}
            </button>
          ) : null}

          {activeRelease.youtube ? (
            <a
              className={styles.videoButton}
              href={withTrackingParams(activeRelease.youtube, activeRelease.id, 'youtube')}
              onClick={() => trackClick('youtube')}
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className={styles.videoButtonIcon} aria-hidden="true">
                <svg viewBox="0 0 24 24" role="presentation" focusable="false">
                  <path d="M23.5 6.2a3.04 3.04 0 0 0-2.14-2.15C19.45 3.5 12 3.5 12 3.5s-7.45 0-9.36.55A3.04 3.04 0 0 0 .5 6.2 31.4 31.4 0 0 0 0 12a31.4 31.4 0 0 0 .5 5.8 3.04 3.04 0 0 0 2.14 2.15C4.55 20.5 12 20.5 12 20.5s7.45 0 9.36-.55a3.04 3.04 0 0 0 2.14-2.15A31.4 31.4 0 0 0 24 12a31.4 31.4 0 0 0-.5-5.8zM9.75 15.55V8.45L16 12l-6.25 3.55z" />
                </svg>
              </span>
              <span className={styles.videoButtonText}>Ver video en YouTube</span>
            </a>
          ) : (
            <div className={styles.videoButtonDisabled}>Video no disponible</div>
          )}

          <div className={styles.platformList}>
            {activeRelease.platforms.length ? (
              activeRelease.platforms.map((platform, index) => (
                <a
                  className={styles.streamingLinkWrap}
                  key={platform.title}
                  href={withTrackingParams(
                    platform.link,
                    activeRelease.id,
                    `platform_${platform.title.replace(/\s+/g, '_')}`,
                  )}
                  onClick={() => trackClick(`platform:${platform.title}`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ '--stagger': `${index * 70}ms` }}
                >
                  <div className={styles.platformBrand}>
                    <span className={styles.platformLogoWrap}>
                      <Image
                        className={styles.platformLogo}
                        src={platform.icon}
                        height={32}
                        width={96}
                        alt={platform.title}
                      />
                    </span>
                    <span className={styles.platformTitle}>{platform.title}</span>
                  </div>
                  <span className={styles.streamingLink}>Escuchar</span>
                </a>
              ))
            ) : (
              <div className={styles.emptyPlatforms}>
                Links de streaming en actualización para este lanzamiento.
              </div>
            )}
          </div>

        </section>

        <section className={styles.releasePicker} aria-label="Lanzamientos disponibles">
          <div className={styles.releasePickerHead}>
            <p>Indice de lanzamientos</p>
            <span>{releases.length} canciones</span>
          </div>
          {releasesForIndex.map((release) => (
            <button
              key={release.id}
              type="button"
              className={`${styles.releaseChip} ${
                release.id === activeRelease.id ? styles.releaseChipActive : ''
              }`}
              onClick={() => setActiveReleaseId(release.id)}
            >
              <Image src={release.cover} alt={release.title} width={54} height={54} />
              <span className={styles.releaseChipText}>
                <strong>{release.title}</strong>
                <small>{releaseAlbumById[release.albumId] ?? 'Lanzamiento'}</small>
              </span>
              <span className={styles.releaseChipMeta}>
                <em>{formatReleaseDate(release.releaseDate)}</em>
                <i>{release.badge}</i>
              </span>
            </button>
          ))}
        </section>
      </main>

      <footer className={styles.footer}>
        <a href="http://www.yootsmusic.com" target="_blank" rel="noopener noreferrer">
          created by Yoots Music®
        </a>
      </footer>
    </div>
  );
}
