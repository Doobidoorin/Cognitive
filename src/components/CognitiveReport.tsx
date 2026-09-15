import { AssessmentReport, DIFFICULTY_LABELS, DIFFICULTIES, DOMAIN_LABELS, DOMAINS } from "@/lib/types";
import { BrainScale } from "@/components/BrainScale";

function formatMs(ms: number): string {
  return `${(ms / 1000).toFixed(2)}s`;
}

export function CognitiveReport({ report }: { report: AssessmentReport }) {
  return (
    <div className="flex flex-col gap-8">
      <div className="glass-panel-strong p-6 sm:p-10">
        <BrainScale score={report.overallScore} />
        <div className="mt-8 grid grid-cols-1 gap-4 text-center sm:grid-cols-3">
          <div className="glass-panel px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-sky-600">Classification</p>
            <p className="mt-1 text-lg font-bold text-sky-900">{report.classification}</p>
          </div>
          <div className="glass-panel px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-sky-600">Title</p>
            <p className="mt-1 text-lg font-bold text-sky-900">{report.title}</p>
          </div>
          <div className="glass-panel px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-sky-600">Type of Smart</p>
            <p className="mt-1 text-lg font-bold text-sky-900">{report.typeOfSmart}</p>
          </div>
        </div>
        <p className="mt-6 text-center text-xs text-sky-700/70">
          Type of Smart is a fun interpretation of your strongest results
        </p>
      </div>

      {/* Rank / percentile */}
      <div className="glass-panel grid grid-cols-2 gap-4 p-6 text-center sm:grid-cols-4">
        <Stat label="Rank" value={report.rank ? `#${report.rank}` : "—"} />
        <Stat label="Percentile" value={report.percentile ? `Top ${(100 - report.percentile).toFixed(1)}%` : "—"} />
        <Stat label="Overall accuracy" value={`${report.overallAccuracy}%`} />
        <Stat label="Participants" value={`${report.totalParticipants}`} />
      </div>

      {/* Domain breakdown */}
      <div className="glass-panel-strong p-6 sm:p-8">
        <h2 className="mb-4 text-lg font-bold text-sky-900">Performance by domain</h2>
        <div className="flex flex-col gap-4">
          {DOMAINS.map((d) => (
            <div key={d}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="font-semibold text-sky-900">{DOMAIN_LABELS[d]}</span>
                <span className="text-sky-700">
                  {report.domainRawCorrect[d]}/5 correct · {report.domainPercentages[d]}%
                </span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/50">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-sky-400 to-aero-leaf"
                  style={{ width: `${report.domainScores[d]}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Difficulty breakdown */}
      <div className="glass-panel-strong p-6 sm:p-8">
        <h2 className="mb-4 text-lg font-bold text-sky-900">Performance by difficulty</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-5">
          {DIFFICULTIES.map((diff) => {
            const agg = report.performanceByDifficulty[diff];
            return (
              <div key={diff} className="glass-panel px-3 py-4 text-center">
                <p className="text-xs font-semibold uppercase tracking-wide text-sky-600">
                  {DIFFICULTY_LABELS[diff]}
                </p>
                <p className="mt-1 text-xl font-bold text-sky-900">
                  {agg.correct}/{agg.total}
                </p>
                <p className="mt-1 text-xs text-sky-700">{formatMs(agg.avgTimeMs)} avg</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Speed stats */}
      <div className="glass-panel grid grid-cols-1 gap-4 p-6 text-center sm:grid-cols-3">
        <Stat label="Average response time" value={formatMs(report.avgResponseTimeMs)} />
        <Stat label="Fastest response" value={formatMs(report.fastestResponseMs)} />
        <Stat label="Slowest response" value={formatMs(report.slowestResponseMs)} />
      </div>

      <p className="text-center text-xs text-sky-700/70">
        Completed {new Date(report.completedAt).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}
        . Individual questions and answers are never shown, during or after the assessment.
      </p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-widest text-sky-600">{label}</p>
      <p className="mt-1 text-xl font-bold text-sky-900">{value}</p>
    </div>
  );
}
