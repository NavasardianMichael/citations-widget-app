import type { WidgetFontId } from '@/fonts/registry'

export type CitationCategory = 'bible' | 'fiction'
export type SourceSelection = CitationCategory | 'mixed' | 'saved'
export type CitationStatus = 'approved' | 'pending' | 'rejected' | 'private'

export type FontStyle = WidgetFontId
export type RefreshRateHours = 6 | 12 | 24

export type Citation = {
  id: string
  text: string
  source: string
  category: CitationCategory
  createdAt?: string
}

export type OwnedCitation = Citation & {
  status: CitationStatus
  shareProfile: boolean
  moderatorNote: string | null
  removableOnRequest: boolean
  updatedAt?: string
}

export type WidgetCitation = Citation & {
  addedBy: string | null
  /** Which of WIDGET_BACKGROUND_IMAGES this pick uses — kept stable until the next fetch. */
  backgroundImageIndex: number
}

export type WidgetSettings = {
  userId: string
  sourceSelection: SourceSelection
  refreshRateHours: RefreshRateHours
  fontStyle: FontStyle
  fontSize: number
  showAttribution: boolean
  showActions: boolean
  currentCitationId: string | null
  currentCitationSetAt: string | null
  updatedAt: string
}

export type WidgetSettingsDraft = Pick<
  WidgetSettings,
  | 'sourceSelection'
  | 'refreshRateHours'
  | 'fontStyle'
  | 'fontSize'
  | 'showAttribution'
  | 'showActions'
>

export type WidgetPreviewDraft = Pick<
  WidgetSettings,
  'sourceSelection' | 'fontStyle' | 'showAttribution'
>

export type UserProfile = {
  id: string
  email?: string
  name: string
  socialUrl: string | null
  avatarUrl: string | null
  createdAt: string
  updatedAt: string
}

export type CreateCitationInput = {
  text: string
  source: string
  category: CitationCategory
  shareProfile: boolean
  visibility: 'private' | 'pending'
}

export type UpdateCitationInput = {
  text?: string
  source?: string
  category?: CitationCategory
  shareProfile?: boolean
}

export type UpdateProfileInput = {
  name?: string
  socialUrl?: string | null
}
