// src/App.tsx
import { useEffect, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { TileGrid } from './components/TileGrid'
import { DragCameraControls } from './utils/DragCameraControls'
import './index.css'
import {
  getAccessToken,
  exchangeCodeForToken,
  redirectToSpotifyAuth,
} from './hooks/spotifyAccessToken'
import { fetchUserLikedTracks } from './hooks/spotifyApi'
import { playTrack } from './hooks/spotifyPlayer'
import { TrackInfo } from './types/spotifyTypes'

const App: React.FC = () => {
  const [albumArts, setAlbumArts] = useState<string[]>([])
  const [likedTracks, setAlbumTracks] = useState<TrackInfo[]>([])

  useEffect(() => {
    const init = async () => {
      let token = getAccessToken()

      // 👀 If there's a code in the URL (Spotify redirected back)
      const urlParams = new URLSearchParams(window.location.search)
      const code = urlParams.get('code')

      if (!token && code) {
        try {
          token = await exchangeCodeForToken(code)
          // 🚿 Clean up URL after token exchange
          window.history.replaceState({}, '', window.location.pathname)
        } catch (err) {
          console.error('Token exchange failed:', err)
        }
      }

      if (!token) {
        // 🔐 Kick off login if no token
        console.log(import.meta.env.VITE_SPOTIFY_CLIENT_ID)
        console.log(import.meta.env.VITE_SPOTIFY_CLIENT_SECRET)
        redirectToSpotifyAuth()
        return
      }

      try {
        const fetchedTracks = await fetchUserLikedTracks(token, 500)
        const arts = fetchedTracks.map((item) => item.track.album.images[0]?.url)
        console.log('fetchedTracks', fetchedTracks)
        setAlbumTracks(fetchedTracks)
        setAlbumArts(arts)
      } catch (err) {
        console.error('Error fetching liked songs:', err)
      }
    }

    init()
  }, [])

  return (
    <Canvas camera={{ position: [25, 10, 10], fov: 90 }}>
      <DragCameraControls />
      <fog attach="fog" args={['black', 5, 50]} />
      <ambientLight />
      {albumArts.length > 0 && <TileGrid tracks={likedTracks} onPlayTrack={(trackContextUri) => {
        playTrack(trackContextUri, localStorage.access_token)
      }}/>}
    </Canvas>
  )
}

export default App
