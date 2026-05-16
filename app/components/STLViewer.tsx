"use client"
import { useEffect, useRef } from "react"
import * as THREE from "three"
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js"

interface STLViewerProps {
  url: string
}

export default function STLViewer({ url }: STLViewerProps) {
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = mountRef.current
    if (!container) return

    const width = container.clientWidth || 500
    const height = 320

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x111827)

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.01, 1000)
    camera.position.set(0, 0, 5)

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(window.devicePixelRatio)
    container.appendChild(renderer.domElement)

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
    scene.add(ambientLight)
    const dirLight = new THREE.DirectionalLight(0x3b82f6, 2)
    dirLight.position.set(5, 10, 5)
    scene.add(dirLight)
    const dirLight2 = new THREE.DirectionalLight(0xffffff, 0.8)
    dirLight2.position.set(-5, -5, -5)
    scene.add(dirLight2)

    let mesh: THREE.Mesh | null = null
    let animId: number
    let autoRotate = true

    const loader = new STLLoader()
    loader.load(
      url,
      (geometry) => {
        geometry.computeBoundingBox()
        const box = geometry.boundingBox!
        const center = new THREE.Vector3()
        box.getCenter(center)
        geometry.translate(-center.x, -center.y, -center.z)

        const size = new THREE.Vector3()
        box.getSize(size)
        const maxDim = Math.max(size.x, size.y, size.z)
        camera.position.z = maxDim * 2.2

        const material = new THREE.MeshPhongMaterial({
          color: 0x3b82f6,
          specular: 0x222222,
          shininess: 150,
        })
        mesh = new THREE.Mesh(geometry, material)
        scene.add(mesh)

        const animate = () => {
          animId = requestAnimationFrame(animate)
          if (mesh && autoRotate) mesh.rotation.y += 0.008
          renderer.render(scene, camera)
        }
        animate()
      },
      undefined,
      () => {
        const animate = () => {
          animId = requestAnimationFrame(animate)
          renderer.render(scene, camera)
        }
        animate()
      }
    )

    let isDragging = false
    let prevX = 0
    let prevY = 0

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true
      autoRotate = false
      prevX = e.clientX
      prevY = e.clientY
    }
    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging || !mesh) return
      const dx = e.clientX - prevX
      const dy = e.clientY - prevY
      mesh.rotation.y += dx * 0.01
      mesh.rotation.x += dy * 0.01
      prevX = e.clientX
      prevY = e.clientY
    }
    const onMouseUp = () => { isDragging = false }

    renderer.domElement.addEventListener("mousedown", onMouseDown)
    window.addEventListener("mousemove", onMouseMove)
    window.addEventListener("mouseup", onMouseUp)

    return () => {
      cancelAnimationFrame(animId)
      renderer.domElement.removeEventListener("mousedown", onMouseDown)
      window.removeEventListener("mousemove", onMouseMove)
      window.removeEventListener("mouseup", onMouseUp)
      renderer.dispose()
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement)
      }
    }
  }, [url])

  return (
    <div className="w-full rounded-xl overflow-hidden border border-blue-500/20">
      <div ref={mountRef} className="w-full" style={{ height: 320 }} />
      <p className="text-center text-gray-500 text-xs py-2">Ziehen zum Drehen</p>
    </div>
  )
}
