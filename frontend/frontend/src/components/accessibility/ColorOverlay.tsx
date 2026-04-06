import { useAccessibilityStore } from '../../stores/accessibilityStore'

const OVERLAY_COLORS: Record<string, string> = {
  none:     'transparent',
  cream:    'rgba(255, 253, 245, VAR)',
  yellow:   'rgba(255, 247, 150, VAR)',
  blue:     'rgba(173, 216, 230, VAR)',
  mint:     'rgba(152, 251, 152, VAR)',
  pink:     'rgba(255, 228, 225, VAR)',
  rose:     'rgba(255, 182, 193, VAR)',
  lavender: 'rgba(230, 190, 255, VAR)',
  peach:    'rgba(255, 218, 185, VAR)',
  lime:     'rgba(200, 255, 150, VAR)',
}

/**
 * Full-viewport color overlay for visual stress reduction.
 * pointer-events: none means it never blocks clicks.
 * Research: ~39% of dyslexic readers benefit from tinted overlays (Wilkins et al., 2004).
 * 
 * This renders at the App root level above all content.
 * It does not wrap content — it floats above it.
 */
export default function ColorOverlay() {
  const { colorOverlay, overlayOpacity } = useAccessibilityStore()

  if (colorOverlay === 'none') return null

  const baseColor = OVERLAY_COLORS[colorOverlay]
  if (!baseColor) return null;

  const color = baseColor.replace('VAR', String(overlayOpacity))

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: color,
        pointerEvents: 'none',
        zIndex: 9998,
        mixBlendMode: 'multiply',
      }}
      aria-hidden="true"
    />
  )
}
