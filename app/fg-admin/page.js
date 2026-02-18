'use client';
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
import styles from './page.module.css';
import AuthCard from './components/AuthCard';
import AdminNavbar from './components/AdminNavbar';
import DashboardSection from './components/DashboardSection';
import StatsSection from './components/StatsSection';
import ConfigSection from './components/ConfigSection';
import AdminFooter from './components/AdminFooter';
import DiscographyEditorSection from './components/DiscographyEditorSection';
import DiscographySidebar from './components/DiscographySidebar';
import AlbumModal from './components/AlbumModal';
import FullscreenLoader from './components/FullscreenLoader';

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
  const [authSubmitting, setAuthSubmitting] = useState(false);

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

  const readJsonSafe = useCallback(async (response) => {
    try {
      return await response.json();
    } catch {
      return null;
    }
  }, []);

  const getErrorMessage = useCallback((response, data, fallback) => {
    if (data && typeof data.error === 'string' && data.error.trim()) {
      return data.error;
    }
    if (!response.ok) {
      return `${fallback} (HTTP ${response.status})`;
    }
    return fallback;
  }, []);

  const refreshSession = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/session', {
        cache: 'no-store',
        credentials: 'include',
      });
      const data = await readJsonSafe(response);
      if (!response.ok || !data) {
        setSession({
          loading: false,
          bootstrapped: true,
          authenticated: false,
          username: null,
        });
        return null;
      }
      setSession({ loading: false, ...data });
      return data;
    } catch {
      setSession({
        loading: false,
        bootstrapped: true,
        authenticated: false,
        username: null,
      });
      return null;
    }
  }, [readJsonSafe]);

  const handleAuthFormKeyDown = useCallback((event) => {
    if (event.key !== 'Enter') return;
    const form = event.currentTarget;
    if (!form || typeof form.requestSubmit !== 'function') return;
    event.preventDefault();
    form.requestSubmit();
  }, []);

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
  }, [refreshSession]);

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
    if (authSubmitting) return;
    setAuthError('');
    setAuthSubmitting(true);
    try {
      const response = await fetch('/api/admin/bootstrap', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });
      const data = await readJsonSafe(response);

      if (!response.ok) {
        setAuthError(
          getErrorMessage(response, data, 'No se pudo crear la cuenta admin.'),
        );
        return;
      }

      await refreshSession();
    } catch {
      setAuthError('No se pudo crear la cuenta admin. Revisa servidor o red.');
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    if (authSubmitting) return;
    setAuthError('');
    setAuthSubmitting(true);
    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });
      const data = await readJsonSafe(response);

      if (!response.ok) {
        setAuthError(getErrorMessage(response, data, 'Credenciales invalidas.'));
        return;
      }

      const sessionData = await refreshSession();
      if (!sessionData?.authenticated) {
        setAuthError(
          'Inicio correcto, pero no se guardo la sesion. Revisa HTTPS/dominio y FG_ADMIN_SECRET.',
        );
      }
    } catch {
      setAuthError('No se pudo iniciar sesion. Revisa servidor o red.');
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST', credentials: 'include' });
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
    const normalizedDraftTitle = slugify(draft.title);
    const normalizedDraftDate = normalizeDateComparable(draft.releaseDate);
    const normalizedDraftSpotifyTrackId = String(draft.sourceSpotifyTrackId ?? '').trim();
    const existingReleaseMatch = releases.find((release) => {
      if (draft.id && release.id === draft.id) return true;
      if (
        normalizedDraftSpotifyTrackId &&
        String(release.sourceSpotifyTrackId ?? '').trim() === normalizedDraftSpotifyTrackId
      ) {
        return true;
      }
      if (!normalizedDraftTitle) return false;
      const sameTitle = slugify(release.title) === normalizedDraftTitle;
      if (!sameTitle) return false;
      const sameAlbum = String(release.albumId ?? '') === String(draft.albumId ?? '');
      if (!sameAlbum) return false;
      const releaseDate = normalizeDateComparable(release.releaseDate);
      if (normalizedDraftDate) return releaseDate === normalizedDraftDate;
      return true;
    });

    const shouldUpdateExisting = Boolean(existingReleaseMatch && (isNew || !draft.id));
    const resolvedReleaseId = shouldUpdateExisting
      ? existingReleaseMatch.id
      : isNew
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

    const method = shouldUpdateExisting ? 'PUT' : isNew ? 'POST' : 'PUT';
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
        credentials: 'include',
      });
      const rawPayload = await response.text();
      let data = null;
      if (rawPayload) {
        try {
          data = JSON.parse(rawPayload);
        } catch {
          data = null;
        }
      }

      if (!response.ok) {
        const fallbackMessage = rawPayload
          ? rawPayload.slice(0, 180)
          : 'No se pudieron cargar canciones de Spotify.';
        setSpotifyFetchError(
          data?.error ?? fallbackMessage,
        );
        return;
      }
      if (!data || typeof data !== 'object') {
        setSpotifyFetchError(
          'Respuesta invalida del servidor al consultar Spotify.',
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
  const adminFooter = <AdminFooter />;

  if (session.loading) {
    return (
      <main className={styles.shell}>
        Cargando...
        {adminFooter}
      </main>
    );
  }

  if (!session.bootstrapped) {
    return (
      <main className={styles.shell}>
        <AuthCard
          mode="bootstrap"
          credentials={credentials}
          authSubmitting={authSubmitting}
          authError={authError}
          onSubmit={handleCreateFirstAdmin}
          onKeyDown={handleAuthFormKeyDown}
          onChangeCredentials={(field, value) =>
            setCredentials((prev) => ({ ...prev, [field]: value }))
          }
        />
        {adminFooter}
      </main>
    );
  }

  if (!session.authenticated) {
    return (
      <main className={styles.shell}>
        <AuthCard
          mode="login"
          credentials={credentials}
          authSubmitting={authSubmitting}
          authError={authError}
          onSubmit={handleLogin}
          onKeyDown={handleAuthFormKeyDown}
          onChangeCredentials={(field, value) =>
            setCredentials((prev) => ({ ...prev, [field]: value }))
          }
        />
        {adminFooter}
      </main>
    );
  }

  return (
    <main className={styles.shell}>
      <AdminNavbar
        globalArtistName={globalArtistName}
        searchRef={searchRef}
        searchQuery={searchQuery}
        isSearchOpen={isSearchOpen}
        searchResults={searchResults}
        activeSection={activeSection}
        sessionUsername={session.username}
        onSearchChange={(value) => {
          setSearchQuery(value);
          setIsSearchOpen(true);
        }}
        onSearchFocus={() => setIsSearchOpen(true)}
        onSearchSelect={handleSearchSelect}
        onSetActiveSection={setActiveSection}
        onLogout={handleLogout}
      />

      <section
        className={`${styles.panel} ${
          activeSection === 'discografia' ? '' : styles.panelSingle
        }`}
      >
        {activeSection === 'discografia' ? (
          <DiscographySidebar
            manualMode={manualMode}
            toggleManualMode={toggleManualMode}
            bulkSelectMode={bulkSelectMode}
            setBulkSelectMode={setBulkSelectMode}
            handleOpenAlbumModal={handleOpenAlbumModal}
            releasesByAlbum={releasesByAlbum}
            setSelectedAlbumId={setSelectedAlbumId}
            toggleAlbum={toggleAlbum}
            expandedAlbums={expandedAlbums}
            handleOpenEditAlbumModal={handleOpenEditAlbumModal}
            bulkDeleteByAlbum={bulkDeleteByAlbum}
            handleBulkDeleteInAlbum={handleBulkDeleteInAlbum}
            handleNewDraftInAlbum={handleNewDraftInAlbum}
            toggleBulkDeleteSelection={toggleBulkDeleteSelection}
            selectedId={selectedId}
            handleSelectRelease={handleSelectRelease}
          />
        ) : null}

        <section className={styles.editor}>
          {activeSection === 'dashboard' ? (
            <DashboardSection
              albums={albums}
              releases={releases}
              totalGlobalClicks={totalGlobalClicks}
              topChannel={topChannel}
              releaseStatsSummary={releaseStatsSummary}
              dashboardTopReleasesChartData={dashboardTopReleasesChartData}
              dashboardBarOptions={dashboardBarOptions}
              latestReleaseItem={latestReleaseItem}
              nextReleaseItem={nextReleaseItem}
              mostClickedRelease={mostClickedRelease}
              onSetActiveSection={setActiveSection}
            />
          ) : activeSection === 'discografia' ? (
            <DiscographyEditorSection
              isNew={isNew}
              selectedRelease={selectedRelease}
              showManualEditor={showManualEditor}
              onSetActiveSection={setActiveSection}
              toggleManualMode={toggleManualMode}
              handleSave={handleSave}
              hasCover={hasCover}
              draft={draft}
              uploadingCover={uploadingCover}
              handleCoverUpload={handleCoverUpload}
              setDraft={setDraft}
              globalArtistName={globalArtistName}
              previewFetchStatus={previewFetchStatus}
              hasPreviewAudio={hasPreviewAudio}
              previewFetchMessage={previewFetchMessage}
              hasSpotifyPlatformLink={hasSpotifyPlatformLink}
              resolvingSpotifyPreview={resolvingSpotifyPreview}
              handleResolveSpotifyPreview={handleResolveSpotifyPreview}
              PLATFORM_PRESETS={PLATFORM_PRESETS}
              getPlatformLink={getPlatformLink}
              setPlatformLink={setPlatformLink}
              saveError={saveError}
              message={message}
              handleDelete={handleDelete}
            />
          ) : activeSection === 'estadisticas' ? (
            <StatsSection
              totalGlobalClicks={totalGlobalClicks}
              releaseStatsSummary={releaseStatsSummary}
              globalChannelSummary={globalChannelSummary}
              globalTopReleasesChartData={globalTopReleasesChartData}
              barChartOptions={barChartOptions}
              globalChannelsChartData={globalChannelsChartData}
              doughnutChartOptions={doughnutChartOptions}
              onLoadStats={loadStats}
            />
          ) : (
            <ConfigSection
              accountDraft={accountDraft}
              setAccountDraft={setAccountDraft}
              accountError={accountError}
              accountMessage={accountMessage}
              onUpdateAccount={handleUpdateAccount}
              settingsDraft={settingsDraft}
              setSettingsDraft={setSettingsDraft}
              spotifyEnv={spotifyEnv}
              settingsError={settingsError}
              settingsMessage={settingsMessage}
              onSaveSettings={handleSaveSettings}
              onFetchSpotifySongs={handleFetchSpotifySongs}
              spotifyFetchLoading={spotifyFetchLoading}
              spotifyFetchError={spotifyFetchError}
              spotifyNotice={spotifyNotice}
              spotifyBulkLoading={spotifyBulkLoading}
              spotifyBulkProgress={spotifyBulkProgress}
              spotifySongs={spotifySongs}
              spotifyMeta={spotifyMeta}
              spotifySelectedIds={spotifySelectedIds}
              onToggleAllSpotifySongs={handleToggleAllSpotifySongs}
              spotifyFallbackAlbumId={spotifyFallbackAlbumId}
              setSpotifyFallbackAlbumId={setSpotifyFallbackAlbumId}
              albums={albums}
              onBulkImportSpotifySongs={handleBulkImportSpotifySongs}
              onToggleSpotifySong={handleToggleSpotifySong}
              resolveAlbumForSpotifySong={resolveAlbumForSpotifySong}
            />
          )}
        </section>
      </section>
      <AlbumModal
        showAlbumModal={showAlbumModal}
        onClose={() => setShowAlbumModal(false)}
        albumModalMode={albumModalMode}
        albumDraft={albumDraft}
        setAlbumDraft={setAlbumDraft}
        YEAR_OPTIONS={YEAR_OPTIONS}
        onSaveAlbum={handleSaveAlbum}
      />
      <FullscreenLoader message={isFullscreenLoading ? fullscreenLoadingMessage : ''} />
      {adminFooter}
    </main>
  );
}
