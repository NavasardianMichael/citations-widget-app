export type SourceType = "bible" | "fiction";
export type SourceSelection = SourceType | "mixed" | "saved";
export type CitationStatus = "approved" | "pending" | "rejected" | "private";
export type FontStyle = "source_serif_4" | "hanken_grotesk";
export type RefreshRateHours = 6 | 12 | 24;

export type Citation = {
  id: string;
  text: string;
  author: string | null;
  sourceRef: string | null;
  sourceType: SourceType;
  tags: string[];
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
  currentCitationId: string | null;
  currentCitationSetAt: string | null;
  updatedAt: string;
};

export type WidgetSettingsDraft = Pick<
  WidgetSettings,
  "sourceSelection" | "refreshRateHours" | "fontStyle" | "showAttribution"
>;

export type WidgetPreviewDraft = Pick<WidgetSettings, "sourceSelection" | "fontStyle" | "showAttribution">;

export type UserProfile = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  socialUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateCitationInput = {
  text: string;
  author?: string;
  sourceRef?: string;
  sourceType: SourceType;
  shareProfile: boolean;
  visibility: "private" | "pending";
};

export type UpdateCitationInput = {
  text?: string;
  author?: string | null;
  sourceRef?: string | null;
  sourceType?: SourceType;
  tags?: string[];
  shareProfile?: boolean;
};

export type UpdateProfileInput = {
  firstName?: string | null;
  lastName?: string | null;
  socialUrl?: string | null;
};
