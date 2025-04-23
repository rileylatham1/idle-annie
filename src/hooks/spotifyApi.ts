import { TrackInfo } from '../types/spotifyTypes'
  
type SpotifyLikedTracksResponse = {
  items: TrackInfo[]
  next: string | null
}

export async function fetchUserLikedTracks(
  token: string,
  total = 50
): Promise<TrackInfo[]> {
  const allTracks: TrackInfo[] = []
  let offset = 0
  let hasMore = true

  while (hasMore) {
    const res = await fetch(
      `https://api.spotify.com/v1/me/tracks?limit=50&offset=${offset}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    )

    if (!res.ok) {
      throw new Error(`Failed to fetch liked songs: ${res.statusText}`)
    }

    const data: SpotifyLikedTracksResponse = await res.json()

    allTracks.push(...data.items)
    offset += 50
    hasMore = offset < total
  }

  return allTracks
}