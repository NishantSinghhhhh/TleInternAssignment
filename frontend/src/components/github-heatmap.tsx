// components/github-heatmap.tsx
"use client"

interface HeatmapDay {
  date: string
  count: number
  dayOfWeek: number
  isInRange: boolean
  month: number
  day: number
}

interface HeatmapData {
  weeks: HeatmapDay[][]
  monthLabels: Array<{
    month: string
    weekIndex: number
  }>
  totalContributions: number
  maxCount: number
}

interface GitHubHeatmapProps {
  data: HeatmapData
  filterDays: number
}

export function GitHubHeatmap({ data, filterDays }: GitHubHeatmapProps) {
  const getIntensityClass = (count: number, maxCount: number, isInRange: boolean) => {
    if (!isInRange || count === 0) return "bg-accent opacity-30"

    // intensity 1–4 based on count/maxCount
    const intensity = Math.min(Math.ceil((count / Math.max(maxCount, 1)) * 4), 4)
    switch (intensity) {
      case 1: return "bg-green-200 dark:bg-green-800"
      case 2: return "bg-green-400 dark:bg-green-600"
      case 3: return "bg-green-600 dark:bg-green-400"
      case 4: return "bg-green-800 dark:bg-green-200"
      default: return "bg-accent opacity-30"
    }
  }

  const dayLabels = [
    { label: "", index: 0 },
    { label: "Mon", index: 1 },
    { label: "", index: 2 },
    { label: "Wed", index: 3 },
    { label: "", index: 4 },
    { label: "Fri", index: 5 },
    { label: "", index: 6 },
  ]

  return (
    <div className="bg-muted/30 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground flex items-center">
          Submission Activity
        </h3>
        <div className="text-sm text-muted-foreground">
          {data.totalContributions} problems in last {filterDays} days
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          {/* Month labels */}
          <div className="flex mb-3">
            <div className="w-12" /> {/* space for day labels */}
            <div className="flex-1 relative">
              {data.monthLabels.map((monthLabel, i) => (
                <div
                  key={i}
                  className="absolute text-xs text-muted-foreground font-medium"
                  style={{
                    left: `${monthLabel.weekIndex * 14}px`,
                    top: "0px",
                  }}
                >
                  {monthLabel.month}
                </div>
              ))}
            </div>
          </div>

          {/* Calendar grid */}
          <div className="flex">
            {/* Day labels */}
            <div className="flex flex-col mr-3">
              {dayLabels.map((day, i) => (
                <div
                  key={i}
                  className="h-3 flex items-center justify-end text-xs text-muted-foreground mb-1"
                  style={{ minWidth: "28px" }}
                >
                  {day.label}
                </div>
              ))}
            </div>

            {/* Heatmap squares */}
            <div className="flex gap-1">
              {data.weeks.map((week, wi) => (
                <div key={wi} className="flex flex-col gap-1">
                  {week.map((day, di) => (
                    <div
                      key={di}
                      className={`
                        w-3 h-3 rounded-sm transition-colors hover:ring-1 hover:ring-accent
                        ${getIntensityClass(day.count, data.maxCount, day.isInRange)}
                        ${day.isInRange ? "cursor-pointer" : ""}
                      `}
                      title={
                        day.isInRange
                          ? `${day.date}: ${day.count} ${day.count === 1 ? "problem" : "problems"}`
                          : ""
                      }
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-between mt-4 text-xs text-muted-foreground">
            <span>Less</span>
            <div className="flex items-center gap-1 mx-2">
              {[0, 1, 2, 3, 4].map((lvl) => {
                const cls =
                  lvl === 0
                    ? "bg-accent"
                    : lvl === 1
                    ? "bg-green-200 dark:bg-green-800"
                    : lvl === 2
                    ? "bg-green-400 dark:bg-green-600"
                    : lvl === 3
                    ? "bg-green-600 dark:bg-green-400"
                    : "bg-green-800 dark:bg-green-200"
                return <div key={lvl} className={`w-3 h-3 rounded-sm ${cls}`} />
              })}
            </div>
            <span>More</span>
          </div>

          {/* Streak stats */}
          <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Longest streak:{" "}
              {(() => {
                let max = 0,
                  curr = 0
                const all = data.weeks
                  .flat()
                  .filter((d) => d.isInRange)
                  .sort((a, b) => a.date.localeCompare(b.date))
                all.forEach((d) => {
                  if (d.count > 0) curr++, (max = Math.max(max, curr))
                  else curr = 0
                })
                return max
              })()}{" "}
              days
            </span>
            <span>
              Current streak:{" "}
              {(() => {
                let curr = 0
                const all = data.weeks
                  .flat()
                  .filter((d) => d.isInRange)
                  .sort((a, b) => b.date.localeCompare(a.date))
                for (const d of all) {
                  if (d.count > 0) curr++
                  else break
                }
                return curr
              })()}{" "}
              days
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
