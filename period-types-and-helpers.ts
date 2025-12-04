// ============================================
// PERIOD/QUARTER/SET TYPES AND HELPERS
// ============================================
// Add this to your project for period tracking

// Period type definitions
export type BasketballPeriod = 'Q1' | 'Q2' | 'Q3' | 'Q4' | 'OT' | 'OT1' | 'OT2' | 'FULL';
export type FutsalPeriod = '1H' | '2H' | 'ET1' | 'ET2' | 'PEN' | 'FULL';
export type VolleyballPeriod = 'S1' | 'S2' | 'S3' | 'S4' | 'S5' | 'FULL';
export type BadmintonPeriod = 'S1' | 'S2' | 'S3' | 'FULL';

export type Period = BasketballPeriod | FutsalPeriod | VolleyballPeriod | BadmintonPeriod;

// Period definition interface
export interface PeriodDefinition {
  code: Period;
  name: string;
  displayOrder: number;
}

// Get periods for a sport
export function getPeriodsForSport(competitionId: string): PeriodDefinition[] {
  const sport = getSportType(competitionId);
  
  switch (sport) {
    case 'basketball':
      return [
        { code: 'Q1', name: 'Quarter 1', displayOrder: 1 },
        { code: 'Q2', name: 'Quarter 2', displayOrder: 2 },
        { code: 'Q3', name: 'Quarter 3', displayOrder: 3 },
        { code: 'Q4', name: 'Quarter 4', displayOrder: 4 },
        { code: 'OT', name: 'Overtime', displayOrder: 5 },
        { code: 'FULL', name: 'Full Game', displayOrder: 99 },
      ];
      
    case 'futsal':
      return [
        { code: '1H', name: '1st Half', displayOrder: 1 },
        { code: '2H', name: '2nd Half', displayOrder: 2 },
        { code: 'ET1', name: 'Extra Time 1', displayOrder: 3 },
        { code: 'ET2', name: 'Extra Time 2', displayOrder: 4 },
        { code: 'PEN', name: 'Penalties', displayOrder: 5 },
        { code: 'FULL', name: 'Full Match', displayOrder: 99 },
      ];
      
    case 'volleyball':
      return [
        { code: 'S1', name: 'Set 1', displayOrder: 1 },
        { code: 'S2', name: 'Set 2', displayOrder: 2 },
        { code: 'S3', name: 'Set 3', displayOrder: 3 },
        { code: 'S4', name: 'Set 4', displayOrder: 4 },
        { code: 'S5', name: 'Set 5', displayOrder: 5 },
        { code: 'FULL', name: 'Full Match', displayOrder: 99 },
      ];
      
    case 'badminton':
      return [
        { code: 'S1', name: 'Set 1', displayOrder: 1 },
        { code: 'S2', name: 'Set 2', displayOrder: 2 },
        { code: 'S3', name: 'Set 3', displayOrder: 3 },
        { code: 'FULL', name: 'Full Match', displayOrder: 99 },
      ];
      
    default:
      return [{ code: 'FULL', name: 'Full Game', displayOrder: 1 }];
  }
}

// Detect sport type from competition ID
export function getSportType(competitionId: string): string {
  if (competitionId.includes('basketball')) return 'basketball';
  if (competitionId.includes('futsal')) return 'futsal';
  if (competitionId.includes('volleyball')) return 'volleyball';
  if (competitionId.includes('badminton')) return 'badminton';
  return 'other';
}

// Get period display name
export function getPeriodName(period: Period): string {
  const periodMap: Record<Period, string> = {
    // Basketball
    'Q1': 'Quarter 1',
    'Q2': 'Quarter 2',
    'Q3': 'Quarter 3',
    'Q4': 'Quarter 4',
    'OT': 'Overtime',
    'OT1': 'Overtime 1',
    'OT2': 'Overtime 2',
    
    // Futsal
    '1H': '1st Half',
    '2H': '2nd Half',
    'ET1': 'Extra Time 1',
    'ET2': 'Extra Time 2',
    'PEN': 'Penalties',
    
    // Volleyball/Badminton
    'S1': 'Set 1',
    'S2': 'Set 2',
    'S3': 'Set 3',
    'S4': 'Set 4',
    'S5': 'Set 5',
    
    // Common
    'FULL': 'Full Game',
  };
  
  return periodMap[period] || period;
}

// Get period short name (for compact display)
export function getPeriodShortName(period: Period): string {
  const shortMap: Record<Period, string> = {
    'Q1': 'Q1', 'Q2': 'Q2', 'Q3': 'Q3', 'Q4': 'Q4',
    'OT': 'OT', 'OT1': 'OT1', 'OT2': 'OT2',
    '1H': '1H', '2H': '2H',
    'ET1': 'ET1', 'ET2': 'ET2',
    'PEN': 'PEN',
    'S1': 'S1', 'S2': 'S2', 'S3': 'S3', 'S4': 'S4', 'S5': 'S5',
    'FULL': 'Full',
  };
  
  return shortMap[period] || period;
}

// Check if period is valid for sport
export function isPeriodValidForSport(period: Period, competitionId: string): boolean {
  const validPeriods = getPeriodsForSport(competitionId);
  return validPeriods.some(p => p.code === period);
}

// Get default period for a sport
export function getDefaultPeriod(competitionId: string): Period {
  const sport = getSportType(competitionId);
  
  switch (sport) {
    case 'basketball': return 'Q1';
    case 'futsal': return '1H';
    case 'volleyball': return 'S1';
    case 'badminton': return 'S1';
    default: return 'FULL';
  }
}

// React component: Period Selector
export interface PeriodSelectorProps {
  competitionId: string;
  selectedPeriod: Period;
  onPeriodChange: (period: Period) => void;
  showFullGame?: boolean;
}

export function PeriodSelector({ 
  competitionId, 
  selectedPeriod, 
  onPeriodChange,
  showFullGame = true 
}: PeriodSelectorProps) {
  const periods = getPeriodsForSport(competitionId).filter(p => 
    showFullGame || p.code !== 'FULL'
  );
  
  return (
    <div className="flex gap-2 mb-4">
      <label className="font-medium text-sm text-gray-700 flex items-center">
        Period:
      </label>
      <div className="flex gap-1">
        {periods.map(period => (
          <button
            key={period.code}
            onClick={() => onPeriodChange(period.code)}
            className={`
              px-3 py-1 rounded-md text-sm font-medium transition-colors
              ${selectedPeriod === period.code
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }
            `}
          >
            {getPeriodShortName(period.code)}
          </button>
        ))}
      </div>
    </div>
  );
}

// Example usage in Admin Dashboard:
/*
import { PeriodSelector, Period, getDefaultPeriod } from '@/lib/period-helpers';

function AdminDashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('Q1');
  
  // When expanding stats for a match
  const toggleStatsExpand = async (matchId: string) => {
    const match = matches.find(m => m.id === matchId);
    if (match) {
      const defaultPeriod = getDefaultPeriod(match.competitionId);
      setSelectedPeriod(defaultPeriod);
      
      // Load stats for selected period
      const stats = await getBasketballStats(matchId, selectedPeriod);
      // ...
    }
  };
  
  return (
    <div>
      {expandedMatchId && (
        <>
          <PeriodSelector
            competitionId={currentMatch.competitionId}
            selectedPeriod={selectedPeriod}
            onPeriodChange={(period) => {
              setSelectedPeriod(period);
              // Reload stats for new period
            }}
          />
          
          {/* Stats table here *\/}
        </>
      )}
    </div>
  );
}
*/







