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
    if (!isInRange || count === 0) return 'bg-gray-100'
    
    // Calculate intensity level (1-4 based on count relative to max)
    const intensity = Math.min(Math.ceil((count / Math.max(maxCount, 1)) * 4), 4)
    
    switch (intensity) {
      case 1: return 'bg-green-200'
      case 2: return 'bg-green-400' 
      case 3: return 'bg-green-600'
      case 4: return 'bg-green-800'
      default: return 'bg-gray-100'
    }
  }

  const dayLabels = [
    { label: '', index: 0 }, // Sunday
    { label: 'Mon', index: 1 },
    { label: '', index: 2 }, // Tuesday  
    { label: 'Wed', index: 3 },
    { label: '', index: 4 }, // Thursday
    { label: 'Fri', index: 5 },
    { label: '', index: 6 }  // Saturday
  ]

  return (
    <div className="bg-gray-50 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center">
          Submission Activity
        </h3>
        <div className="text-sm text-gray-600">
          {data.totalContributions} problems in last {filterDays} days
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          {/* Month labels */}
          <div className="flex mb-3">
            <div className="w-12"></div> {/* Space for day labels */}
            <div className="flex-1 relative">
              {data.monthLabels.map((monthLabel, index) => (
                <div
                  key={index}
                  className="absolute text-xs text-gray-600 font-medium"
                  style={{
                    left: `${monthLabel.weekIndex * 14}px`,
                    top: '0px'
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
              {dayLabels.map((dayLabel, index) => (
                <div
                  key={index}
                  className="h-3 flex items-center justify-end text-xs text-gray-600 mb-1"
                  style={{ minWidth: '28px' }}
                >
                  {dayLabel.label}
                </div>
              ))}
            </div>
            
            {/* Heatmap grid */}
            <div className="flex gap-1">
              {data.weeks.map((week, weekIndex) => (
                <div key={weekIndex} className="flex flex-col gap-1">
                  {week.map((day, dayIndex) => (
                    <div
                      key={dayIndex}
                      className={`w-3 h-3 rounded-sm transition-colors hover:ring-1 hover:ring-gray-400 ${
                        getIntensityClass(day.count, data.maxCount, day.isInRange)
                      } ${!day.isInRange ? 'opacity-30' : 'cursor-pointer'}`}
                      title={
                        day.isInRange && day.date
                          ? `${day.date}: ${day.count} ${day.count === 1 ? 'problem' : 'problems'}`
                          : ''
                      }
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
          
          {/* Legend */}
          <div className="flex items-center justify-between mt-4 text-xs text-gray-600">
            <span>Less</span>
            <div className="flex items-center gap-1 mx-2">
              {[0, 1, 2, 3, 4].map((level) => (
                <div
                  key={level}
                  className={`w-3 h-3 rounded-sm ${
                    level === 0 ? 'bg-gray-100' :
                    level === 1 ? 'bg-green-200' :
                    level === 2 ? 'bg-green-400' :
                    level === 3 ? 'bg-green-600' : 'bg-green-800'
                  }`}
                />
              ))}
            </div>
            <span>More</span>
          </div>
          
          {/* Additional stats */}
          <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
            <span>
              Longest streak: {/* You can calculate this from the data */}
              {(() => {
                let maxStreak = 0;
                let currentStreak = 0;
                
                // Flatten all days in chronological order
                const allDays = data.weeks.flat().filter(day => day.isInRange).sort((a, b) => a.date.localeCompare(b.date));
                
                allDays.forEach(day => {
                  if (day.count > 0) {
                    currentStreak++;
                    maxStreak = Math.max(maxStreak, currentStreak);
                  } else {
                    currentStreak = 0;
                  }
                });
                
                return maxStreak;
              })()} days
            </span>
            <span>
              Current streak: {/* Calculate current streak */}
              {(() => {
                let currentStreak = 0;
                const allDays = data.weeks.flat().filter(day => day.isInRange).sort((a, b) => b.date.localeCompare(a.date));
                
                for (const day of allDays) {
                  if (day.count > 0) {
                    currentStreak++;
                  } else {
                    break;
                  }
                }
                
                return currentStreak;
              })()} days
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}