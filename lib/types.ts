// Shape of a single submission returned by the upstream API.
// Both endpoints below return the same shape, except for the site identifier field:
//   - GET /api/citizens/submissions                        -> `researchSite`
//   - GET /api/citizens/user-generated-sites/all-submissions -> `userGeneratedSite`
// The two sets are merged server-side; `source` records which endpoint a row
// came from (used for filtering and marker shape).
export type SubmissionSource = 'research' | 'userGenerated';

export type SourceVisibility = Record<SubmissionSource, boolean>;

export interface CitizenSubmission {
	source: SubmissionSource;
	longitude: number;
	latitude: number;
	researchSite?: string | null; // `/api/citizens/submissions`
	userGeneratedSite?: string | null; // `/api/citizens/user-generated-sites/all-submissions`
	createdAt: string;
	user: string;
	upstreamPhoto?: string | null;
	downstreamPhoto?: string | null;
	surroundingPhoto?: string | null;
	interestingPhoto?: string | null;
	video?: string | null;
	channelForm?: string | null;
	bottomChannelType?: string | null;
	banksChannelType?: string | null;
	habitats?: string[];
	fallenBiomassTypes?: string[];
	waterFlow?: string | null;
	waterColor?: string | null;
	waterAbstraction?: boolean;
	hasDams?: boolean;
	numberOfDams?: number;
	pipes?: boolean;
	waterDischarge?: boolean;
	construction?: boolean;
	waterHeight?: number;
	imperviousAreasLeft?: boolean;
	imperviousAreasRight?: boolean;
	isVegetationCoveredLeft?: boolean;
	isVegetationCoveredRight?: boolean;
	vegetationTypeLeft?: string | null;
	vegetationTypeRight?: string | null;
	hasInvasivePlantSpecies?: boolean;
	invasivePlantSpecies?: string | null;
	recentVegetationCuts?: boolean;
	overallAssessment: string;
	joy?: number;
	serenity?: number;
	anger?: number;
	fear?: number;
}

export interface SourceStatus {
	updatedAt: string | null; // null = never successfully fetched
	ok: boolean; // false = the latest fetch attempt failed
}

// Shape returned by `GET /api/submissions` (our own route): the merged
// submissions plus the per-source fetch status.
export interface SubmissionsResponse {
	submissions: CitizenSubmission[];
	sources: Record<SubmissionSource, SourceStatus>;
}
