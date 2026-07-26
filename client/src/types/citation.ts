import type { WidgetDesignId } from '@/constants/widget-designs'
import type { WidgetFontId } from '@/fonts/registry'

export type CitationCategory = 'bible' | 'fiction'
export type SourceSelection = CitationCategory | 'mixed' | 'saved'
export type CitationStatus = 'approved' | 'pending' | 'rejected' | 'private'

export type FontStyle = WidgetFontId
export type RefreshRateHours = 6 | 12 | 24
export type { WidgetDesignId }

export type Citation = {
  id: string
  text: string
  source: string
  category: CitationCategory
  createdAt?: string
}

export type OwnedCitation = Citation & {
  status: CitationStatus
  moderatorNote: string | null
  removableOnRequest: boolean
  updatedAt?: string
}

export type WidgetCitation = Citation & {
  addedBy: string | null
  /**
   * Ephemeral display index into WIDGET_BACKGROUND_IMAGES for the sanctuary
   * (random) design only — not a permanent property of the citation.
   */
  backgroundImageIndex?: number
}

export type WidgetSettings = {
  userId: string
  sourceSelection: SourceSelection
  refreshRateHours: RefreshRateHours
  fontStyle: FontStyle
  fontSize: number
  widgetDesign: WidgetDesignId
  showAttribution: boolean
  showActions: boolean
  currentCitationId: string | null
  currentCitationSetAt: string | null
  /** Current sanctuary random pick for this citation window (not citation-owned). */
  currentBackgroundImageIndex?: number
  updatedAt: string
}

export type WidgetSettingsDraft = Pick<
  WidgetSettings,
  | 'sourceSelection'
  | 'refreshRateHours'
  | 'fontStyle'
  | 'fontSize'
  | 'widgetDesign'
  | 'showAttribution'
  | 'showActions'
>

export type WidgetPreviewDraft = Pick<
  WidgetSettings,
  'sourceSelection' | 'fontStyle' | 'widgetDesign' | 'showAttribution'
>

export type UserProfile = {
  id: string
  email?: string
  name: string
  socialUrl: string | null
  shareProfile: boolean
  avatarUrl: string | null
  createdAt: string
  updatedAt: string
}

export type CreateCitationInput = {
  text: string
  source: string
  category: CitationCategory
  visibility: 'private' | 'pending'
}

export type UpdateCitationInput = {
  text?: string
  source?: string
  category?: CitationCategory
}

export type UpdateProfileInput = {
  name?: string
  socialUrl?: string | null
  shareProfile?: boolean
}
