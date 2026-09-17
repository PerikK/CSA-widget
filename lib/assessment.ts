// Color coding for the "overallAssessment" field.
// Upstream sends all-caps values (GOOD / MODERATE / POOR), but we match
// case-insensitively so any casing resolves to the same level.
export type AssessmentKey = "good" | "moderate" | "poor" | "unknown";

export const ASSESSMENT_META: Record<
  AssessmentKey,
  { label: string; color: string }
> = {
  good: { label: "Good", color: "#16a34a" },
  moderate: { label: "Moderate", color: "#f59e0b" },
  poor: { label: "Poor", color: "#dc2626" },
  unknown: { label: "Unknown", color: "#6b7280" },
};

export function assessmentKey(value: string | null | undefined): AssessmentKey {
  switch ((value ?? "").trim().toLowerCase()) {
    case "good":
      return "good";
    case "moderate":
      return "moderate";
    case "poor":
      return "poor";
    default:
      return "unknown";
  }
}

export function assessmentMeta(value: string | null | undefined) {
  return ASSESSMENT_META[assessmentKey(value)];
}
