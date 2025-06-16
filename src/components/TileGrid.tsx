import { useFrame, useThree } from '@react-three/fiber'
import { useRef, useState, useEffect } from 'react'
import * as THREE from 'three'
import { TextureLoader, Mesh } from 'three'
import { Tile } from './Tile'
import { TrackInfo } from '../types/spotifyTypes'

type TileGridProps = {
  tracks: TrackInfo[]
  tileSize?: number
  onPlayTrack?: (track: TrackInfo) => void
}
const REPEAT_GRID_COUNT = 3 // how many times to repeat in each direction

export const TileGrid: React.FC<TileGridProps> = ({
  tracks,
  tileSize = 2,
  onPlayTrack,
}) => {
  const { camera, raycaster, pointer } = useThree()
  const tileRefs = useRef<Array<Mesh>>([])
  const textures = useRef<Array<THREE.Texture | null>>([])
  const [loaded, setLoaded] = useState(false)

  const hoverHeight = 1.0
  const baseHeight = 0

  useEffect(() => {
    const loader = new TextureLoader()
    Promise.all(
      tracks.map(
        (track) =>
          new Promise<THREE.Texture>((resolve) => {
            loader.load(track.album.images[0]?.url, resolve)
          })
      )
    ).then((loadedTextures) => {
      textures.current = loadedTextures
      setLoaded(true)
    })
  }, [tracks])

  const totalTiles = tracks.length
  const gridCols = Math.ceil(Math.sqrt(totalTiles))
  const gridRows = Math.ceil(totalTiles / gridCols)
  const halfGridCols = gridCols / 2
  const halfGridRows = gridRows / 2

  // Pad tracks to fill the grid completely
  const paddedTracks = [...tracks]
  while (paddedTracks.length < gridCols * gridRows) {
    paddedTracks.push(tracks[paddedTracks.length % tracks.length])
  }

  useFrame(() => {
    if (!loaded) return

    // Set boundaries based on grid size
    const gridWidth = gridCols * tileSize
    const gridDepth = gridRows * tileSize

    // Wrap camera position for infinite effect
    if (camera.position.x < -gridWidth / 2) {
      camera.position.x += gridWidth
    } else if (camera.position.x > gridWidth / 2) {
      camera.position.x -= gridWidth
    }
    if (camera.position.z < -gridDepth / 2) {
      camera.position.z += gridDepth
    } else if (camera.position.z > gridDepth / 2) {
      camera.position.z -= gridDepth
    }

    raycaster.setFromCamera(pointer, camera)
    const intersects = raycaster.intersectObjects(tileRefs.current)
    const hovered = intersects[0]?.object
    const hoverPos = hovered?.position.clone() ?? null

    for (let i = 0; i < totalTiles; i++) {
      const row = Math.floor(i / gridCols)
      const col = i % gridCols

      const x = (col - halfGridCols) * tileSize
      const z = (row - halfGridRows) * tileSize

      const tile = tileRefs.current[i]
      if (!tile) continue

      const targetPos = new THREE.Vector3(x, baseHeight, z)
      tile.position.lerp(targetPos, 0.1)

      let targetY = baseHeight
      if (hoverPos) {
        const tilePos2D = new THREE.Vector2(tile.position.x, tile.position.z)
        const hoverPos2D = new THREE.Vector2(hoverPos.x, hoverPos.z)
        const dist = tilePos2D.distanceTo(hoverPos2D)
        const maxDist = tileSize * 2
        const proximityFactor = Math.max(0, 1 - dist / maxDist)
        targetY = baseHeight + proximityFactor * hoverHeight
      }

      tile.position.y += (targetY - tile.position.y) * 0.1
    }
  })

  if (!loaded) return null

  return (
    <>
      {Array.from({ length: REPEAT_GRID_COUNT }).flatMap((_, xRepeat) =>
        Array.from({ length: REPEAT_GRID_COUNT }).flatMap((_, zRepeat) =>
          paddedTracks.map((track, i) => {
            const row = Math.floor(i / gridCols)
            const col = i % gridCols
            const x =
              (col - halfGridCols) * tileSize +
              (xRepeat - Math.floor(REPEAT_GRID_COUNT / 2)) * gridCols * tileSize
            const z =
              (row - halfGridRows) * tileSize +
              (zRepeat - Math.floor(REPEAT_GRID_COUNT / 2)) * gridRows * tileSize
            const globalIndex = (xRepeat * REPEAT_GRID_COUNT + zRepeat) * paddedTracks.length + i
            return (
              <Tile
                key={globalIndex}
                ref={(el) => {
                  if (el) tileRefs.current[globalIndex] = el
                }}
                texture={textures.current[i % textures.current.length]!}
                tileSize={tileSize}
                track={track}
                position={[x, baseHeight, z]}
                onClick={() => onPlayTrack?.(track)}
              />
            )
          })
        )
      )}
    </>
  )
}