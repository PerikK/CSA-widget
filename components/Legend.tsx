import { ASSESSMENT_META } from "@/lib/assessment";

export default function Legend() {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white/90 px-3 py-2 shadow-sm backdrop-blur dark:border-zinc-700 dark:bg-zinc-900/90">
      <div className="font-semibold pb-3">Overall Assessment</div>
      <div className="flex flex-col gap-1.5 text-xs text-zinc-700 dark:text-zinc-200">
        {(["good", "moderate", "poor"] as const).map((key) => (
          <div key={key} className="flex items-center gap-2">
            <span
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: ASSESSMENT_META[key].color }}
            />
            {ASSESSMENT_META[key].label}
          </div>
        ))}
      </div>
    </div>
  );
}
