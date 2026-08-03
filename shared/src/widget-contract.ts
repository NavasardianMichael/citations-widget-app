/**
 * API / widget settings contract shared by the Expo client and Express server.
 * Keep UI controls, Zod validation, and Prisma enums aligned with these values.
 */

/** Typography range for Settings → Typography and PUT /widget-settings. */
export const FONT_SIZE_MIN = 10
export const FONT_SIZE_MAX = 40
export const DEFAULT_QUOTE_FONT_SIZE = 24

export const WIDGET_DESIGN_IDS = [
  'classic',
  'parchment',
  'midnight',
  'noir',
  'frost',
  'sanctuary',
] as const

export type WidgetDesignId = (typeof WIDGET_DESIGN_IDS)[number]

export const DEFAULT_WIDGET_DESIGN: WidgetDesignId = 'sanctuary'

/** Sole photo design — rolls a fresh image from the sanctuary pool per new citation. */
export const RANDOM_BACKGROUND_DESIGN: WidgetDesignId = 'sanctuary'

/**
 * Length of the client's `WIDGET_BACKGROUND_IMAGES` sanctuary pool.
 * Server uses this when picking `currentBackgroundImageIndex`.
 */
export const WIDGET_BACKGROUND_IMAGE_COUNT = 25

/** Must stay aligned with Prisma `FontStyle` and client `WIDGET_FONT_OPTIONS`. */
export const FONT_STYLE_IDS = [
  'vrdznagir',
  'braind_amanor',
  'artsakh',
  'davel_aghvor',
  'mardoto',
  'arti',
  'arian_grqi',
  'braind_zbans',
  'nortar_body',
  'arm_hmks_script',
  'noyemi',
  'armeniapedia_garun',
  'armeniapedia_geghagrutyun',
  'sasuntsi',
  'armeniapedia_jhapaven',
] as const

export type FontStyleId = (typeof FONT_STYLE_IDS)[number]

export const DEFAULT_FONT_STYLE: FontStyleId = 'davel_aghvor'

/** Must stay aligned with Prisma `SourceSelection`. */
export const SOURCE_SELECTION_IDS = [
  'bible',
  'fiction',
  'mixed',
  'saved',
] as const

export type SourceSelectionId = (typeof SOURCE_SELECTION_IDS)[number]

export const DEFAULT_SOURCE_SELECTION: SourceSelectionId = 'bible'

export const REFRESH_RATE_HOURS = [6, 12, 24] as const

export type RefreshRateHours = (typeof REFRESH_RATE_HOURS)[number]
