// src/App.tsx
import { useEffect, useState, useRef } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { TileGrid } from './components/TileGrid'
import { DragCameraControls } from './utils/DragCameraControls'
import {
  getAccessToken,
  redirectToSpotifyAuth,
} from './hooks/spotifyAccessToken'
import { fetchUserLikedTracks } from './hooks/spotifyApi'
import { playNextTrack } from './hooks/spotifyPlayer'
import { TrackInfo } from './types/spotifyTypes'
import { FocusedTrackScene } from './components/FocusedTrackScene'
import './index.css'

type SceneState = 'grid' | 'focused'

// Component to adjust the camera depending on whether a track is focused
const AdjustCamera: React.FC<{ scene: SceneState }> = ({ scene }) => {
  const { camera } = useThree()
  const prevScene = useRef<SceneState | null>(null)

  useEffect(() => {
    if (scene !== prevScene.current) {
      if (scene === 'focused') {
        camera.position.set(0, 0, 8)
        camera.lookAt(0, 0, 0)
      } else if (scene === 'grid') {
        camera.position.set(25, 10, 10)
        camera.lookAt(0, 0, 0)
      }
      prevScene.current = scene
    }
  }, [scene, camera])

  return null
}

const App: React.FC = () => {
  const [albumArts, setAlbumArts] = useState<string[]>([])
  const [likedTracks, setAlbumTracks] = useState<TrackInfo[]>([])
  const [scene, setScene] = useState<SceneState>('grid')
  const [activeTrack, setActiveTrack] = useState<TrackInfo | null>(null)

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
      <fog attach="fog" args={['black', 5, 50]} />
      
      {/* Lights */}
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 10, 5]} intensity={1.2} />

      {/* Control camera position depending on view */}
      <AdjustCamera scene={scene} />

      {/* Only enable drag controls in grid view */}
      {scene === 'grid' && <DragCameraControls />}


      {scene === 'grid' && albumArts.length > 0 && !activeTrack && (
        <TileGrid
          tracks={likedTracks}
          onPlayTrack={(track) => {
            playNextTrack(track.uri, likedTracks.map(track => track.uri), localStorage.access_token)
            setActiveTrack(track)
            setScene('focused')
          }}
        />
      )}

      {scene === 'focused' && activeTrack && (
        <FocusedTrackScene
          track={activeTrack}
          onBack={() => {
            setScene('grid')
            setActiveTrack(null)
          }}
        />
      )}
    </Canvas>
  )
}

export default App