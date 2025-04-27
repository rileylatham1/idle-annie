import { useThree, useFrame } from '@react-three/fiber'
import { useEffect, useRef, useMemo } from 'react'
import * as THREE from 'three'

type Props = {
  direction: 'in' | 'out'
  onDone: () => void
}

export const CameraFlyTransition: React.FC<Props> = ({ direction, onDone }) => {
  const { camera } = useThree()
  const startPosition = useMemo(
    () => (direction === 'in' ? new THREE.Vector3(25, 10, 10) : new THREE.Vector3(0, 0, 8)),
    [direction]
  )
  const endPosition = useMemo(
    () => (direction === 'in' ? new THREE.Vector3(0, 0, 8) : new THREE.Vector3(25, 10, 10)),
    [direction]
  )
  const startTime = useRef<number>(performance.now())

  useFrame(() => {
    const now = performance.now()
    const elapsed = now - startTime.current
    const duration = 2000 // ms
    const t = Math.min(elapsed / duration, 1)

    camera.position.lerpVectors(startPosition, endPosition, t)
    camera.lookAt(0, 0, 0)

    if (t >= 1) {
      onDone()
    }
  })

  useEffect(() => {
    camera.position.copy(startPosition)
    camera.lookAt(0, 0, 0)
  }, [camera, startPosition])

  return null
}
