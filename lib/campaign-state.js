const DAY_IN_MS = 24 * 60 * 60 * 1000;
const NEW_RELEASE_WINDOW_DAYS = 30;

export const CAMPAIGN_PHASE_COPY = {
  upcoming: {
    eyebrow: 'Próximo lanzamiento',
    action: 'Pre-save',
    navigation: 'Pre-save',
  },
  new: {
    eyebrow: 'Nuevo lanzamiento',
    action: 'Escuchar ahora',
    navigation: 'Nuevo lanzamiento',
  },
  latest: {
    eyebrow: 'Último lanzamiento',
    action: 'Escuchar ahora',
    navigation: 'Último lanzamiento',
  },
};

export const getMexicoDateKey = (date = new Date()) => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Mexico_City',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
};

export const getCampaignPhase = (releaseDate, today = getMexicoDateKey()) => {
  const releaseKey = String(releaseDate ?? '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(releaseKey) || releaseKey > today) return 'upcoming';

  const elapsedDays = Math.floor(
    (Date.parse(`${today}T00:00:00Z`) - Date.parse(`${releaseKey}T00:00:00Z`)) / DAY_IN_MS,
  );
  return elapsedDays < NEW_RELEASE_WINDOW_DAYS ? 'new' : 'latest';
};

export const sortCampaignsForDisplay = (campaigns, today = getMexicoDateKey()) =>
  [...campaigns].sort((a, b) => {
    const aUpcoming = String(a.releaseDate) > today;
    const bUpcoming = String(b.releaseDate) > today;
    if (aUpcoming !== bUpcoming) return aUpcoming ? -1 : 1;
    return aUpcoming
      ? String(a.releaseDate).localeCompare(String(b.releaseDate))
      : String(b.releaseDate).localeCompare(String(a.releaseDate));
  });
