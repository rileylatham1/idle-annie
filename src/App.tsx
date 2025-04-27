// src/App.tsx
import { useEffect, useState } from 'react'
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
import { CameraFlyTransition } from './components/CameraFlyTransition' // <-- we'll add this!
import './index.css'

type SceneState = 'grid' | 'transition' | 'focused' | 'transition-out'

// Adjust camera manually depending on scene
const AdjustCamera: React.FC<{ scene: SceneState }> = ({ scene }) => {
  const { camera } = useThree()

  useEffect(() => {
    if (scene === 'grid') {
      camera.position.set(25, 10, 10)
      camera.lookAt(0, 0, 0)
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

      const urlParams = new URLSearchParams(window.location.search)
      const code = urlParams.get('code')

      if (!token && code) {
        try {
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
            localStorage.setItem('expires_at', (Date.now() + 3600 * 1000).toString())
          }

          window.history.replaceState({}, '', window.location.pathname)
        } catch (err) {
          console.error('Token exchange failed:', err)
        }
      }

      if (!token) {
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

      {/* Adjust camera when scene changes */}
      <AdjustCamera scene={scene} />

      {/* Allow dragging only in grid mode */}
      {scene === 'grid' && <DragCameraControls />}

      {/* Show TileGrid */}
      {scene === 'grid' && albumArts.length > 0 && !activeTrack && (
        <TileGrid
          tracks={likedTracks}
          onPlayTrack={(track) => {
            playNextTrack(track.uri, likedTracks.map(t => t.uri), localStorage.access_token)
            setActiveTrack(track)
            setScene('transition') // 🛫 fly into selected album
          }}
        />
      )}

      {/* Handle camera transition */}
      {scene === 'transition' && <CameraFlyTransition direction="in" onDone={() => setScene('focused')} />}
      {scene === 'transition-out' && <CameraFlyTransition direction="out" onDone={() => {
        setScene('grid')
        setActiveTrack(null)
      }} />}

      {/* Show FocusedTrackScene */}
      {(scene === 'focused' || scene === 'transition' || scene === 'transition-out') && activeTrack && (
        <FocusedTrackScene
          track={activeTrack}
          onBack={() => {
            setScene('transition-out')
          }}
        />
      )}
    </Canvas>
  )
}

export default App
