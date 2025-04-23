export async function playTrack(trackContextUri: string, token: string) {
  const res = await fetch('https://api.spotify.com/v1/me/player/play', {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      // context_uri: albumContextUri,
      uris: [trackContextUri],
    }),
  });
  console.log('playTrack res', res)
  
  if (!res.ok) {
    throw new Error('Failed to start playback');
  }
}