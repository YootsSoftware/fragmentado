'use client';

import Image from 'next/image';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faGear,
  faKey,
  faMagnifyingGlass,
  faPenToSquare,
  faRightFromBracket,
  faUserShield,
} from '@fortawesome/free-solid-svg-icons';
import styles from './page.module.css';

const emptyRelease = {
  id: '',
  albumId: 'relatando-historias',
  title: '',
  artist: '',
  year: '',
  releaseDate: '',
  cover: '',
  previewAudio: '',
  youtube: '',
  platforms: [],
};

const PLATFORM_PRESETS = [
  {
    id: 'spotify',
    title: 'spotify',
    icon: '/plataformas/Spotify_Logo_RGB_Green.png',
  },
  {
    id: 'apple-music',
    title: 'apple music',
    icon: '/plataformas/Apple-Music-logo1.png',
  },
  {
    id: 'amazon-music',
    title: 'amazon music',
    icon: '/plataformas/Amazon_Music_White.png',
  },
  {
    id: 'deezer',
    title: 'deezer',
    icon: '/plataformas/deezer-logo_brandlogos.net_kzlnq-white.png',
  },
];

const normalizeName = (value) =>
  String(value ?? '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-');

const slugify = (value) =>
  String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

const normalizeSearchText = (value) =>
  String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

const ensureUniqueId = (baseId, existingIds, currentId = '') => {
  if (!baseId) return '';
  if (!existingIds.has(baseId) || baseId === currentId) return baseId;

  let attempt = 2;
  let candidate = `${baseId}-${attempt}`;
  while (existingIds.has(candidate) && candidate !== currentId) {
    attempt += 1;
    candidate = `${baseId}-${attempt}`;
  }
  return candidate;
};

const normalizeSpotifyReleaseDate = (value) => {
  const raw = String(value ?? '').trim();
  if (!raw) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  if (/^\d{4}-\d{2}$/.test(raw)) return `${raw}-01`;
  if (/^\d{4}$/.test(raw)) return `${raw}-01-01`;
  return '';
};

const normalizeDateComparable = (value) => {
  const raw = String(value ?? '').trim();
  if (!raw) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toISOString().slice(0, 10);
};

const getDateTimestamp = (value) => {
  const normalized = normalizeDateComparable(value);
  if (!normalized) return 0;
  const parsed = new Date(`${normalized}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime();
};

const currentYear = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 16 }, (_, index) =>
  String(currentYear - 10 + index),
);

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
);

const chartTextColor = '#c8d2df';
const chartGridColor = 'rgba(122, 139, 162, 0.22)';
const channelPalette = [
  'rgba(124, 174, 232, 0.8)',
  'rgba(111, 211, 178, 0.8)',
  'rgba(229, 146, 190, 0.8)',
  'rgba(243, 190, 112, 0.8)',
  'rgba(156, 168, 255, 0.8)',
  'rgba(255, 130, 130, 0.8)',
];

const barChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  indexAxis: 'y',
  plugins: {
    legend: {
      display: false,
    },
    tooltip: {
      intersect: false,
      mode: 'index',
    },
  },
  scales: {
    x: {
      beginAtZero: true,
      ticks: { color: chartTextColor, precision: 0 },
      grid: { color: chartGridColor },
    },
    y: {
      ticks: { color: chartTextColor },
      grid: { display: false },
    },
  },
};

const doughnutChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: '64%',
  plugins: {
    legend: {
      position: 'bottom',
      labels: {
        color: chartTextColor,
        boxWidth: 12,
        boxHeight: 12,
        padding: 10,
      },
    },
  },
};

const dashboardBarOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false,
    },
  },
  scales: {
    x: {
      ticks: { color: chartTextColor },
      grid: { display: false },
    },
    y: {
      beginAtZero: true,
      ticks: { color: chartTextColor, precision: 0 },
      grid: { color: chartGridColor },
    },
  },
};

export default function AdminPage() {
  const [session, setSession] = useState({
    loading: true,
    bootstrapped: false,
    authenticated: false,
  });
  const [credentials, setCredentials] = useState({
    username: '',
    password: '',
  });
  const [authError, setAuthError] = useState('');

  const [albums, setAlbums] = useState([]);
  const [selectedAlbumId, setSelectedAlbumId] = useState('');
  const [expandedAlbums, setExpandedAlbums] = useState({});
  const [albumDraft, setAlbumDraft] = useState({
    title: '',
    year: String(currentYear),
  });
  const [showAlbumModal, setShowAlbumModal] = useState(false);
  const [albumModalMode, setAlbumModalMode] = useState('create');
  const [editingAlbumId, setEditingAlbumId] = useState('');

  const [releases, setReleases] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [draft, setDraft] = useState(emptyRelease);
  const [isNew, setIsNew] = useState(true);
  const [isManualNew, setIsManualNew] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [message, setMessage] = useState('');
  const [uploadingCover, setUploadingCover] = useState(false);
  const [resolvingSpotifyPreview, setResolvingSpotifyPreview] = useState(false);
  const [previewFetchStatus, setPreviewFetchStatus] = useState('idle');
  const [previewFetchMessage, setPreviewFetchMessage] = useState('');
  const [manualMode, setManualMode] = useState(false);
  const [bulkSelectMode, setBulkSelectMode] = useState(false);
  const [bulkDeleteByAlbum, setBulkDeleteByAlbum] = useState({});
  const [stats, setStats] = useState({});
  const [activeSection, setActiveSection] = useState('dashboard');
  const [settingsDraft, setSettingsDraft] = useState({
    artistName: 'FRAGMENTADO',
  });
  const [spotifyEnv, setSpotifyEnv] = useState({
    configured: false,
    artistId: '',
    market: 'MX',
  });
  const [settingsError, setSettingsError] = useState('');
  const [settingsMessage, setSettingsMessage] = useState('');
  const [accountDraft, setAccountDraft] = useState({
    username: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [accountError, setAccountError] = useState('');
  const [accountMessage, setAccountMessage] = useState('');
  const [spotifyFetchLoading, setSpotifyFetchLoading] = useState(false);
  const [spotifyFetchError, setSpotifyFetchError] = useState('');
  const [spotifyNotice, setSpotifyNotice] = useState('');
  const [spotifySongs, setSpotifySongs] = useState([]);
  const [spotifyMeta, setSpotifyMeta] = useState({
    totalAlbums: 0,
    totalTracks: 0,
    market: '',
  });
  const [spotifyFallbackAlbumId, setSpotifyFallbackAlbumId] = useState('');
  const [spotifyBulkLoading, setSpotifyBulkLoading] = useState(false);
  const [spotifyBulkProgress, setSpotifyBulkProgress] = useState({
    current: 0,
    total: 0,
  });
  const [spotifySelectedIds, setSpotifySelectedIds] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchRef = useRef(null);

  const selectedRelease = useMemo(
    () => releases.find((release) => release.id === selectedId) ?? null,
    [releases, selectedId],
  );
  const releasesByAlbum = useMemo(() => {
    return albums.map((album) => ({
      album,
      releases: releases
        .filter((release) => release.albumId === album.id)
        .sort((a, b) =>
          String(b.releaseDate).localeCompare(String(a.releaseDate)),
        ),
    }));
  }, [albums, releases]);
  const generatedAlbumId = useMemo(() => {
    const baseId = slugify(albumDraft.title);
    const existingIds = new Set(albums.map((album) => album.id));
    return ensureUniqueId(baseId, existingIds);
  }, [albumDraft.title, albums]);
  const generatedReleaseId = useMemo(() => {
    if (!isNew) return draft.id || '';
    const baseId = slugify(draft.title);
    const existingIds = new Set(releases.map((release) => release.id));
    return ensureUniqueId(baseId, existingIds);
  }, [draft.id, draft.title, isNew, releases]);
  const globalArtistName = useMemo(
    () => String(settingsDraft.artistName ?? '').trim() || 'FRAGMENTADO',
    [settingsDraft.artistName],
  );
  const selectedSpotifySongs = useMemo(
    () => spotifySongs.filter((song) => spotifySelectedIds.includes(song.id)),
    [spotifySongs, spotifySelectedIds],
  );
  const releaseCountByAlbum = useMemo(
    () =>
      releases.reduce((acc, release) => {
        const key = release.albumId || '';
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {}),
    [releases],
  );
  const albumTitleById = useMemo(
    () => Object.fromEntries(albums.map((album) => [album.id, album.title])),
    [albums],
  );
  const searchResults = useMemo(() => {
    const query = normalizeSearchText(searchQuery);
    if (!query) return [];

    const albumMatches = albums
      .filter((album) => normalizeSearchText(album.title).includes(query))
      .map((album) => ({
        type: 'album',
        id: album.id,
        title: album.title,
        subtitle: `${releaseCountByAlbum[album.id] || 0} canciones`,
      }));

    const songMatches = releases
      .filter((release) => {
        const song = normalizeSearchText(release.title);
        const album = normalizeSearchText(albumTitleById[release.albumId] || '');
        return song.includes(query) || album.includes(query);
      })
      .map((release) => ({
        type: 'song',
        id: release.id,
        albumId: release.albumId,
        title: release.title,
        subtitle: albumTitleById[release.albumId] || 'Sin disco',
      }));

    return [...songMatches, ...albumMatches].slice(0, 10);
  }, [searchQuery, albums, releases, releaseCountByAlbum, albumTitleById]);

  const refreshSession = async () => {
    const response = await fetch('/api/admin/session', { cache: 'no-store' });
    const data = await response.json();
    setSession({ loading: false, ...data });
  };

  const handleSelectRelease = useCallback((release) => {
    setIsManualNew(false);
    setSelectedAlbumId(release.albumId || '');
    setSelectedId(release.id);
    setDraft({
      ...release,
      albumId: release.albumId || 'relatando-historias',
      platforms: release.platforms ?? [],
    });
    setIsNew(false);
    setSaveError('');
    setMessage('');
  }, []);

  const loadReleases = useCallback(async () => {
    const response = await fetch('/api/admin/releases', { cache: 'no-store' });
    if (!response.ok) return;

    const data = await response.json();
    const list = data.releases ?? [];
    setReleases(list);

    if (!selectedId && list.length && !isManualNew) {
      handleSelectRelease(list[0]);
    }
  }, [selectedId, isManualNew, handleSelectRelease]);

  const loadAlbums = useCallback(async () => {
    const response = await fetch('/api/admin/albums', { cache: 'no-store' });
    if (!response.ok) return;
    const data = await response.json();
    const list = data.albums ?? [];
    setAlbums(list);
    setSelectedAlbumId((current) => {
      if (current && list.some((album) => album.id === current)) return current;
      return list[0]?.id ?? '';
    });
    setExpandedAlbums((prev) => {
      const next = { ...prev };
      for (const album of list) {
        if (typeof next[album.id] === 'undefined') next[album.id] = true;
      }
      return next;
    });
    if (!albumDraft.title && list.length) {
      setAlbumDraft({
        title: '',
        year: list[0].year || String(currentYear),
      });
    }
  }, [albumDraft.title]);

  const loadSettings = useCallback(async () => {
    const response = await fetch('/api/admin/settings', { cache: 'no-store' });
    if (!response.ok) return;
    const data = await response.json();
    const settings = data.settings ?? {};
    setSettingsDraft({
      artistName: String(settings.artistName ?? 'FRAGMENTADO'),
    });
    setSpotifyEnv({
      configured: Boolean(data.spotifyEnv?.configured),
      artistId: String(data.spotifyEnv?.artistId ?? ''),
      market: String(data.spotifyEnv?.market ?? 'MX'),
    });
  }, []);

  const loadStats = useCallback(async () => {
    const response = await fetch('/api/admin/stats', { cache: 'no-store' });
    if (!response.ok) return;
    const data = await response.json();
    setStats(data.stats ?? {});
  }, []);

  useEffect(() => {
    refreshSession();
  }, []);

  useEffect(() => {
    if (session.authenticated) {
      loadReleases();
      loadStats();
      loadAlbums();
      loadSettings();
    }
  }, [
    session.authenticated,
    loadReleases,
    loadStats,
    loadAlbums,
    loadSettings,
  ]);

  useEffect(() => {
    setAccountDraft((prev) => ({ ...prev, username: session.username ?? '' }));
  }, [session.username]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!searchRef.current?.contains(event.target)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCreateFirstAdmin = async (event) => {
    event.preventDefault();
    setAuthError('');

    const response = await fetch('/api/admin/bootstrap', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const data = await response.json();
      setAuthError(data.error ?? 'No se pudo crear la cuenta admin.');
      return;
    }

    await refreshSession();
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    setAuthError('');

    const response = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const data = await response.json();
      setAuthError(data.error ?? 'Credenciales invalidas.');
      return;
    }

    await refreshSession();
  };

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    setReleases([]);
    setSelectedId('');
    setDraft(emptyRelease);
    setIsNew(true);
    await refreshSession();
  };

  const handleNewDraft = () => {
    setIsManualNew(true);
    const defaultAlbumId = selectedAlbumId || albums[0]?.id || '';
    setIsNew(true);
    setSelectedId('');
    setDraft({
      ...emptyRelease,
      albumId: defaultAlbumId,
      artist: globalArtistName,
    });
    setSaveError('');
    setMessage('Nuevo borrador listo.');
  };

  const handleNewDraftInAlbum = (albumId) => {
    setSelectedAlbumId(albumId);
    setIsManualNew(true);
    setIsNew(true);
    setSelectedId('');
    setDraft({ ...emptyRelease, albumId, artist: globalArtistName });
    setSaveError('');
    setMessage('Nuevo borrador listo.');
  };

  const handleSearchSelect = useCallback(
    (result) => {
      setActiveSection('discografia');
      setSearchQuery('');
      setIsSearchOpen(false);

      if (result.type === 'song') {
        const release = releases.find((item) => item.id === result.id);
        if (!release) return;
        setExpandedAlbums((prev) => ({ ...prev, [release.albumId]: true }));
        handleSelectRelease(release);
        return;
      }

      if (result.type === 'album') {
        setSelectedAlbumId(result.id);
        setExpandedAlbums((prev) => ({ ...prev, [result.id]: true }));
        const firstSong = releases
          .filter((release) => release.albumId === result.id)
          .sort((a, b) => String(b.releaseDate).localeCompare(String(a.releaseDate)))[0];
        if (firstSong) {
          handleSelectRelease(firstSong);
        }
      }
    },
    [releases, handleSelectRelease],
  );

  const toggleAlbum = (albumId) => {
    setExpandedAlbums((prev) => ({
      ...prev,
      [albumId]: !prev[albumId],
    }));
  };

  const getPlatformLink = (platformId) => {
    const match = (draft.platforms ?? []).find(
      (item) =>
        normalizeName(item.title) === platformId ||
        normalizeName(item.title) === normalizeName(platformId),
    );
    return match?.link ?? '';
  };

  const setPlatformLink = (preset, link) => {
    setDraft((prev) => {
      const nextPlatforms = [...(prev.platforms ?? [])];
      const index = nextPlatforms.findIndex(
        (item) =>
          normalizeName(item.title) === preset.id ||
          normalizeName(item.title) === normalizeName(preset.title),
      );

      const trimmedLink = String(link ?? '').trim();
      if (!trimmedLink) {
        if (index >= 0) nextPlatforms.splice(index, 1);
      } else {
        const value = {
          title: preset.title,
          icon: preset.icon,
          link: trimmedLink,
        };
        if (index >= 0) {
          nextPlatforms[index] = value;
        } else {
          nextPlatforms.push(value);
        }
      }

      return { ...prev, platforms: nextPlatforms };
    });
  };

  const fetchSpotifyPreviewFromLink = async (spotifyLink) => {
    const response = await fetch(
      `/api/admin/spotify/preview?url=${encodeURIComponent(String(spotifyLink ?? '').trim())}`,
      { cache: 'no-store' },
    );
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error ?? 'No se pudo obtener preview desde Spotify.');
    }
    return String(data.previewUrl ?? '').trim();
  };

  const handleResolveSpotifyPreview = async () => {
    const spotifyLink = getPlatformLink('spotify');
    if (!spotifyLink) {
      setSaveError('Primero agrega el link de Spotify en plataformas.');
      setPreviewFetchStatus('error');
      setPreviewFetchMessage('No hay link de Spotify configurado.');
      return '';
    }

    try {
      setResolvingSpotifyPreview(true);
      setPreviewFetchStatus('loading');
      setPreviewFetchMessage('Consultando preview en Spotify...');
      const previewUrl = await fetchSpotifyPreviewFromLink(spotifyLink);
      if (!previewUrl) {
        setMessage('Spotify no reporto preview para esta cancion.');
        setPreviewFetchStatus('missing');
        setPreviewFetchMessage('Spotify no tiene preview para este track.');
        return '';
      }
      setDraft((prev) => ({ ...prev, previewAudio: previewUrl }));
      setMessage('Preview de Spotify obtenido correctamente.');
      setSaveError('');
      setPreviewFetchStatus('ready');
      setPreviewFetchMessage('Preview obtenido correctamente. Guarda para persistir.');
      return previewUrl;
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'No se pudo obtener preview desde Spotify.');
      setPreviewFetchStatus('error');
      setPreviewFetchMessage(
        error instanceof Error ? error.message : 'No se pudo obtener preview desde Spotify.',
      );
      return '';
    } finally {
      setResolvingSpotifyPreview(false);
    }
  };

  const uploadMedia = async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/admin/upload', {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error ?? 'No se pudo subir el archivo.');
    }

    return data.url;
  };

  const handleCoverUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploadingCover(true);
      const url = await uploadMedia(file);
      setDraft((prev) => ({ ...prev, cover: url }));
      setMessage('Portada subida correctamente.');
      setSaveError('');
    } catch (error) {
      setSaveError(error.message);
    } finally {
      setUploadingCover(false);
      event.target.value = '';
    }
  };

  const handleSaveAlbum = async (event) => {
    event.preventDefault();
    setSaveError('');
    setMessage('');
    if (albumModalMode === 'edit') {
      if (!editingAlbumId) {
        setSaveError('No hay disco seleccionado para editar.');
        return;
      }
      const payload = {
        album: {
          id: editingAlbumId,
          title: albumDraft.title,
          artist: globalArtistName,
          year: albumDraft.year,
        },
      };

      const response = await fetch('/api/admin/albums', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        setSaveError(data.error ?? 'No se pudo editar el disco.');
        return;
      }

      const nextAlbums = data.albums ?? [];
      setAlbums(nextAlbums);
      setShowAlbumModal(false);
      setMessage('Disco actualizado correctamente.');
      return;
    }

    const resolvedAlbumId = generatedAlbumId;
    if (!resolvedAlbumId) {
      setSaveError('Escribe el titulo del disco para generar el id.');
      return;
    }

    const payload = {
      album: {
        id: resolvedAlbumId,
        title: albumDraft.title,
        artist: globalArtistName,
        year: albumDraft.year,
      },
    };

    const response = await fetch('/api/admin/albums', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!response.ok) {
      setSaveError(data.error ?? 'No se pudo crear el disco.');
      return;
    }

    const nextAlbums = data.albums ?? [];
    setAlbums(nextAlbums);
    setAlbumDraft((prev) => ({ ...prev, title: '' }));
    if (nextAlbums.length) {
      setSelectedAlbumId(nextAlbums[nextAlbums.length - 1].id);
    }
    setShowAlbumModal(false);
    setMessage('Disco creado correctamente.');
  };

  const handleOpenAlbumModal = () => {
    setAlbumModalMode('create');
    setEditingAlbumId('');
    setAlbumDraft((prev) => ({
      title: '',
      year: prev.year || String(currentYear),
    }));
    setShowAlbumModal(true);
  };

  const handleOpenEditAlbumModal = (album) => {
    setAlbumModalMode('edit');
    setEditingAlbumId(album.id);
    setAlbumDraft({
      title: album.title || '',
      year: album.year || String(currentYear),
    });
    setShowAlbumModal(true);
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setSaveError('');
    setMessage('');
    const resolvedReleaseId = isNew
      ? generatedReleaseId
      : draft.id || generatedReleaseId;
    if (!resolvedReleaseId) {
      setSaveError('Escribe el titulo para generar el id de la cancion.');
      return;
    }

    const normalizedPlatforms = (draft.platforms ?? [])
      .map((platform) => ({
        title: String(platform.title ?? '').trim(),
        link: String(platform.link ?? '').trim(),
        icon: String(platform.icon ?? '').trim(),
      }))
      .filter((platform) => platform.title || platform.link);

    let resolvedPreviewAudio = String(draft.previewAudio ?? '').trim();
    if (!resolvedPreviewAudio) {
      const spotifyPlatformLink =
        normalizedPlatforms.find(
          (platform) =>
            normalizeName(platform.title) === 'spotify',
        )?.link ?? '';
      if (spotifyPlatformLink) {
        try {
          setResolvingSpotifyPreview(true);
          resolvedPreviewAudio = await fetchSpotifyPreviewFromLink(spotifyPlatformLink);
          if (resolvedPreviewAudio) {
            setDraft((prev) => ({ ...prev, previewAudio: resolvedPreviewAudio }));
          }
        } catch {
          // Keep save flow running even if Spotify preview is unavailable.
        } finally {
          setResolvingSpotifyPreview(false);
        }
      }
    }

    const derivedYear = draft.releaseDate
      ? String(new Date(draft.releaseDate).getFullYear())
      : draft.year;

    const payload = {
      release: {
        ...draft,
        id: resolvedReleaseId,
        artist: globalArtistName,
        year: derivedYear,
        cover: draft.cover || '/pausa-min.jpg',
        previewAudio: resolvedPreviewAudio,
        platforms: normalizedPlatforms,
      },
    };

    const method = isNew ? 'POST' : 'PUT';
    const response = await fetch('/api/admin/releases', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!response.ok) {
      setSaveError(data.error ?? 'No se pudo guardar.');
      return;
    }

    setReleases(data.releases ?? []);
    setSelectedId(resolvedReleaseId);
    setDraft((prev) => ({ ...prev, id: resolvedReleaseId }));
    setIsNew(false);
    setMessage('Guardado correctamente.');
    loadStats();
  };

  const handleSaveSettings = async (event) => {
    event.preventDefault();
    setSettingsError('');
    setSettingsMessage('');
    const payload = {
      settings: {
        artistName: globalArtistName,
      },
    };

    const response = await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok) {
      setSettingsError(data.error ?? 'No se pudo guardar la configuracion.');
      return;
    }

    const settings = data.settings ?? payload.settings;
    setSettingsDraft(settings);
    setDraft((prev) => ({
      ...prev,
      artist: String(settings.artistName ?? globalArtistName),
    }));
    await Promise.all([loadAlbums(), loadReleases()]);
    setSettingsMessage('Configuracion guardada.');
  };

  const handleUpdateAccount = async (event) => {
    event.preventDefault();
    setAccountError('');
    setAccountMessage('');

    if (accountDraft.newPassword !== accountDraft.confirmPassword) {
      setAccountError('La nueva contrasena y su confirmacion no coinciden.');
      return;
    }

    const response = await fetch('/api/admin/account', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(accountDraft),
    });
    const data = await response.json();
    if (!response.ok) {
      setAccountError(data.error ?? 'No se pudo actualizar la cuenta.');
      return;
    }

    setAccountDraft((prev) => ({
      ...prev,
      username: data.username ?? prev.username,
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    }));
    setSession((prev) => ({
      ...prev,
      username: data.username ?? prev.username,
    }));
    setAccountMessage('Cuenta actualizada.');
  };

  const isSpotifySongAlreadyImported = useCallback(
    (song, releaseList = releases) => {
      const spotifyTrackId = String(song?.id ?? '').trim();
      const normalizedTitle = slugify(song?.title);
      const normalizedReleaseDate = normalizeDateComparable(
        normalizeSpotifyReleaseDate(song?.releaseDate),
      );
      return releaseList.some((release) => {
        if (
          spotifyTrackId &&
          String(release.sourceSpotifyTrackId ?? '').trim() === spotifyTrackId
        ) {
          return true;
        }
        if (!normalizedTitle) return false;
        const sameTitle = slugify(release.title) === normalizedTitle;
        if (!sameTitle) return false;
        const releaseDate = normalizeDateComparable(release.releaseDate);
        return normalizedReleaseDate
          ? releaseDate === normalizedReleaseDate
          : true;
      });
    },
    [releases],
  );

  const resolveAlbumForSpotifySong = useCallback(
    (song) => {
      const spotifyAlbumSlug = slugify(song?.albumName);
      if (spotifyAlbumSlug) {
        const exact = albums.find(
          (album) => slugify(album.title) === spotifyAlbumSlug,
        );
        if (exact) return exact.id;
      }
      if (
        spotifyFallbackAlbumId &&
        albums.some((album) => album.id === spotifyFallbackAlbumId)
      ) {
        return spotifyFallbackAlbumId;
      }
      return '';
    },
    [albums, spotifyFallbackAlbumId],
  );

  useEffect(() => {
    if (!spotifySongs.length) return;
    setSpotifySongs((prev) =>
      prev.filter((song) => !isSpotifySongAlreadyImported(song)),
    );
  }, [releases, spotifySongs.length, isSpotifySongAlreadyImported]);

  useEffect(() => {
    const validIds = new Set(releases.map((release) => release.id));
    setBulkDeleteByAlbum((prev) => {
      const next = {};
      let changed = false;
      for (const [albumId, ids] of Object.entries(prev)) {
        const filtered = ids.filter((id) => validIds.has(id));
        next[albumId] = filtered;
        if (filtered.length !== ids.length) changed = true;
      }
      return changed ? next : prev;
    });
  }, [releases]);

  useEffect(() => {
    if (bulkSelectMode) return;
    setBulkDeleteByAlbum({});
  }, [bulkSelectMode]);

  const toggleManualMode = () => {
    setManualMode((prev) => {
      const next = !prev;
      if (!next) {
        setIsManualNew(false);
        if (selectedRelease) {
          setIsNew(false);
          setSelectedId(selectedRelease.id);
        }
      }
      return next;
    });
  };

  const handleFetchSpotifySongs = async () => {
    setSpotifyFetchLoading(true);
    setSpotifyFetchError('');
    setSpotifyNotice('');
    setSpotifySongs([]);
    setSpotifyMeta({ totalAlbums: 0, totalTracks: 0, market: '' });
    try {
      const response = await fetch('/api/admin/spotify/songs', {
        cache: 'no-store',
      });
      const data = await response.json();
      if (!response.ok) {
        setSpotifyFetchError(
          data.error ?? 'No se pudieron cargar canciones de Spotify.',
        );
        return;
      }
      const incoming = Array.isArray(data.tracks) ? data.tracks : [];
      const filtered = incoming.filter(
        (song) => !isSpotifySongAlreadyImported(song),
      );
      setSpotifySongs(filtered);
      setSpotifySelectedIds([]);
      setSpotifyFallbackAlbumId(
        (current) => current || selectedAlbumId || albums[0]?.id || '',
      );
      if (!filtered.length) {
        setSpotifyNotice('No hay canciones nuevas para importar desde Spotify.');
      } else {
        setSpotifyNotice(`Se encontraron ${filtered.length} canciones nuevas.`);
      }
      setSpotifyMeta({
        totalAlbums: Number(data.totalAlbums ?? 0),
        totalTracks: filtered.length,
        market: String(data.market ?? ''),
      });
    } catch {
      setSpotifyFetchError('No se pudieron cargar canciones de Spotify.');
    } finally {
      setSpotifyFetchLoading(false);
    }
  };

  const importSpotifySong = async (song, albumId, releasesSnapshot) => {
    const platformIcons = Object.fromEntries(
      PLATFORM_PRESETS.map((platform) => [platform.id, platform.icon]),
    );
    const releaseDate = normalizeSpotifyReleaseDate(song.releaseDate);
    const releaseYear = releaseDate
      ? String(new Date(releaseDate).getFullYear())
      : '';
    const baseId = slugify(song.title);
    const existingIds = new Set(releasesSnapshot.map((release) => release.id));
    const releaseId = ensureUniqueId(baseId, existingIds);

    let autoPlatforms = [];
    if (song.spotifyUrl) {
      try {
        const response = await fetch(
          `/api/admin/song-links?url=${encodeURIComponent(song.spotifyUrl)}`,
          {
            cache: 'no-store',
          },
        );
        const data = await response.json();
        if (response.ok) {
          const links = data.links ?? {};
          autoPlatforms = [
            {
              id: 'spotify',
              title: 'spotify',
              link: links.spotify ?? song.spotifyUrl,
            },
            {
              id: 'apple-music',
              title: 'apple music',
              link: links.appleMusic ?? '',
            },
            {
              id: 'amazon-music',
              title: 'amazon music',
              link: links.amazonMusic ?? '',
            },
            { id: 'deezer', title: 'deezer', link: links.deezer ?? '' },
          ]
            .filter((platform) => String(platform.link ?? '').trim())
            .map((platform) => ({
              title: platform.title,
              icon: platformIcons[platform.id] ?? '',
              link: String(platform.link).trim(),
            }));
        }
      } catch {
        // fallback below
      }
    }

    if (!autoPlatforms.length && song.spotifyUrl) {
      autoPlatforms = [
        {
          title: 'spotify',
          icon:
            platformIcons.spotify ?? '/plataformas/Spotify_Logo_RGB_Green.png',
          link: song.spotifyUrl,
        },
      ];
    }

    const payload = {
      release: {
        id: releaseId,
        albumId,
        title: song.title,
        artist: globalArtistName,
        year: releaseYear,
        releaseDate,
        cover: song.cover || '/pausa-min.jpg',
        previewAudio: song.previewUrl || '',
        youtube: '',
        sourceSpotifyTrackId: song.id,
        sourceSpotifyAlbumId: song.albumId,
        sourceSpotifyAlbumName: song.albumName,
        platforms: autoPlatforms,
      },
    };

    const response = await fetch('/api/admin/releases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error ?? `No se pudo importar "${song.title}".`);
    }
    return data.releases ?? releasesSnapshot;
  };

  const handleToggleSpotifySong = (songId) => {
    setSpotifySelectedIds((prev) =>
      prev.includes(songId)
        ? prev.filter((id) => id !== songId)
        : [...prev, songId],
    );
  };

  const handleToggleAllSpotifySongs = () => {
    setSpotifySelectedIds((prev) =>
      prev.length === spotifySongs.length ? [] : spotifySongs.map((s) => s.id),
    );
  };

  const handleBulkImportSpotifySongs = async () => {
    if (!selectedSpotifySongs.length) return;
    setSpotifyBulkLoading(true);
    setSpotifyBulkProgress({ current: 0, total: selectedSpotifySongs.length });
    setSpotifyFetchError('');
    setSpotifyNotice('');

    let workingReleases = [...releases];
    const importedIds = [];
    let skippedNoAlbum = 0;
    let skippedDuplicate = 0;

    try {
      for (let index = 0; index < selectedSpotifySongs.length; index += 1) {
        const song = selectedSpotifySongs[index];
        setSpotifyBulkProgress({
          current: index + 1,
          total: selectedSpotifySongs.length,
        });
        if (isSpotifySongAlreadyImported(song, workingReleases)) {
          skippedDuplicate += 1;
          continue;
        }
        const resolvedAlbumId = resolveAlbumForSpotifySong(song);
        if (!resolvedAlbumId) {
          skippedNoAlbum += 1;
          continue;
        }

        workingReleases = await importSpotifySong(
          song,
          resolvedAlbumId,
          workingReleases,
        );
        importedIds.push(song.id);
      }

      if (importedIds.length) {
        setReleases(workingReleases);
      }
      if (importedIds.length || skippedDuplicate || skippedNoAlbum) {
        setSpotifySongs((prev) =>
          prev.filter((song) => !importedIds.includes(song.id)),
        );
        setSpotifySelectedIds((prev) =>
          prev.filter((id) => !importedIds.includes(id)),
        );
        setSpotifyMeta((prev) => ({
          ...prev,
          totalTracks: Math.max(0, prev.totalTracks - importedIds.length),
        }));
      }

      setMessage(
        `Importadas: ${importedIds.length}. Omitidas duplicadas: ${skippedDuplicate}. Sin disco: ${skippedNoAlbum}.`,
      );
      if (!importedIds.length) {
        setSpotifyNotice('No se importaron canciones nuevas.');
      } else {
        setSpotifyNotice(`Importacion completa: ${importedIds.length} canciones nuevas.`);
      }
    } catch (error) {
      setSpotifyFetchError(
        error instanceof Error ? error.message : 'Error al importar canciones.',
      );
    } finally {
      setSpotifyBulkLoading(false);
      setSpotifyBulkProgress({ current: 0, total: 0 });
    }
  };

  const handleDelete = async () => {
    if (!selectedRelease) return;

    const confirmed = window.confirm(`Eliminar ${selectedRelease.title}?`);
    if (!confirmed) return;

    const response = await fetch(
      `/api/admin/releases?id=${encodeURIComponent(selectedRelease.id)}`,
      {
        method: 'DELETE',
      },
    );

    const data = await response.json();
    if (!response.ok) {
      setSaveError(data.error ?? 'No se pudo eliminar.');
      return;
    }

    const next = data.releases ?? [];
    setReleases(next);
    if (next.length) {
      handleSelectRelease(next[0]);
    } else {
      handleNewDraft();
    }
    setMessage('Lanzamiento eliminado.');
    loadStats();
  };

  const toggleBulkDeleteSelection = (albumId, releaseId) => {
    setBulkDeleteByAlbum((prev) => {
      const current = prev[albumId] ?? [];
      const next = current.includes(releaseId)
        ? current.filter((id) => id !== releaseId)
        : [...current, releaseId];
      return { ...prev, [albumId]: next };
    });
  };

  const handleBulkDeleteInAlbum = async (albumId) => {
    const ids = bulkDeleteByAlbum[albumId] ?? [];
    if (!ids.length) return;

    const confirmed = window.confirm(
      `Eliminar ${ids.length} canciones de este disco?`,
    );
    if (!confirmed) return;

    const response = await fetch(
      `/api/admin/releases?ids=${encodeURIComponent(ids.join(','))}`,
      {
        method: 'DELETE',
      },
    );
    const data = await response.json();
    if (!response.ok) {
      setSaveError(data.error ?? 'No se pudieron eliminar las canciones.');
      return;
    }

    const next = data.releases ?? [];
    setReleases(next);
    setBulkDeleteByAlbum((prev) => ({ ...prev, [albumId]: [] }));
    const removedSet = new Set(ids);
    if (selectedId && removedSet.has(selectedId)) {
      const firstFromAlbum = next.find(
        (release) => release.albumId === albumId,
      );
      if (firstFromAlbum) {
        handleSelectRelease(firstFromAlbum);
      } else if (next.length) {
        handleSelectRelease(next[0]);
      } else {
        handleNewDraft();
      }
    }
    setMessage(`${ids.length} canciones eliminadas.`);
    loadStats();
  };

  const hasCover = Boolean(draft.cover);
  const hasPreviewAudio = Boolean(String(draft.previewAudio ?? '').trim());
  const hasSpotifyPlatformLink = Boolean(String(getPlatformLink('spotify') ?? '').trim());
  const showManualEditor = !isNew || isManualNew || manualMode;

  const releaseStatsSummary = useMemo(() => {
    return releases
      .map((release) => {
        const prefix = `${release.id}:`;
        const total = Object.entries(stats)
          .filter(([key]) => key.startsWith(prefix))
          .reduce((acc, [, value]) => acc + (Number(value) || 0), 0);

        return {
          id: release.id,
          title: release.title,
          total,
        };
      })
      .sort((a, b) => b.total - a.total);
  }, [releases, stats]);
  const globalChannelSummary = useMemo(() => {
    const totals = new Map();
    Object.entries(stats).forEach(([key, value]) => {
      const separatorIndex = key.indexOf(':');
      if (separatorIndex === -1) return;
      const channel = key.slice(separatorIndex + 1).trim();
      if (!channel) return;
      const current = totals.get(channel) ?? 0;
      totals.set(channel, current + (Number(value) || 0));
    });
    return Array.from(totals.entries())
      .map(([channel, value]) => ({ channel, value }))
      .sort((a, b) => b.value - a.value);
  }, [stats]);
  const totalGlobalClicks = useMemo(
    () => releaseStatsSummary.reduce((acc, item) => acc + item.total, 0),
    [releaseStatsSummary],
  );
  const todayTimestamp = useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  }, []);
  const releaseWithDate = useMemo(
    () =>
      releases
        .map((release) => ({
          ...release,
          _ts: getDateTimestamp(release.releaseDate),
        }))
        .filter((release) => release._ts > 0),
    [releases],
  );
  const latestReleaseItem = useMemo(() => {
    return [...releaseWithDate]
      .filter((release) => release._ts <= todayTimestamp)
      .sort((a, b) => b._ts - a._ts)[0] ?? null;
  }, [releaseWithDate, todayTimestamp]);
  const nextReleaseItem = useMemo(() => {
    return [...releaseWithDate]
      .filter((release) => release._ts > todayTimestamp)
      .sort((a, b) => a._ts - b._ts)[0] ?? null;
  }, [releaseWithDate, todayTimestamp]);
  const mostClickedRelease = releaseStatsSummary[0] ?? null;
  const topChannel = globalChannelSummary[0] ?? null;
  const globalTopReleasesChartData = useMemo(() => {
    const top = releaseStatsSummary.slice(0, 8);
    return {
      labels: top.map((item) => item.title),
      datasets: [
        {
          label: 'Clics',
          data: top.map((item) => item.total),
          backgroundColor: 'rgba(124, 174, 232, 0.72)',
          borderColor: 'rgba(157, 198, 245, 0.95)',
          borderWidth: 1,
          borderRadius: 6,
        },
      ],
    };
  }, [releaseStatsSummary]);
  const dashboardTopReleasesChartData = useMemo(() => {
    const top = releaseStatsSummary.slice(0, 5);
    return {
      labels: top.map((item) => item.title),
      datasets: [
        {
          label: 'Clics',
          data: top.map((item) => item.total),
          backgroundColor: 'rgba(111, 171, 241, 0.74)',
          borderColor: 'rgba(173, 211, 255, 0.95)',
          borderWidth: 1,
          borderRadius: 7,
          maxBarThickness: 42,
        },
      ],
    };
  }, [releaseStatsSummary]);
  const globalChannelsChartData = useMemo(
    () => ({
      labels: globalChannelSummary.map((item) => item.channel),
      datasets: [
        {
          data: globalChannelSummary.map((item) => item.value),
          backgroundColor: globalChannelSummary.map(
            (_, index) => channelPalette[index % channelPalette.length],
          ),
          borderColor: '#131a23',
          borderWidth: 2,
          hoverOffset: 4,
        },
      ],
    }),
    [globalChannelSummary],
  );
  const fullscreenLoadingMessage = spotifyBulkLoading
    ? `Importando canciones a discos... ${spotifyBulkProgress.current}/${spotifyBulkProgress.total}`
    : spotifyFetchLoading
      ? 'Cargando canciones de Spotify...'
      : '';
  const isFullscreenLoading = Boolean(fullscreenLoadingMessage);

  if (session.loading) {
    return <main className={styles.shell}>Cargando...</main>;
  }

  if (!session.bootstrapped) {
    return (
      <main className={styles.shell}>
        <section className={styles.card}>
          <h1>fg-admin</h1>
          <p>Crea tu cuenta inicial de administrador.</p>
          <form className={styles.form} onSubmit={handleCreateFirstAdmin}>
            <label>
              Usuario
              <input
                value={credentials.username}
                onChange={(event) =>
                  setCredentials((prev) => ({
                    ...prev,
                    username: event.target.value,
                  }))
                }
                required
                minLength={4}
              />
            </label>
            <label>
              Contraseña
              <input
                type="password"
                value={credentials.password}
                onChange={(event) =>
                  setCredentials((prev) => ({
                    ...prev,
                    password: event.target.value,
                  }))
                }
                required
                minLength={8}
              />
            </label>
            {authError ? <p className={styles.error}>{authError}</p> : null}
            <button type="submit">Crear cuenta</button>
          </form>
        </section>
      </main>
    );
  }

  if (!session.authenticated) {
    return (
      <main className={styles.shell}>
        <section className={styles.card}>
          <h1>fg-admin</h1>
          <p>Inicia sesion para administrar contenido.</p>
          <form className={styles.form} onSubmit={handleLogin}>
            <label>
              Usuario
              <input
                value={credentials.username}
                onChange={(event) =>
                  setCredentials((prev) => ({
                    ...prev,
                    username: event.target.value,
                  }))
                }
                required
              />
            </label>
            <label>
              Contraseña
              <input
                type="password"
                value={credentials.password}
                onChange={(event) =>
                  setCredentials((prev) => ({
                    ...prev,
                    password: event.target.value,
                  }))
                }
                required
              />
            </label>
            {authError ? <p className={styles.error}>{authError}</p> : null}
            <button type="submit">Entrar</button>
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className={styles.shell}>
      <header className={styles.navbar}>
        <div className={styles.navLead}>
          <div className={styles.navBrand}>
            {globalArtistName || 'FRAGMENTADO'}
          </div>
          <div className={styles.navSearchWrap} ref={searchRef}>
            <label className={styles.navSearch} aria-label="Buscar">
              <FontAwesomeIcon icon={faMagnifyingGlass} />
              <input
                type="search"
                placeholder="Buscar cancion o disco"
                value={searchQuery}
                onChange={(event) => {
                  setSearchQuery(event.target.value);
                  setIsSearchOpen(true);
                }}
                onFocus={() => setIsSearchOpen(true)}
              />
            </label>
            {isSearchOpen && searchQuery.trim() ? (
              <ul className={styles.navSearchResults}>
                {searchResults.length ? (
                  searchResults.map((result) => (
                    <li key={`${result.type}-${result.id}`}>
                      <button
                        type="button"
                        className={styles.navSearchResult}
                        onClick={() => handleSearchSelect(result)}
                      >
                        <span className={styles.navSearchResultTitle}>
                          {result.title}
                        </span>
                        <span className={styles.navSearchResultMeta}>
                          {result.type === 'song' ? 'Cancion' : 'Disco'} • {result.subtitle}
                        </span>
                      </button>
                    </li>
                  ))
                ) : (
                  <li className={styles.navSearchEmpty}>Sin resultados</li>
                )}
              </ul>
            ) : null}
          </div>
        </div>
        <nav className={styles.navTabs} aria-label="Secciones del panel">
          <button
            type="button"
            className={
              activeSection === 'dashboard' ? styles.tabActive : styles.tab
            }
            onClick={() => setActiveSection('dashboard')}
          >
            Dashboard
          </button>
          <button
            type="button"
            className={
              activeSection === 'discografia' ? styles.tabActive : styles.tab
            }
            onClick={() => setActiveSection('discografia')}
          >
            Discografia
          </button>
          <button
            type="button"
            className={
              activeSection === 'estadisticas' ? styles.tabActive : styles.tab
            }
            onClick={() => setActiveSection('estadisticas')}
          >
            Estadisticas
          </button>
          <button
            type="button"
            className={
              activeSection === 'configuracion' ? styles.tabActive : styles.tab
            }
            onClick={() => setActiveSection('configuracion')}
          >
            Configuracion
          </button>
        </nav>
        <div className={styles.navUserArea}>
          <div className={styles.userPill}>
            <span className={styles.userAvatar} aria-hidden="true">
              {(session.username || 'admin').slice(0, 1).toUpperCase()}
            </span>
            <span>{session.username || 'admin'}</span>
          </div>
          <button
            type="button"
            className={styles.navLogout}
            onClick={handleLogout}
            aria-label="Cerrar sesion"
            title="Cerrar sesion"
          >
            <FontAwesomeIcon icon={faRightFromBracket} />
          </button>
        </div>
      </header>

      <section
        className={`${styles.panel} ${
          activeSection === 'discografia' ? '' : styles.panelSingle
        }`}
      >
        {activeSection === 'discografia' ? (
        <aside className={styles.sidebar}>
          <div className={styles.sidebarHead}>
            <h2>Lanzamientos</h2>
            <div className={styles.sidebarHeadActions}>
              <button
                type="button"
                className={
                  manualMode ? styles.selectionToggleActive : styles.selectionToggle
                }
                onClick={toggleManualMode}
                aria-label={
                  manualMode ? 'Ocultar modo manual' : 'Activar modo manual'
                }
                title={
                  manualMode ? 'Ocultar modo manual' : 'Activar modo manual'
                }
              >
                <span className={styles.selectionToggleIcon} aria-hidden="true">
                  {manualMode ? '✎' : '⌁'}
                </span>
              </button>
              <button
                type="button"
                className={
                  bulkSelectMode
                    ? styles.selectionToggleActive
                    : styles.selectionToggle
                }
                onClick={() => setBulkSelectMode((prev) => !prev)}
                aria-label={
                  bulkSelectMode
                    ? 'Ocultar seleccion multiple'
                    : 'Activar seleccion multiple'
                }
                title={
                  bulkSelectMode
                    ? 'Ocultar seleccion multiple'
                    : 'Activar seleccion multiple'
                }
              >
                <span className={styles.selectionToggleIcon} aria-hidden="true">
                  {bulkSelectMode ? '✓' : '☷'}
                </span>
              </button>
            </div>
          </div>
          <button
            type="button"
            className={styles.newAlbumButton}
            onClick={handleOpenAlbumModal}
          >
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
                      <span className={styles.treeAlbumCount}>
                        {albumReleases.length}
                      </span>
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
                    {bulkSelectMode &&
                    (bulkDeleteByAlbum[album.id]?.length ?? 0) > 0 ? (
                      <button
                        type="button"
                        className={styles.bulkDeleteButton}
                        onClick={() => handleBulkDeleteInAlbum(album.id)}
                      >
                        <span className={styles.actionIcon}>x</span>
                        <span>
                          Borrar seleccionadas (
                          {bulkDeleteByAlbum[album.id].length})
                        </span>
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
                              checked={(
                                bulkDeleteByAlbum[album.id] ?? []
                              ).includes(release.id)}
                              onChange={() =>
                                toggleBulkDeleteSelection(album.id, release.id)
                              }
                            />
                          </label>
                          <button
                            type="button"
                            className={
                              release.id === selectedId
                                ? styles.itemActive
                                : styles.item
                            }
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
                          className={
                            release.id === selectedId
                              ? styles.itemActive
                              : styles.item
                          }
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
        ) : null}

        <section className={styles.editor}>
          {activeSection === 'dashboard' ? (
            <>
              <h2>Dashboard</h2>
              <p className={styles.editorHint}>
                Resumen general de actividad y estado de tu catalogo.
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
                  <p>Clics totales</p>
                  <strong>{totalGlobalClicks}</strong>
                </article>
                <article className={styles.dashboardStatCard}>
                  <p>Canal mas fuerte</p>
                  <strong>{topChannel?.channel || 'Sin datos'}</strong>
                </article>
              </section>

              <section className={styles.dashboardGrid}>
                <article
                  className={`${styles.dashboardCard} ${styles.dashboardWideCard}`}
                >
                  <h3>Top 5 lanzamientos por clics</h3>
                  {releaseStatsSummary.length ? (
                    <div className={styles.dashboardChartCanvas}>
                      <Bar
                        data={dashboardTopReleasesChartData}
                        options={dashboardBarOptions}
                      />
                    </div>
                  ) : (
                    <p className={styles.inlineNote}>
                      Sin datos de clics para graficar.
                    </p>
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
                        {albums.find(
                          (album) => album.id === latestReleaseItem.albumId,
                        )?.title || 'Sin disco'}
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
                        {albums.find((album) => album.id === nextReleaseItem.albumId)?.title ||
                          'Sin disco'}
                      </p>
                    </div>
                  ) : (
                    <p className={styles.inlineNote}>
                      No hay lanzamientos programados.
                    </p>
                  )}
                </article>
              </section>

              <section className={styles.dashboardGrid}>
                <article className={styles.dashboardCard}>
                  <h3>Rendimiento top</h3>
                  {mostClickedRelease ? (
                    <div className={styles.dashboardInfoRows}>
                      <p>
                        <strong>{mostClickedRelease.title}</strong>
                      </p>
                      <p>{mostClickedRelease.total} clics acumulados</p>
                    </div>
                  ) : (
                    <p className={styles.inlineNote}>
                      Aun no hay clics registrados.
                    </p>
                  )}
                </article>
                <article className={styles.dashboardCard}>
                  <h3>Acciones rapidas</h3>
                  <div className={styles.actions}>
                    <button
                      type="button"
                      className={styles.buttonInfo}
                      onClick={() => setActiveSection('discografia')}
                    >
                      Editar discografia
                    </button>
                    <button
                      type="button"
                      className={styles.buttonInfo}
                      onClick={() => setActiveSection('configuracion')}
                    >
                      Importar desde Spotify
                    </button>
                    <button
                      type="button"
                      className={styles.buttonNeutral}
                      onClick={() => setActiveSection('estadisticas')}
                    >
                      Ver estadisticas
                    </button>
                  </div>
                </article>
              </section>
            </>
          ) : activeSection === 'discografia' ? (
            <>
              <h2>
                {isNew
                  ? 'Nuevo lanzamiento'
                  : `Editar: ${selectedRelease?.title ?? ''}`}
              </h2>
              <p className={styles.editorHint}>
                Edita los datos del lanzamiento y guarda para reflejar cambios en
                el sitio.
              </p>
              <p className={styles.inlineNote}>
                El estado se calcula automaticamente segun la fecha de
                lanzamiento.
              </p>

              {!showManualEditor ? (
                <section className={styles.platformsSection}>
                  <p className={styles.inlineNote}>
                    Usa <strong>Configuracion</strong> para importar canciones
                    desde Spotify.
                  </p>
                  <div className={styles.actions}>
                    <button
                      type="button"
                      className={styles.buttonInfo}
                      onClick={() => setActiveSection('configuracion')}
                    >
                      Ir a Spotify
                    </button>
                    <button type="button" className={styles.buttonNeutral} onClick={toggleManualMode}>
                      Activar modo manual
                    </button>
                  </div>
                </section>
              ) : (
                <form className={styles.form} onSubmit={handleSave}>
                <section className={styles.coverSection}>
                  <h3 className={styles.subheading}>Portada</h3>
                  <div className={styles.coverManager}>
                    {hasCover ? (
                      <Image
                        className={styles.coverHero}
                        src={draft.cover}
                        alt="Portada actual"
                        width={360}
                        height={360}
                      />
                    ) : (
                      <div className={styles.coverEmpty}>
                        <span>Sin portada cargada</span>
                      </div>
                    )}

                    <label
                      className={
                        hasCover
                          ? styles.coverOverlayButton
                          : styles.coverAddButton
                      }
                    >
                      {uploadingCover
                        ? 'Subiendo...'
                        : hasCover
                          ? 'Reemplazar portada'
                          : 'Agregar portada'}
                      <input
                        className={styles.hiddenInput}
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        onChange={handleCoverUpload}
                      />
                    </label>
                  </div>
                  {draft.cover ? (
                    <span className={styles.inlineNote}>
                      Actual: {draft.cover}
                    </span>
                  ) : null}
                </section>

                <div className={styles.grid}>
                  <label>
                    Titulo
                    <input
                      value={draft.title}
                      onChange={(event) =>
                        setDraft((prev) => ({
                          ...prev,
                          title: event.target.value,
                        }))
                      }
                      required
                      placeholder="Tuyo Nomas"
                    />
                  </label>
                  <label>
                    Fecha de lanzamiento
                    <input
                      type="date"
                      value={draft.releaseDate}
                      onChange={(event) =>
                        setDraft((prev) => ({
                          ...prev,
                          releaseDate: event.target.value,
                        }))
                      }
                    />
                  </label>
                  <label>
                    Link de YouTube
                    <input
                      value={draft.youtube}
                      onChange={(event) =>
                        setDraft((prev) => ({
                          ...prev,
                          youtube: event.target.value,
                        }))
                      }
                      placeholder="https://youtu.be/..."
                    />
                  </label>
                </div>
                <p className={styles.inlineNote}>
                  Artista global aplicado: <strong>{globalArtistName}</strong>
                </p>

                <p className={styles.inlineNote}>
                  Preview de audio: se obtiene automaticamente desde Spotify (si
                  esta disponible).
                </p>
                <div className={styles.previewStatusRow}>
                  <span
                    className={
                      previewFetchStatus === 'error'
                        ? styles.previewErrorBadge
                        : hasPreviewAudio
                          ? styles.previewReadyBadge
                          : previewFetchStatus === 'loading'
                            ? styles.previewLoadingBadge
                            : styles.previewMissingBadge
                    }
                  >
                    {previewFetchStatus === 'error'
                      ? 'Error preview'
                      : previewFetchStatus === 'loading'
                        ? 'Obteniendo...'
                        : hasPreviewAudio
                          ? 'Preview detectado'
                          : 'Sin preview'}
                  </span>
                  <span className={styles.inlineNote}>
                    {previewFetchMessage
                      ? previewFetchMessage
                      : hasPreviewAudio
                      ? 'Guarda para persistir este preview en el lanzamiento.'
                      : hasSpotifyPlatformLink
                        ? 'Spotify puede no tener preview para este track.'
                        : 'Agrega primero el link de Spotify para consultarlo.'}
                  </span>
                </div>
                <div className={styles.actions}>
                  <button
                    type="button"
                    className={styles.buttonInfo}
                    onClick={handleResolveSpotifyPreview}
                    disabled={resolvingSpotifyPreview || !hasSpotifyPlatformLink}
                  >
                    {resolvingSpotifyPreview
                      ? 'Obteniendo preview...'
                      : hasPreviewAudio
                        ? 'Actualizar preview de Spotify'
                        : 'Obtener preview de Spotify'}
                  </button>
                </div>
                {draft.previewAudio ? (
                  <audio
                    className={styles.audioPreview}
                    src={draft.previewAudio}
                    controls
                    preload="none"
                  />
                ) : null}

                <section className={styles.platformsSection}>
                  <div className={styles.platformsHead}>
                    <h3>Plataformas</h3>
                    <span className={styles.inlineNote}>
                      Fijas: Spotify, Apple Music, Amazon Music y Deezer
                    </span>
                  </div>

                  <div className={styles.platformRows}>
                    {PLATFORM_PRESETS.map((preset) => (
                      <article className={styles.platformRow} key={preset.id}>
                        <Image
                          className={styles.platformPreview}
                          src={preset.icon}
                          alt={preset.title}
                          width={120}
                          height={34}
                        />
                        <label>
                          Link de {preset.title}
                          <input
                            value={getPlatformLink(preset.id)}
                            onChange={(event) =>
                              setPlatformLink(preset, event.target.value)
                            }
                            placeholder="https://..."
                          />
                        </label>
                      </article>
                    ))}
                  </div>
                </section>

                {saveError ? <p className={styles.error}>{saveError}</p> : null}
                {message ? <p className={styles.message}>{message}</p> : null}

                <div className={styles.actions}>
                  <button type="submit" className={styles.saveButton}>
                    Guardar
                  </button>
                  {!isNew ? (
                    <button
                      type="button"
                      className={styles.delete}
                      onClick={handleDelete}
                    >
                      Eliminar lanzamiento
                    </button>
                  ) : null}
                </div>
                </form>
              )}
            </>
          ) : activeSection === 'estadisticas' ? (
            <>
              <h2>Estadisticas</h2>
              <p className={styles.editorHint}>
                Vista general de rendimiento de toda la discografia.
              </p>
              <section className={styles.platformsSection}>
                <div className={styles.platformsHead}>
                  <h3>Resumen general</h3>
                  <button type="button" className={styles.buttonInfo} onClick={loadStats}>
                    Actualizar
                  </button>
                </div>
                <div className={styles.statsBox}>
                  <p>
                    Clics salientes totales:{' '}
                    <strong>{totalGlobalClicks}</strong>
                  </p>
                  <p>
                    Lanzamientos monitoreados:{' '}
                    <strong>{releaseStatsSummary.length}</strong>
                  </p>
                  <p>
                    Canales activos:{' '}
                    <strong>{globalChannelSummary.length}</strong>
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
                          <Bar
                            data={globalTopReleasesChartData}
                            options={barChartOptions}
                          />
                        </div>
                      </article>
                      {globalChannelSummary.length ? (
                        <article className={styles.chartCard}>
                          <h4>Canales con mas salida</h4>
                          <div className={styles.chartCanvas}>
                            <Doughnut
                              data={globalChannelsChartData}
                              options={doughnutChartOptions}
                            />
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
                  <p className={styles.inlineNote}>
                    Aun no hay clics registrados.
                  </p>
                )}
              </section>
            </>
          ) : (
            <>
              <h2>Configuracion</h2>
              <p className={styles.editorHint}>
                Administra cuenta, artista global del proyecto y conexion con
                Spotify API.
              </p>
              <div className={styles.configWrap}>

              <section
                className={`${styles.platformsSection} ${styles.configCard}`}
              >
                <div className={styles.configCardHead}>
                  <span className={styles.configCardIcon} aria-hidden="true">
                    <FontAwesomeIcon icon={faUserShield} />
                  </span>
                  <div className={styles.configCardTitleGroup}>
                    <h3>Cuenta de administrador</h3>
                    <p>Credenciales de acceso para fg-admin.</p>
                  </div>
                </div>
                <form
                  className={`${styles.form} ${styles.configForm}`}
                  onSubmit={handleUpdateAccount}
                >
                  <div className={styles.configGridTwo}>
                  <label>
                    Usuario
                    <input
                      value={accountDraft.username}
                      onChange={(event) =>
                        setAccountDraft((prev) => ({
                          ...prev,
                          username: event.target.value,
                        }))
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
                        setAccountDraft((prev) => ({
                          ...prev,
                          currentPassword: event.target.value,
                        }))
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
                        setAccountDraft((prev) => ({
                          ...prev,
                          newPassword: event.target.value,
                        }))
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
                        setAccountDraft((prev) => ({
                          ...prev,
                          confirmPassword: event.target.value,
                        }))
                      }
                      minLength={8}
                    />
                  </label>
                  </div>
                  {accountError ? (
                    <p className={styles.error}>{accountError}</p>
                  ) : null}
                  {accountMessage ? (
                    <p className={styles.message}>{accountMessage}</p>
                  ) : null}
                  <div className={`${styles.actions} ${styles.configActions}`}>
                    <button type="submit" className={styles.buttonSuccess}>
                      <FontAwesomeIcon icon={faKey} />
                      Guardar cuenta
                    </button>
                  </div>
                </form>
              </section>

              <section
                className={`${styles.platformsSection} ${styles.configCard}`}
              >
                <div className={styles.configCardHead}>
                  <span className={styles.configCardIcon} aria-hidden="true">
                    <FontAwesomeIcon icon={faGear} />
                  </span>
                  <div className={styles.configCardTitleGroup}>
                    <h3>Proyecto y Spotify API</h3>
                    <p>Datos globales para sincronizacion automatica.</p>
                  </div>
                </div>
                <form
                  className={`${styles.form} ${styles.configForm}`}
                  onSubmit={handleSaveSettings}
                >
                  <div className={styles.configGridTwo}>
                  <label>
                    Nombre artistico global
                    <input
                      value={settingsDraft.artistName}
                      onChange={(event) =>
                        setSettingsDraft((prev) => ({
                          ...prev,
                          artistName: event.target.value,
                        }))
                      }
                      required
                    />
                  </label>
                  <div className={styles.configFieldSpanTwo}>
                    <p className={styles.inlineNote}>
                      Spotify se configura por variables de entorno:
                      {' '}
                      <code>SPOTIFY_CLIENT_ID</code>,
                      {' '}
                      <code>SPOTIFY_CLIENT_SECRET</code>,
                      {' '}
                      <code>SPOTIFY_ARTIST_ID</code>,
                      {' '}
                      <code>SPOTIFY_MARKET</code>.
                    </p>
                    <p className={styles.inlineNote}>
                      Estado:
                      {' '}
                      {spotifyEnv.configured ? 'configurado' : 'incompleto'}
                      {' '}
                      | Artist ID:
                      {' '}
                      <strong>{spotifyEnv.artistId || '-'}</strong>
                      {' '}
                      | Market:
                      {' '}
                      <strong>{spotifyEnv.market || 'MX'}</strong>
                    </p>
                  </div>
                  </div>
                  {settingsError ? (
                    <p className={styles.error}>{settingsError}</p>
                  ) : null}
                  {settingsMessage ? (
                    <p className={styles.message}>{settingsMessage}</p>
                  ) : null}
                  <div className={`${styles.actions} ${styles.configActions}`}>
                    <button type="submit" className={styles.buttonSuccess}>Guardar configuracion</button>
                    <button
                      type="button"
                      className={`${styles.buttonInfo} ${styles.spotifySyncButton}`}
                      onClick={handleFetchSpotifySongs}
                      disabled={spotifyFetchLoading}
                    >
                      <span className={styles.spotifySyncIcon} aria-hidden="true">
                        <svg viewBox="0 0 24 24" role="presentation" focusable="false">
                          <path d="M12 0a12 12 0 1 0 0 24 12 12 0 0 0 0-24zm5.4 17.3a.74.74 0 0 1-1.02.24 10.4 10.4 0 0 0-8.94-1.06.74.74 0 0 1-.47-1.4 11.9 11.9 0 0 1 10.22 1.2c.35.2.47.66.2 1.02zm1.45-3.04a.93.93 0 0 1-1.27.3 13.06 13.06 0 0 0-11.13-1.3.93.93 0 1 1-.6-1.76 14.92 14.92 0 0 1 12.71 1.5c.44.24.6.8.29 1.26zm.13-3.17a1.1 1.1 0 0 1-1.5.36 16.3 16.3 0 0 0-12.95-1.64 1.1 1.1 0 1 1-.68-2.1 18.5 18.5 0 0 1 14.7 1.88c.52.3.69.97.43 1.5z" />
                        </svg>
                      </span>
                      {spotifyFetchLoading
                        ? 'Consultando...'
                        : 'Traer canciones de Spotify'}
                    </button>
                  </div>
                </form>
                {spotifyFetchError ? (
                  <p className={styles.error}>{spotifyFetchError}</p>
                ) : null}
                {spotifyNotice ? (
                  <p className={styles.message}>{spotifyNotice}</p>
                ) : null}
                {spotifyFetchLoading ? (
                  <div
                    className={styles.loaderRow}
                    role="status"
                    aria-live="polite"
                  >
                    <span className={styles.loaderDot} />
                    <span>Cargando canciones de Spotify...</span>
                  </div>
                ) : null}
                {spotifyBulkLoading ? (
                  <div
                    className={styles.loaderRow}
                    role="status"
                    aria-live="polite"
                  >
                    <span className={styles.loaderDot} />
                    <span>
                      Importando canciones a discos...{' '}
                      {spotifyBulkProgress.current}/{spotifyBulkProgress.total}
                    </span>
                  </div>
                ) : null}
                {spotifySongs.length ? (
                  <div className={styles.statsBox}>
                    <p>
                      Albums: <strong>{spotifyMeta.totalAlbums}</strong> |
                      Canciones: <strong>{spotifyMeta.totalTracks}</strong> |
                      Mercado: <strong>{spotifyMeta.market || '-'}</strong>
                    </p>
                    <div className={styles.spotifyBulkBar}>
                      <label className={styles.spotifyCheckLabel}>
                        <input
                          type="checkbox"
                          checked={
                            spotifySelectedIds.length > 0 &&
                            spotifySelectedIds.length === spotifySongs.length
                          }
                          onChange={handleToggleAllSpotifySongs}
                        />
                        Seleccionar todas
                      </label>
                      <label className={styles.spotifyFallbackField}>
                        Disco fallback
                        <select
                          value={spotifyFallbackAlbumId}
                          onChange={(event) =>
                            setSpotifyFallbackAlbumId(event.target.value)
                          }
                        >
                          <option value="">
                            Solo auto-asignar por nombre de disco
                          </option>
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
                        onClick={handleBulkImportSpotifySongs}
                        disabled={
                          spotifyBulkLoading || !spotifySelectedIds.length
                        }
                      >
                        {spotifyBulkLoading
                          ? 'Importando...'
                          : `Importar seleccionadas (${spotifySelectedIds.length})`}
                      </button>
                    </div>
                    <ul className={styles.statsList}>
                      {spotifySongs.slice(0, 30).map((song) => {
                        const resolvedAlbumId =
                          resolveAlbumForSpotifySong(song);
                        const resolvedAlbumTitle = albums.find(
                          (album) => album.id === resolvedAlbumId,
                        )?.title;
                        return (
                          <li key={`${song.id}-${song.albumId}`}>
                            <span>
                              <label className={styles.spotifyCheckLabel}>
                                <input
                                  type="checkbox"
                                  checked={spotifySelectedIds.includes(song.id)}
                                  onChange={() =>
                                    handleToggleSpotifySong(song.id)
                                  }
                                  disabled={spotifyBulkLoading}
                                />
                                <span />
                              </label>{' '}
                              {song.title} <small>({song.albumName})</small>
                            </span>
                            <div className={styles.spotifySongActions}>
                              <strong>{song.releaseDate || '-'}</strong>
                              <small>
                                {resolvedAlbumId
                                  ? `-> ${resolvedAlbumTitle || 'disco'}`
                                  : 'sin match'}
                              </small>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                    {spotifySongs.length > 30 ? (
                      <p className={styles.inlineNote}>
                        Mostrando 30 de {spotifySongs.length} canciones.
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </section>
              </div>
            </>
          )}
        </section>
      </section>
      {showAlbumModal ? (
        <div
          className={styles.modalBackdrop}
          onClick={() => setShowAlbumModal(false)}
          role="presentation"
        >
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
              <button
                type="button"
                className={styles.modalClose}
                onClick={() => setShowAlbumModal(false)}
                aria-label="Cerrar modal"
                title="Cerrar"
              >
                ×
              </button>
            </div>
            <form className={styles.form} onSubmit={handleSaveAlbum}>
              <label>
                Titulo del disco
                <input
                  value={albumDraft.title}
                  onChange={(event) =>
                    setAlbumDraft((prev) => ({
                      ...prev,
                      title: event.target.value,
                    }))
                  }
                  placeholder="Relatando Historias"
                  required
                />
              </label>
              <label>
                Año
                <select
                  value={albumDraft.year}
                  onChange={(event) =>
                    setAlbumDraft((prev) => ({
                      ...prev,
                      year: event.target.value,
                    }))
                  }
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
                <button type="button" className={styles.buttonNeutral} onClick={() => setShowAlbumModal(false)}>
                  Cancelar
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}
      {isFullscreenLoading ? (
        <div
          className={styles.fullscreenLoader}
          role="status"
          aria-live="polite"
          aria-busy="true"
        >
          <div className={styles.fullscreenLoaderCard}>
            <span className={styles.loaderDot} />
            <p>{fullscreenLoadingMessage}</p>
          </div>
        </div>
      ) : null}
    </main>
  );
}
