import { useRef, useState } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export const DragCameraControls = () => {
  const { camera, gl } = useThree()
  const dragging = useRef(false)
  const lastPointer = useRef<[number, number] | null>(null)
  const velocity = useRef(new THREE.Vector2(0, 0))
  const damping = 0.9

  useFrame(() => {
    // Apply camera velocity for momentum
    camera.lookAt(camera.position.x, 7, camera.position.z)
    if (!dragging.current) {
      camera.position.x += velocity.current.x
      camera.position.z += velocity.current.y
      velocity.current.multiplyScalar(damping)
    }
  })

  const onPointerDown = (e: PointerEvent) => {
    dragging.current = true
    lastPointer.current = [e.clientX, e.clientY]
  }

  const onPointerMove = (e: PointerEvent) => {
    if (!dragging.current || !lastPointer.current) return

    const [lastX, lastY] = lastPointer.current
    const deltaX = e.clientX - lastX
    const deltaY = e.clientY - lastY

    // Adjust sensitivity here
    const speed = 0.05
    camera.position.x -= deltaX * speed
    camera.position.z -= deltaY * speed

    velocity.current.set(-deltaX * speed, -deltaY * speed)
    lastPointer.current = [e.clientX, e.clientY]
  }

  const onPointerUp = () => {
    dragging.current = false
    lastPointer.current = null
  }

  // Attach events to canvas DOM
  useState(() => {
    gl.domElement.addEventListener('pointerdown', onPointerDown)
    gl.domElement.addEventListener('pointermove', onPointerMove)
    gl.domElement.addEventListener('pointerup', onPointerUp)
    gl.domElement.addEventListener('pointerleave', onPointerUp)

    return () => {
      gl.domElement.removeEventListener('pointerdown', onPointerDown)
      gl.domElement.removeEventListener('pointermove', onPointerMove)
      gl.domElement.removeEventListener('pointerup', onPointerUp)
      gl.domElement.removeEventListener('pointerleave', onPointerUp)
    }
  })

  return null
}
