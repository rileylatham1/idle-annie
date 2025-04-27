import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Html } from '@react-three/drei'
import { TrackInfo } from '../types/spotifyTypes'

type Props = {
  track: TrackInfo
  onBack: () => void
}

export const FocusedTrackScene: React.FC<Props> = ({ track, onBack }) => {
  const recordRef = useRef<THREE.Mesh>(null)
  const startTimeRef = useRef<number | null>(null) // Store the start time for the animation
  const [isSpinning, setIsSpinning] = useState(false)

  useFrame(() => {
    if (isSpinning && recordRef.current) {
      if (startTimeRef.current === null) {
        startTimeRef.current = performance.now() // Store current timestamp
      }

      const elapsed = (performance.now() - startTimeRef.current) / 1000 // Convert to seconds
      const rampTime = 8 // seconds to reach full speed (2 seconds to get to 45 RPM)
      const speedFactor = Math.min(elapsed / rampTime, 1) // Easing factor (0 → 1)
      const rotationSpeed = 4.712 // 45 RPM in rad/s (full speed)

      // Apply rotation based on time elapsed
      recordRef.current.rotation.z = -elapsed * rotationSpeed * speedFactor
    }
  })

  const texture = new THREE.TextureLoader().load(track.album.images[0]?.url || '')

  const startSpin = () => {
    setIsSpinning(true)
    startTimeRef.current = null // Reset timer when starting
    console.log('Spin started') // Debugging line
  }

  return (
    <group>
      {/* Spinning record */}
      <mesh ref={recordRef} position={[0, 0, 0]} onClick={startSpin}>
        <circleGeometry args={[5, 100]} />
        <meshStandardMaterial map={texture} />
        <ambientLight intensity={0.3} />
        <pointLight position={[5, 5, 5]} intensity={1.2} />
      </mesh>

      {/* Back button (DOM element in scene) */}
      <Html position={[-15.5, 8, 0]}>
        <button
          onClick={onBack}
          style={{
            padding: '0.5rem 1rem',
            background: 'black',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
          }}
        >
          ← Back
        </button>
      </Html>
    </group>
  )
}
