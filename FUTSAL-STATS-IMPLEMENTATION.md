# Futsal Stats Implementation Guide

## 🚀 Quick Setup

### 1. Run the SQL Migration

Execute the migration script in your Supabase SQL editor:

```bash
# Run this in Supabase SQL Editor
supabase/functions/setup_futsal_stats.sql
```

Or copy-paste the contents of `create-futsal-stats-table.sql` into the Supabase SQL editor.

### 2. Verify Table Creation

```sql
-- Check if table exists
SELECT * FROM information_schema.tables 
WHERE table_name = 'futsal_stats';

-- Check table structure
\d futsal_stats
```

## 📊 Table Structure

```sql
futsal_stats
├── id (UUID, PK)
├── match_id (UUID, FK → matches)
├── player_id (UUID, FK → players)
├── shots_on_target (INTEGER, default 0)
├── shots_off_target (INTEGER, default 0)
├── goals (INTEGER, default 0)
├── assists (INTEGER, default 0)
├── clearances (INTEGER, default 0)
├── fouls (INTEGER, default 0)
├── turnovers (INTEGER, default 0)
├── shots_received (INTEGER, nullable) -- Only for keepers
├── saves (INTEGER, nullable) -- Only for keepers
├── minutes_played (INTEGER, default 0)
├── is_starter (BOOLEAN, default false)
├── is_goalkeeper (BOOLEAN, default false)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)
```

## 🎯 Usage Examples

### Insert Field Player Stats

```typescript
import { supabase } from '@/lib/supabase';

async function insertFieldPlayerStats(
  matchId: string,
  playerId: string,
  stats: {
    shotsOnTarget: number;
    shotsOffTarget: number;
    goals: number;
    assists: number;
    clearances: number;
    fouls: number;
    turnovers: number;
    minutesPlayed: number;
    isStarter: boolean;
  }
) {
  const { data, error } = await supabase
    .from('futsal_stats')
    .insert({
      match_id: matchId,
      player_id: playerId,
      shots_on_target: stats.shotsOnTarget,
      shots_off_target: stats.shotsOffTarget,
      goals: stats.goals,
      assists: stats.assists,
      clearances: stats.clearances,
      fouls: stats.fouls,
      turnovers: stats.turnovers,
      minutes_played: stats.minutesPlayed,
      is_starter: stats.isStarter,
      is_goalkeeper: false, // Field player
    });

  if (error) throw error;
  return data;
}
```

### Insert Goalkeeper Stats

```typescript
async function insertGoalkeeperStats(
  matchId: string,
  playerId: string,
  stats: {
    shotsReceived: number;
    saves: number;
    clearances: number;
    fouls: number;
    turnovers: number;
    minutesPlayed: number;
    isStarter: boolean;
  }
) {
  const { data, error } = await supabase
    .from('futsal_stats')
    .insert({
      match_id: matchId,
      player_id: playerId,
      shots_received: stats.shotsReceived,
      saves: stats.saves,
      clearances: stats.clearances,
      fouls: stats.fouls,
      turnovers: stats.turnovers,
      minutes_played: stats.minutesPlayed,
      is_starter: stats.isStarter,
      is_goalkeeper: true, // Goalkeeper
    });

  if (error) throw error;
  return data;
}
```

### Query Stats for a Match

```typescript
async function getMatchStats(matchId: string) {
  const { data, error } = await supabase
    .from('futsal_stats')
    .select(`
      *,
      players (
        name,
        jersey_number,
        faculty_id
      )
    `)
    .eq('match_id', matchId)
    .order('goals', { ascending: false });

  if (error) throw error;
  return data;
}
```

### Query Stats by Player

```typescript
async function getPlayerStats(playerId: string) {
  const { data, error } = await supabase
    .from('futsal_stats')
    .select(`
      *,
      matches (
        id,
        competition_id,
        date
      )
    `)
    .eq('player_id', playerId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}
```

### Calculate Aggregated Stats

```typescript
async function getAggregatedPlayerStats(playerId: string) {
  const { data, error } = await supabase
    .from('futsal_stats')
    .select('goals, assists, fouls, turnovers, shots_on_target, saves')
    .eq('player_id', playerId);

  if (error) throw error;

  const totals = data.reduce(
    (acc, curr) => ({
      totalGoals: acc.totalGoals + (curr.goals || 0),
      totalAssists: acc.totalAssists + (curr.assists || 0),
      totalFouls: acc.totalFouls + (curr.fouls || 0),
      totalTurnovers: acc.totalTurnovers + (curr.turnovers || 0),
      totalShotsOnTarget: acc.totalShotsOnTarget + (curr.shots_on_target || 0),
      totalSaves: acc.totalSaves + (curr.saves || 0),
      matchesPlayed: acc.matchesPlayed + 1,
    }),
    {
      totalGoals: 0,
      totalAssists: 0,
      totalFouls: 0,
      totalTurnovers: 0,
      totalShotsOnTarget: 0,
      totalSaves: 0,
      matchesPlayed: 0,
    }
  );

  return {
    ...totals,
    goalsPerMatch: totals.totalGoals / totals.matchesPlayed,
    assistsPerMatch: totals.totalAssists / totals.matchesPlayed,
  };
}
```

## 🎨 UI Implementation Examples

### Display Field Player Stats

```tsx
interface FutsalStatsDisplayProps {
  stats: {
    shots_on_target: number;
    shots_off_target: number;
    goals: number;
    assists: number;
    clearances: number;
    fouls: number;
    turnovers: number;
    minutes_played: number;
  };
}

export function FutsalStatsDisplay({ stats }: FutsalStatsDisplayProps) {
  const shootingAccuracy = ((stats.shots_on_target / (stats.shots_on_target + stats.shots_off_target)) * 100).toFixed(1);

  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <h3 className="text-sm font-semibold">Shooting</h3>
        <p>Shots on target: {stats.shots_on_target}</p>
        <p>Shots off target: {stats.shots_off_target}</p>
        <p className="font-bold">Accuracy: {shootingAccuracy}%</p>
      </div>
      
      <div>
        <h3 className="text-sm font-semibold">Scoring</h3>
        <p className="font-bold">Goals: {stats.goals}</p>
        <p>Assists: {stats.assists}</p>
      </div>
      
      <div>
        <h3 className="text-sm font-semibold">Defensive</h3>
        <p>Clearances: {stats.clearances}</p>
      </div>
      
      <div>
        <h3 className="text-sm font-semibold">Discipline</h3>
        <p>Fouls: {stats.fouls}</p>
        <p>Turnovers: {stats.turnovers}</p>
      </div>
    </div>
  );
}
```

### Display Goalkeeper Stats

```tsx
interface GoalkeeperStatsDisplayProps {
  stats: {
    shots_received: number;
    saves: number;
    clearances: number;
    fouls: number;
  };
}

export function GoalkeeperStatsDisplay({ stats }: GoalkeeperStatsDisplayProps) {
  const savePercentage = ((stats.saves / stats.shots_received) * 100).toFixed(1);
  const goalsConceded = stats.shots_received - stats.saves;

  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <h3 className="text-sm font-semibold">Goalkeeping</h3>
        <p>Shots received: {stats.shots_received}</p>
        <p className="font-bold">Saves: {stats.saves}</p>
        <p className="font-bold text-red-600">Goals conceded: {goalsConceded}</p>
        <p>Save %: {savePercentage}%</p>
      </div>
      
      <div>
        <h3 className="text-sm font-semibold">Defensive</h3>
        <p>Clearances: {stats.clearances}</p>
        <p>Fouls: {stats.fouls}</p>
      </div>
    </div>
  );
}
```

## 🔄 Updating Stats

```typescript
async function updatePlayerStats(
  statId: string,
  updates: Partial<{
    shots_on_target: number;
    shots_off_target: number;
    goals: number;
    assists: number;
    clearances: number;
    fouls: number;
    turnovers: number;
    shots_received: number;
    saves: number;
    minutes_played: number;
  }>
) {
  const { data, error } = await supabase
    .from('futsal_stats')
    .update(updates)
    .eq('id', statId)
    .select();

  if (error) throw error;
  return data;
}
```

## 📊 Displaying Stats Tables

```tsx
export function FutsalStatsTable({ matchId }: { matchId: string }) {
  const [stats, setStats] = useState([]);

  useEffect(() => {
    getMatchStats(matchId).then(setStats);
  }, [matchId]);

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full">
        <thead>
          <tr>
            <th>Player</th>
            <th>On Target</th>
            <th>Off Target</th>
            <th>Goals</th>
            <th>Assists</th>
            <th>Clearances</th>
            <th>Fouls</th>
            <th>Turnovers</th>
          </tr>
        </thead>
        <tbody>
          {stats
            .filter(s => !s.is_goalkeeper)
            .map(stat => (
              <tr key={stat.id}>
                <td>{stat.players.name} #{stat.players.jersey_number}</td>
                <td>{stat.shots_on_target}</td>
                <td>{stat.shots_off_target}</td>
                <td className="font-bold">{stat.goals}</td>
                <td>{stat.assists}</td>
                <td>{stat.clearances}</td>
                <td>{stat.fouls}</td>
                <td>{stat.turnovers}</td>
              </tr>
            ))}
        </tbody>
      </table>
      
      {/* Goalkeeper Stats */}
      <h3>Goalkeepers</h3>
      <table className="min-w-full">
        <thead>
          <tr>
            <th>Player</th>
            <th>Shots Received</th>
            <th>Saves</th>
            <th>Goals Conceded</th>
            <th>Save %</th>
          </tr>
        </thead>
        <tbody>
          {stats
            .filter(s => s.is_goalkeeper)
            .map(stat => {
              const savePct = ((stat.saves / stat.shots_received) * 100).toFixed(1);
              const goalsConceded = stat.shots_received - stat.saves;
              return (
                <tr key={stat.id}>
                  <td>{stat.players.name} #{stat.players.jersey_number}</td>
                  <td>{stat.shots_received}</td>
                  <td>{stat.saves}</td>
                  <td className="text-red-600 font-bold">{goalsConceded}</td>
                  <td className="font-bold">{savePct}%</td>
                </tr>
              );
            })}
        </tbody>
      </table>
    </div>
  );
}
```

## ✅ Validation Rules

### Field Players
- `is_goalkeeper` must be `false`
- `shots_received` and `saves` must be `NULL`
- `shots_on_target`, `shots_off_target`, `goals`, `assists` can have values
- `goals` cannot exceed `shots_on_target`

### Goalkeepers
- `is_goalkeeper` must be `true`
- `shots_received` and `saves` must be set (not NULL)
- `shots_on_target`, `shots_off_target`, `goals`, `assists` are set to 0 by trigger
- All stats must be non-negative integers

## 🚨 Common Errors & Solutions

### Error: "goals exceeds shots_on_target"
**Solution**: Ensure goals count doesn't exceed shots on target. Check your data entry.

### Error: "Cannot insert NULL for shots_received when is_goalkeeper is true"
**Solution**: Always provide shots_received and saves values for goalkeepers.

### Error: "Duplicate key value violates unique constraint"
**Solution**: Each player can only have one stat record per match. Use UPDATE instead of INSERT.

## 📝 Notes

- The `updated_at` field is automatically managed by database triggers
- Statistics are role-specific: field players and goalkeepers have different tracking
- Use the `is_goalkeeper` flag to determine which statistics to display and track
- All counts are incremental (e.g., entering 5 goals means 5 goals, not "set to 5")

