// Shape of a single submission returned by the upstream API.
// Both endpoints below return the same shape, except for the site identifier field:
//   - GET /api/citizens/submissions                        -> `researchSite`
//   - GET /api/citizens/user-generated-sites/all-submissions -> `userGeneratedSite`
export interface CitizenSubmission {
	id: number;
	longitude: number;
	latitude: number;
	userGeneratedSite: string; // `/api/citizens/user-generated-sites/all-submissions`
	// researchSite: string;   // `/api/citizens/submissions`
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
