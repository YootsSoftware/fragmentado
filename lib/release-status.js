export const BADGE_PUBLISHED = 'Lanzamiento publicado';
export const BADGE_NEW = 'Nuevo lanzamiento';
export const BADGE_UPCOMING = 'Lanzamiento proximo';

const asDate = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
};

export const applyAutomaticBadges = (releases, now = new Date()) => {
  const normalized = Array.isArray(releases) ? releases : [];
  const referenceTime = now.getTime();

  const withMeta = normalized.map((release) => {
    const date = asDate(release.releaseDate);
    const isUpcomingByDate = date ? date.getTime() > referenceTime : false;
    const isUpcoming = isUpcomingByDate || Boolean(release.isUpcoming && !date);

    return {
      release,
      date,
      isUpcoming,
    };
  });

  const publishedWithDate = withMeta
    .filter((item) => !item.isUpcoming && item.date)
    .sort((a, b) => b.date.getTime() - a.date.getTime());

  const latestPublishedId = publishedWithDate[0]?.release?.id ?? null;

  return withMeta.map(({ release, isUpcoming }) => {
    let badge = BADGE_PUBLISHED;
    if (isUpcoming) {
      badge = BADGE_UPCOMING;
    } else if (latestPublishedId && release.id === latestPublishedId) {
      badge = BADGE_NEW;
    }

    return {
      ...release,
      badge,
      isUpcoming,
    };
  });
};
