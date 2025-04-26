import { TrackInfo } from '../types/spotifyTypes'

export async function fetchUserLikedTracks(token: string, total = 50): Promise<TrackInfo[]> {
  const response = await fetch('http://127.0.0.1:8000/tracks/liked', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ access_token: token, total }),
  })

  const data = await response.json()

  if (!data.success) {
    throw new Error('Failed to fetch liked tracks from backend')
  }
  return data.tracks
}