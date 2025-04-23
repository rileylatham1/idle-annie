import { forwardRef, useState } from 'react'
import { Mesh } from 'three'
import * as THREE from 'three'
import { Html } from '@react-three/drei'

type TileProps = {
  texture: THREE.Texture
  tileSize?: number
  track: {
    name: string
    artist: string
    uri: string
  }
  onClick?: (uri: string) => void
}

export const Tile = forwardRef<Mesh, TileProps>(
  ({ texture, tileSize = 2, track, onClick }, ref) => {
    const [hovered, setHovered] = useState(false)
    const depth = 0.3

    return (
      <mesh
        ref={ref}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        onClick={() => onClick?.(track.uri)}
      >
        {hovered && (
          <Html position={[0, 1.5, 0]} center style={{ pointerEvents: 'none' }}>
            <div className="tooltip">
              <div>🎵 <strong>{track.name}</strong></div>
              <div>🎤 {track.artist}</div>
            </div>
          </Html>
        )}
        <boxGeometry args={[tileSize, depth, tileSize]} />
        <meshBasicMaterial attach="material-0" color="#222" /> {/* Top */}
        <meshBasicMaterial attach="material-1" color="#222" /> {/* Bottom */}
        <meshBasicMaterial attach="material-2" map={texture} /> {/* Left */}
        <meshBasicMaterial attach="material-3" color="#444" /> {/* Right */}
        <meshBasicMaterial attach="material-4" color="#222" /> {/* Front */}
        <meshBasicMaterial attach="material-5" color="#444" /> {/* Back */}
      </mesh>
    )
  }
)
