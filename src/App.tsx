// src/App.tsx
import { useEffect, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { TileGrid } from './components/TileGrid'
import { DragCameraControls } from './utils/DragCameraControls'
import './index.css'
import {
  getAccessToken,
  redirectToSpotifyAuth,
} from './hooks/spotifyAccessToken'
import { fetchUserLikedTracks } from './hooks/spotifyApi'
import { playNextTrack } from './hooks/spotifyPlayer'
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
          // Send code to FastAPI backend (which uses gRPC behind the scenes)
          const response = await fetch('http://127.0.0.1:8000/auth/exchange', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code }),
          })
          const data = await response.json()

          if (data.success && data.session_token) {
            token = data.session_token
            if (token) {
              localStorage.setItem('access_token', token)
            }
            localStorage.setItem('expires_at', (Date.now() + 3600 * 1000).toString()) // ⏱️ Assume 1 hour expiry
          }

          // 🚿 Clean up URL
          window.history.replaceState({}, '', window.location.pathname)
        } catch (err) {
          console.error('Token exchange failed:', err)
        }
      }

      if (!token) {
        // 🔐 Kick off login if no token
        redirectToSpotifyAuth()
        return
      }

      try {
        const fetchedTracks = await fetchUserLikedTracks(token, 500)
        const arts = fetchedTracks.map((item) => item.album.images[0]?.url)
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
      {albumArts.length > 0 && <TileGrid tracks={likedTracks} onPlayTrack={(trackUri) => {
  playNextTrack(trackUri, likedTracks.map(track => track.uri), localStorage.access_token);
}}/>}
    </Canvas>
  )
}

export default App
