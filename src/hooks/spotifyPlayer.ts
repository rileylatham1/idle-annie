export async function playNextTrack(currentUri: string, allUris: string[], token: string) {
  const res = await fetch("http://localhost:8000/tracks/play-next", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      access_token: token,
      current_track_uri: currentUri,
      uris: allUris,
    })
  });

  if (!res.ok) {
    throw new Error("Failed to start next track playback");
  }
}