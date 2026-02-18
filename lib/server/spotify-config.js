const normalize = (value) => String(value ?? '').trim();

export const getSpotifyConfigFromEnv = () => {
  const clientId = normalize(process.env.SPOTIFY_CLIENT_ID);
  const clientSecret = normalize(process.env.SPOTIFY_CLIENT_SECRET);
  const artistId = normalize(process.env.SPOTIFY_ARTIST_ID);
  const market = normalize(process.env.SPOTIFY_MARKET).toUpperCase() || 'MX';

  return {
    clientId,
    clientSecret,
    artistId,
    market,
    configured: Boolean(clientId && clientSecret && artistId),
  };
};

