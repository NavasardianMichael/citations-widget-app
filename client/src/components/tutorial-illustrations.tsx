import Svg, { Circle, Line, Path, Rect } from 'react-native-svg'

/**
 * Schematic (not literal) diagrams for the add-widget tutorial — flat shapes in the app's
 * own palette rather than reproductions of real iOS/Android chrome, which would drift out
 * of sync with actual OS UI and risks misrepresenting a system we don't control.
 */

const CANVAS_W = 200
const CANVAS_H = 240
const DISPLAY_SIZE = { width: 180, height: 216 }
/** Compact phone diagram for the split long-press step. */
const DISPLAY_SIZE_COMPACT = { width: 132, height: 158 }

const PHONE_X = 30
const PHONE_Y = 6
const PHONE_W = 140
const PHONE_H = 228

const INK = '#021a35'
const ACCENT = '#fed65b'
const ACCENT_INK = '#735c00'
const LINE = '#c4c6ce'
const MUTED = '#44474d'
const SCREEN_BG = '#fbf9f8'
const CARD_BG = '#ffffff'
const ICON_BG = '#dfe2ea'

const decorative = {
  accessibilityElementsHidden: true,
  importantForAccessibility: 'no-hide-descendants' as const,
}

function PhoneOutline() {
  return (
    <>
      <Rect
        x={PHONE_X}
        y={PHONE_Y}
        width={PHONE_W}
        height={PHONE_H}
        rx={20}
        fill={SCREEN_BG}
        stroke={LINE}
        strokeWidth={3}
      />
      <Rect
        x={PHONE_X + PHONE_W / 2 - 16}
        y={PHONE_Y + 10}
        width={32}
        height={5}
        rx={2.5}
        fill={LINE}
      />
    </>
  )
}

function AppIconRow({ y }: { y: number }) {
  const size = 22
  const gap = 12
  const startX = PHONE_X + 16
  return (
    <>
      {[0, 1, 2, 3].map((i) => (
        <Rect
          key={i}
          x={startX + i * (size + gap)}
          y={y}
          width={size}
          height={size}
          rx={6}
          fill={ICON_BG}
        />
      ))}
    </>
  )
}

function WidgetCard({ y }: { y: number }) {
  const x = PHONE_X + 14
  const width = PHONE_W - 28
  const height = 86
  return (
    <>
      <Rect x={x} y={y} width={width} height={height} rx={10} fill={CARD_BG} stroke={LINE} strokeWidth={1.5} />
      <Rect x={x} y={y} width={4} height={height} rx={2} fill={ACCENT_INK} />
      <Rect x={x + 16} y={y + 18} width={width - 46} height={8} rx={4} fill={INK} opacity={0.75} />
      <Rect x={x + 16} y={y + 32} width={width - 66} height={8} rx={4} fill={INK} opacity={0.75} />
      <Rect x={x + 16} y={y + 62} width={width - 86} height={6} rx={3} fill={MUTED} opacity={0.6} />
    </>
  )
}

/** Step 0 — shared: what the widget looks like once it's on the home screen. */
export function WelcomeIllustration() {
  return (
    <Svg {...DISPLAY_SIZE} viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`} {...decorative}>
      <PhoneOutline />
      <AppIconRow y={PHONE_Y + 24} />
      <AppIconRow y={PHONE_Y + 58} />
      <WidgetCard y={PHONE_Y + 100} />
    </Svg>
  )
}

/** Step 1 (lower) — long-press an empty spot on the home screen. */
export function LongPressIllustration({
  compact = false,
}: {
  compact?: boolean
}) {
  const size = compact ? DISPLAY_SIZE_COMPACT : DISPLAY_SIZE
  const cx = PHONE_X + PHONE_W / 2
  const cy = PHONE_Y + 150
  return (
    <Svg {...size} viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`} {...decorative}>
      <PhoneOutline />
      <AppIconRow y={PHONE_Y + 24} />
      <AppIconRow y={PHONE_Y + 58} />
      <Circle cx={cx} cy={cy} r={34} stroke={ACCENT_INK} strokeWidth={2} strokeDasharray='4 6' fill='none' opacity={0.55} />
      <Circle cx={cx} cy={cy} r={20} stroke={ACCENT_INK} strokeWidth={2} strokeDasharray='4 6' fill='none' opacity={0.75} />
      <Circle cx={cx} cy={cy} r={9} fill={INK} />
    </Svg>
  )
}

/** Step 1 (upper) — easier path: long-press the app icon, then Widgets. */
export function AppIconLongPressIllustration({
  compact = false,
}: {
  compact?: boolean
}) {
  const size = compact ? DISPLAY_SIZE_COMPACT : DISPLAY_SIZE
  const iconSize = 22
  const gap = 12
  const startX = PHONE_X + 16
  const iconY = PHONE_Y + 58
  // Second icon in the second row — “our” app.
  const targetX = startX + 1 * (iconSize + gap)
  const cx = targetX + iconSize / 2
  const cy = iconY + iconSize / 2
  const menuX = PHONE_X + 28
  const menuY = iconY + iconSize + 10
  const menuW = PHONE_W - 56
  return (
    <Svg {...size} viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`} {...decorative}>
      <PhoneOutline />
      <AppIconRow y={PHONE_Y + 24} />
      <AppIconRow y={iconY} />
      {/* Highlight the target app icon */}
      <Rect
        x={targetX - 3}
        y={iconY - 3}
        width={iconSize + 6}
        height={iconSize + 6}
        rx={8}
        fill={ACCENT}
        opacity={0.35}
      />
      <Rect
        x={targetX}
        y={iconY}
        width={iconSize}
        height={iconSize}
        rx={6}
        fill={ACCENT}
        stroke={ACCENT_INK}
        strokeWidth={1.5}
      />
      <Circle cx={cx} cy={cy} r={28} stroke={ACCENT_INK} strokeWidth={2} strokeDasharray='4 6' fill='none' opacity={0.55} />
      <Circle cx={cx} cy={cy} r={16} stroke={ACCENT_INK} strokeWidth={2} strokeDasharray='4 6' fill='none' opacity={0.75} />
      {/* Shortcut menu with Widgets row highlighted */}
      <Rect x={menuX} y={menuY} width={menuW} height={72} rx={10} fill={CARD_BG} stroke={LINE} strokeWidth={1.5} />
      <Rect x={menuX + 8} y={menuY + 8} width={menuW - 16} height={18} rx={4} fill={ICON_BG} />
      <Rect x={menuX + 8} y={menuY + 30} width={menuW - 16} height={18} rx={4} fill={ACCENT} />
      <Rect x={menuX + 8} y={menuY + 52} width={menuW - 16} height={12} rx={4} fill={ICON_BG} />
      <Circle cx={cx} cy={cy} r={7} fill={INK} />
    </Svg>
  )
}

/** iOS step 2 — tap the "+" button in the top corner to open the widget gallery. */
export function IosAddButtonIllustration() {
  const bx = PHONE_X + 24
  const by = PHONE_Y + 30
  return (
    <Svg {...DISPLAY_SIZE} viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`} {...decorative}>
      <PhoneOutline />
      <AppIconRow y={PHONE_Y + 68} />
      <AppIconRow y={PHONE_Y + 102} />
      <Circle cx={bx} cy={by} r={22} stroke={ACCENT_INK} strokeWidth={1.5} strokeDasharray='3 5' fill='none' opacity={0.5} />
      <Circle cx={bx} cy={by} r={16} fill={ACCENT} stroke={ACCENT_INK} strokeWidth={1.5} />
      <Rect x={bx - 7} y={by - 1.5} width={14} height={3} rx={1.5} fill={ACCENT_INK} />
      <Rect x={bx - 1.5} y={by - 7} width={3} height={14} rx={1.5} fill={ACCENT_INK} />
    </Svg>
  )
}

/** iOS step 3 — search for the app, swipe through sizes, tap "Add Widget". */
export function IosChooseSizeIllustration() {
  return (
    <Svg {...DISPLAY_SIZE} viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`} {...decorative}>
      <Rect x={20} y={70} width={50} height={50} rx={8} fill={CARD_BG} stroke={LINE} strokeWidth={2} />
      <Rect x={80} y={60} width={100} height={50} rx={8} fill={CARD_BG} stroke={ACCENT_INK} strokeWidth={3} />
      <Rect x={92} y={72} width={60} height={7} rx={3.5} fill={INK} opacity={0.75} />
      <Rect x={92} y={86} width={44} height={7} rx={3.5} fill={MUTED} opacity={0.55} />
      <Circle cx={168} cy={60} r={10} fill={ACCENT_INK} />
      <Path d='M163 60 l3.5 3.5 l7 -7' stroke={CARD_BG} strokeWidth={2.2} fill='none' strokeLinecap='round' strokeLinejoin='round' />
      <Rect x={20} y={132} width={160} height={56} rx={8} fill={CARD_BG} stroke={LINE} strokeWidth={2} />
      <Rect x={55} y={206} width={90} height={26} rx={13} fill={INK} />
    </Svg>
  )
}

/** iOS step 4 — drag to position, tap "Done". */
export function IosPlaceDoneIllustration() {
  return (
    <Svg {...DISPLAY_SIZE} viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`} {...decorative}>
      <PhoneOutline />
      <AppIconRow y={PHONE_Y + 24} />
      <WidgetCard y={PHONE_Y + 60} />
      <AppIconRow y={PHONE_Y + 162} />
      <Circle cx={PHONE_X + PHONE_W - 10} cy={PHONE_Y + 16} r={13} fill={ACCENT} stroke={ACCENT_INK} strokeWidth={1.5} />
      <Path
        d={`M${PHONE_X + PHONE_W - 16} ${PHONE_Y + 16} l4 4 l8 -8`}
        stroke={ACCENT_INK}
        strokeWidth={2.4}
        fill='none'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </Svg>
  )
}

/** Android step 2 — the long-press popup menu, with "Widgets" highlighted. */
export function AndroidWidgetsMenuIllustration() {
  const menuX = PHONE_X + 20
  const menuY = PHONE_Y + 66
  const menuW = PHONE_W - 40
  return (
    <Svg {...DISPLAY_SIZE} viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`} {...decorative}>
      <PhoneOutline />
      <AppIconRow y={PHONE_Y + 24} />
      <Rect x={menuX} y={menuY} width={menuW} height={92} rx={10} fill={CARD_BG} stroke={LINE} strokeWidth={1.5} />
      <Rect x={menuX + 10} y={menuY + 10} width={menuW - 20} height={22} rx={5} fill={ICON_BG} />
      <Rect x={menuX + 10} y={menuY + 38} width={menuW - 20} height={22} rx={5} fill={ACCENT} />
      <Rect x={menuX + 10} y={menuY + 66} width={menuW - 20} height={22} rx={5} fill={ICON_BG} />
      <Circle cx={PHONE_X + PHONE_W / 2} cy={PHONE_Y + 192} r={8} fill={INK} opacity={0.85} />
      <Circle cx={PHONE_X + PHONE_W / 2} cy={PHONE_Y + 192} r={18} stroke={ACCENT_INK} strokeWidth={2} strokeDasharray='3 5' fill='none' opacity={0.55} />
    </Svg>
  )
}

/** Android step 3 — long-press the widget preview in the picker tray and drag it up. */
export function AndroidDragIllustration() {
  const trayY = PHONE_Y + PHONE_H - 46
  return (
    <Svg {...DISPLAY_SIZE} viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`} {...decorative}>
      <PhoneOutline />
      <AppIconRow y={PHONE_Y + 22} />
      <Rect
        x={PHONE_X + 20}
        y={PHONE_Y + 54}
        width={PHONE_W - 40}
        height={60}
        rx={10}
        stroke={ACCENT_INK}
        strokeWidth={2}
        strokeDasharray='5 5'
        fill='none'
      />
      <Rect x={PHONE_X + 10} y={trayY} width={PHONE_W - 20} height={38} rx={8} fill={CARD_BG} stroke={LINE} strokeWidth={1.5} />
      <Rect x={PHONE_X + 20} y={trayY + 8} width={22} height={22} rx={5} fill={ACCENT} />
      <Rect x={PHONE_X + 50} y={trayY + 11} width={PHONE_W - 90} height={6} rx={3} fill={MUTED} opacity={0.6} />
      <Rect x={PHONE_X + 50} y={trayY + 23} width={(PHONE_W - 90) * 0.6} height={6} rx={3} fill={LINE} />
      <Line
        x1={PHONE_X + 40}
        y1={trayY - 4}
        x2={PHONE_X + 62}
        y2={PHONE_Y + 116}
        stroke={ACCENT_INK}
        strokeWidth={2.5}
        strokeDasharray='2 6'
        strokeLinecap='round'
      />
      <Path d={`M${PHONE_X + 62} ${PHONE_Y + 116} l -8 -3 l 2 9 z`} fill={ACCENT_INK} />
    </Svg>
  )
}

/** Android step 4 — long-press the placed widget, drag the corner handles to resize. */
export function AndroidResizeIllustration() {
  const cardX = PHONE_X + 14
  const cardY = PHONE_Y + 76
  const cardW = PHONE_W - 28
  const cardH = 86
  const handle = 10
  const corners: [number, number][] = [
    [cardX, cardY],
    [cardX + cardW, cardY],
    [cardX, cardY + cardH],
    [cardX + cardW, cardY + cardH],
  ]
  return (
    <Svg {...DISPLAY_SIZE} viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`} {...decorative}>
      <PhoneOutline />
      <AppIconRow y={PHONE_Y + 24} />
      <Rect x={cardX} y={cardY} width={cardW} height={cardH} rx={10} fill={CARD_BG} stroke={ACCENT_INK} strokeWidth={2} strokeDasharray='4 4' />
      <Rect x={cardX} y={cardY} width={4} height={cardH} rx={2} fill={ACCENT_INK} opacity={0.6} />
      <Rect x={cardX + 16} y={cardY + 16} width={cardW - 48} height={8} rx={4} fill={INK} opacity={0.7} />
      <Rect x={cardX + 16} y={cardY + 32} width={cardW - 70} height={8} rx={4} fill={MUTED} opacity={0.5} />
      {corners.map(([hx, hy], i) => (
        <Rect
          key={i}
          x={hx - handle / 2}
          y={hy - handle / 2}
          width={handle}
          height={handle}
          rx={3}
          fill={ACCENT}
          stroke={ACCENT_INK}
          strokeWidth={1.5}
        />
      ))}
      <AppIconRow y={PHONE_Y + 178} />
    </Svg>
  )
}
