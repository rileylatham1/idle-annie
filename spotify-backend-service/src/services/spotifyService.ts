export async function playTrack(albumContextUri: string, trackContextUri: string[], token: string) {
  const res = await fetch('https://api.spotify.com/v1/me/player/play', {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      context_uri: albumContextUri,
      uris: trackContextUri,
      offset: {
        position: 0, // you can make this dynamic if needed
      },
      position_ms: 0,
    }),
  });
  if (!res.ok) {
    throw new Error('Failed to start playback');
  }
}