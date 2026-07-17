export type CitationCategory = "bible" | "fiction";
export type SourceSelection = CitationCategory | "mixed" | "saved";
export type CitationStatus = "approved" | "pending" | "rejected" | "private";
import type { WidgetFontId } from "@/fonts/registry";

export type FontStyle = WidgetFontId;
export type RefreshRateHours = 6 | 12 | 24;

export type Citation = {
  id: string;
  text: string;
  author: string | null;
  source: string | null;
  category: CitationCategory;
  createdAt?: string;
};

export type OwnedCitation = Citation & {
  status: CitationStatus;
  shareProfile: boolean;
  moderatorNote: string | null;
  removableOnRequest: boolean;
  updatedAt?: string;
};

export type WidgetCitation = Citation & {
  addedBy: string | null;
};

export type WidgetSettings = {
  userId: string;
  sourceSelection: SourceSelection;
  refreshRateHours: RefreshRateHours;
  fontStyle: FontStyle;
  showAttribution: boolean;
  showActions: boolean;
  currentCitationId: string | null;
  currentCitationSetAt: string | null;
  updatedAt: string;
};

export type WidgetSettingsDraft = Pick<
  WidgetSettings,
  "sourceSelection" | "refreshRateHours" | "fontStyle" | "showAttribution" | "showActions"
>;

export type WidgetPreviewDraft = Pick<WidgetSettings, "sourceSelection" | "fontStyle" | "showAttribution">;

export type UserProfile = {
  id: string;
  email?: string;
  name?: string;
  firstName: string | null;
  lastName: string | null;
  socialUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateCitationInput = {
  text: string;
  author?: string;
  source?: string;
  category: CitationCategory;
  shareProfile: boolean;
  visibility: "private" | "pending";
};

export type UpdateCitationInput = {
  text?: string;
  author?: string | null;
  source?: string | null;
  category?: CitationCategory;
  shareProfile?: boolean;
};

export type UpdateProfileInput = {
  firstName?: string | null;
  lastName?: string | null;
  socialUrl?: string | null;
};
