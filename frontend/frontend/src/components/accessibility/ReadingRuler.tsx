import { useState, useEffect, useRef } from 'react'
import { useAccessibilityStore } from '../../stores/accessibilityStore'

/**
 * A horizontal reading guide band that follows the mouse/touch Y position.
 * Helps dyslexic readers track their place on the page.
 * pointer-events: none — never blocks any interaction.
 * 
 * Activated via accessibilityStore.rulerEnabled.
 * User drags it by touching the ruler itself (we capture the touch on a
 * thin visible handle at the top edge of the band).
 */
export default function ReadingRuler() {
  const { rulerEnabled, colorOverlay } = useAccessibilityStore()
  const [yPos, setYPos] = useState(200)
  const dragging = useRef(false)

  useEffect(() => {
    if (!rulerEnabled) return

    const onMouseMove = (e: MouseEvent) => {
      if (dragging.current) setYPos(e.clientY - 20)
    }
    const onTouchMove = (e: TouchEvent) => {
      if (dragging.current) setYPos(e.touches[0].clientY - 20)
    }
    const onUp = () => { dragging.current = false }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('touchmove', onTouchMove)
    window.addEventListener('mouseup', onUp)
    window.addEventListener('touchend', onUp)

    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('mouseup', onUp)
      window.removeEventListener('touchend', onUp)
    }
  }, [rulerEnabled])

  if (!rulerEnabled) return null

  // Ruler color contrasts with the overlay if one is active
  const rulerColor = colorOverlay === 'yellow'
    ? 'rgba(180, 220, 255, 0.35)'
    : 'rgba(255, 255, 180, 0.35)'

  return (
    <div
      style={{
        position: 'fixed',
        left: 0,
        right: 0,
        top: yPos,
        height: 48,
        backgroundColor: rulerColor,
        border: '1px solid rgba(0,0,0,0.08)',
        pointerEvents: 'none',
        zIndex: 9997,
        borderRadius: 2,
      }}
      aria-hidden="true"
    >
      {/* Drag handle — this thin strip has pointer events so user can grab it */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 8,
          cursor: 'ns-resize',
          pointerEvents: 'all',
          borderRadius: '2px 2px 0 0',
          background: 'rgba(0,0,0,0.1)',
        }}
        onMouseDown={() => { dragging.current = true }}
        onTouchStart={() => { dragging.current = true }}
      />
    </div>
  )
}
