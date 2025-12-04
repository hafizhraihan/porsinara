# Volleyball Stats Implementation Guide

## 🚀 Quick Setup

### 1. Run the SQL Migration

Execute the migration script in your Supabase SQL editor:

```bash
# Run this in Supabase SQL Editor
# Copy-paste the contents of create-volley-stats-table.sql
```

### 2. Verify Table Creation

```sql
-- Check if table exists
SELECT * FROM information_schema.tables 
WHERE table_name = 'volley_stats';

-- Check table structure
\d volley_stats
```

## 📊 Table Structure

```sql
volley_stats
├── id (UUID, PK)
├── match_id (UUID, FK → matches)
├── player_id (UUID, FK → players)
├── serve_attempt (INTEGER, default 0)
├── serve_ace (INTEGER, default 0)
├── serve_error (INTEGER, default 0)
├── spike_attempt (INTEGER, default 0)
├── spike_kill (INTEGER, default 0)
├── spike_error (INTEGER, default 0)
├── block_attempt (INTEGER, default 0)
├── block_success (INTEGER, default 0)
├── set_attempt (INTEGER, default 0)
├── set_assist (INTEGER, default 0)
├── dig_attempt (INTEGER, default 0)
├── dig_success (INTEGER, default 0)
├── receive_attempt (INTEGER, default 0)
├── receive_good (INTEGER, default 0)
├── total_error (INTEGER, default 0)
├── minutes_played (INTEGER, default 0)
├── is_starter (BOOLEAN, default false)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)
```

## 🎯 Usage Examples

### Insert Volleyball Stats

```typescript
import { supabase } from '@/lib/supabase';

async function insertVolleyStats(
  matchId: string,
  playerId: string,
  stats: {
    serveAttempt: number;
    serveAce: number;
    serveError: number;
    spikeAttempt: number;
    spikeKill: number;
    spikeError: number;
    blockAttempt: number;
    blockSuccess: number;
    setAttempt: number;
    setAssist: number;
    digAttempt: number;
    digSuccess: number;
    receiveAttempt: number;
    receiveGood: number;
    totalError: number;
    minutesPlayed: number;
    isStarter: boolean;
  }
) {
  const { data, error } = await supabase
    .from('volley_stats')
    .insert({
      match_id: matchId,
      player_id: playerId,
      serve_attempt: stats.serveAttempt,
      serve_ace: stats.serveAce,
      serve_error: stats.serveError,
      spike_attempt: stats.spikeAttempt,
      spike_kill: stats.spikeKill,
      spike_error: stats.spikeError,
      block_attempt: stats.blockAttempt,
      block_success: stats.blockSuccess,
      set_attempt: stats.setAttempt,
      set_assist: stats.setAssist,
      dig_attempt: stats.digAttempt,
      dig_success: stats.digSuccess,
      receive_attempt: stats.receiveAttempt,
      receive_good: stats.receiveGood,
      total_error: stats.totalError,
      minutes_played: stats.minutesPlayed,
      is_starter: stats.isStarter,
    });

  if (error) throw error;
  return data;
}
```

### Query Stats for a Match

```typescript
async function getMatchStats(matchId: string) {
  const { data, error } = await supabase
    .from('volley_stats')
    .select(`
      *,
      players (
        name,
        jersey_number,
        faculty_id,
        position
      )
    `)
    .eq('match_id', matchId)
    .order('spike_kill', { ascending: false });

  if (error) throw error;
  return data;
}
```

### Query Stats by Player

```typescript
async function getPlayerStats(playerId: string) {
  const { data, error } = await supabase
    .from('volley_stats')
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
    .from('volley_stats')
    .select('*')
    .eq('player_id', playerId);

  if (error) throw error;

  const totals = data.reduce(
    (acc, curr) => ({
      totalServeAttempt: acc.totalServeAttempt + (curr.serve_attempt || 0),
      totalServeAce: acc.totalServeAce + (curr.serve_ace || 0),
      totalSpikeKill: acc.totalSpikeKill + (curr.spike_kill || 0),
      totalSpikeAttempt: acc.totalSpikeAttempt + (curr.spike_attempt || 0),
      totalBlockSuccess: acc.totalBlockSuccess + (curr.block_success || 0),
      totalSetAssist: acc.totalSetAssist + (curr.set_assist || 0),
      matchesPlayed: acc.matchesPlayed + 1,
    }),
    {
      totalServeAttempt: 0,
      totalServeAce: 0,
      totalSpikeKill: 0,
      totalSpikeAttempt: 0,
      totalBlockSuccess: 0,
      totalSetAssist: 0,
      matchesPlayed: 0,
    }
  );

  return {
    ...totals,
    serveAcePercentage: totals.totalServeAttempt > 0 
      ? (totals.totalServeAce / totals.totalServeAttempt * 100).toFixed(1)
      : '0.0',
    spikeKillPercentage: totals.totalSpikeAttempt > 0
      ? (totals.totalSpikeKill / totals.totalSpikeAttempt * 100).toFixed(1)
      : '0.0',
  };
}
```

## 🎨 UI Implementation Examples

### Display Volleyball Stats

```tsx
interface VolleyStatsDisplayProps {
  stats: {
    serve_attempt: number;
    serve_ace: number;
    serve_error: number;
    spike_attempt: number;
    spike_kill: number;
    spike_error: number;
    block_attempt: number;
    block_success: number;
    set_attempt: number;
    set_assist: number;
    dig_attempt: number;
    dig_success: number;
    receive_attempt: number;
    receive_good: number;
    total_error: number;
  };
}

export function VolleyStatsDisplay({ stats }: VolleyStatsDisplayProps) {
  const servePercentage = ((stats.serve_ace / stats.serve_attempt) * 100).toFixed(1);
  const spikeKillPercentage = ((stats.spike_kill / stats.spike_attempt) * 100).toFixed(1);
  const blockSuccessPercentage = ((stats.block_success / stats.block_attempt) * 100).toFixed(1);
  const digSuccessPercentage = ((stats.dig_success / stats.dig_attempt) * 100).toFixed(1);
  const receiveGoodPercentage = ((stats.receive_good / stats.receive_attempt) * 100).toFixed(1);

  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <h3 className="text-sm font-semibold">Serve</h3>
        <p>Attempts: {stats.serve_attempt}</p>
        <p className="font-bold text-green-600">Aces: {stats.serve_ace}</p>
        <p className="text-red-600">Errors: {stats.serve_error}</p>
        <p>Success Rate: {servePercentage}%</p>
      </div>
      
      <div>
        <h3 className="text-sm font-semibold">Spike</h3>
        <p>Attempts: {stats.spike_attempt}</p>
        <p className="font-bold text-green-600">Kills: {stats.spike_kill}</p>
        <p className="text-red-600">Errors: {stats.spike_error}</p>
        <p>Kill Rate: {spikeKillPercentage}%</p>
      </div>
      
      <div>
        <h3 className="text-sm font-semibold">Block</h3>
        <p>Attempts: {stats.block_attempt}</p>
        <p className="font-bold text-green-600">Success: {stats.block_success}</p>
        <p>Success Rate: {blockSuccessPercentage}%</p>
      </div>
      
      <div>
        <h3 className="text-sm font-semibold">Set</h3>
        <p>Attempts: {stats.set_attempt}</p>
        <p className="font-bold text-green-600">Assists: {stats.set_assist}</p>
      </div>
      
      <div>
        <h3 className="text-sm font-semibold">Dig</h3>
        <p>Attempts: {stats.dig_attempt}</p>
        <p className="font-bold text-green-600">Success: {stats.dig_success}</p>
        <p>Success Rate: {digSuccessPercentage}%</p>
      </div>
      
      <div>
        <h3 className="text-sm font-semibold">Receive</h3>
        <p>Attempts: {stats.receive_attempt}</p>
        <p className="font-bold text-green-600">Good: {stats.receive_good}</p>
        <p>Good Rate: {receiveGoodPercentage}%</p>
      </div>
      
      <div className="col-span-2">
        <h3 className="text-sm font-semibold">Errors</h3>
        <p className="text-red-600 font-bold">Total Errors: {stats.total_error}</p>
      </div>
    </div>
  );
}
```

## 📊 Displaying Stats Tables

```tsx
export function VolleyStatsTable({ matchId }: { matchId: string }) {
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
            <th>Serve</th>
            <th>Spike</th>
            <th>Block</th>
            <th>Set</th>
            <th>Dig</th>
            <th>Receive</th>
            <th>Errors</th>
          </tr>
        </thead>
        <tbody>
          {stats.map(stat => {
            const serveRate = ((stat.serve_ace / stat.serve_attempt) * 100).toFixed(1);
            const spikeRate = ((stat.spike_kill / stat.spike_attempt) * 100).toFixed(1);
            
            return (
              <tr key={stat.id}>
                <td>{stat.players.name} #{stat.players.jersey_number}</td>
                <td>
                  {stat.serve_ace}/{stat.serve_attempt}
                  <span className="text-xs text-gray-500"> ({serveRate}%)</span>
                </td>
                <td>
                  {stat.spike_kill}/{stat.spike_attempt}
                  <span className="text-xs text-gray-500"> ({spikeRate}%)</span>
                </td>
                <td>{stat.block_success}/{stat.block_attempt}</td>
                <td>{stat.set_assist}/{stat.set_attempt}</td>
                <td>{stat.dig_success}/{stat.dig_attempt}</td>
                <td>{stat.receive_good}/{stat.receive_attempt}</td>
                <td className="text-red-600 font-bold">{stat.total_error}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
```

## 🔄 Updating Stats

```typescript
async function updatePlayerStats(
  statId: string,
  updates: Partial<{
    serve_attempt: number;
    serve_ace: number;
    serve_error: number;
    spike_attempt: number;
    spike_kill: number;
    spike_error: number;
    block_attempt: number;
    block_success: number;
    set_attempt: number;
    set_assist: number;
    dig_attempt: number;
    dig_success: number;
    receive_attempt: number;
    receive_good: number;
    total_error: number;
    minutes_played: number;
  }>
) {
  const { data, error } = await supabase
    .from('volley_stats')
    .update(updates)
    .eq('id', statId)
    .select();

  if (error) throw error;
  return data;
}
```

## 📈 SQL Queries for Analytics

### Top Spikers
```sql
SELECT 
  p.name,
  p.jersey_number,
  SUM(vs.spike_kill) as total_kills,
  SUM(vs.spike_attempt) as total_attempts,
  ROUND((SUM(vs.spike_kill)::decimal / NULLIF(SUM(vs.spike_attempt), 0) * 100), 1) as kill_percentage
FROM volley_stats vs
JOIN players p ON vs.player_id = p.id
GROUP BY p.id, p.name, p.jersey_number
ORDER BY total_kills DESC
LIMIT 10;
```

### Best Servers
```sql
SELECT 
  p.name,
  p.jersey_number,
  SUM(vs.serve_ace) as total_aces,
  SUM(vs.serve_attempt) as total_attempts,
  ROUND((SUM(vs.serve_ace)::decimal / NULLIF(SUM(vs.serve_attempt), 0) * 100), 1) as ace_percentage
FROM volley_stats vs
JOIN players p ON vs.player_id = p.id
GROUP BY p.id, p.name, p.jersey_number
ORDER BY total_aces DESC
LIMIT 10;
```

### Best Setters
```sql
SELECT 
  p.name,
  p.jersey_number,
  SUM(vs.set_assist) as total_assists,
  SUM(vs.set_attempt) as total_attempts,
  ROUND((SUM(vs.set_assist)::decimal / NULLIF(SUM(vs.set_attempt), 0) * 100), 1) as assist_percentage
FROM volley_stats vs
JOIN players p ON vs.player_id = p.id
GROUP BY p.id, p.name, p.jersey_number
ORDER BY total_assists DESC
LIMIT 10;
```

## ✅ Validation Rules

- All statistics must be non-negative integers
- Success metrics cannot exceed attempt metrics:
  - `serve_ace <= serve_attempt`
  - `spike_kill <= spike_attempt`
  - `block_success <= block_attempt`
  - `set_assist <= set_attempt`
  - `dig_success <= dig_attempt`
  - `receive_good <= receive_attempt`
- Each player can only have one stat record per match (enforced by UNIQUE constraint)

## 🚨 Common Errors & Solutions

### Error: "spike_kill exceeds spike_attempt"
**Solution**: Ensure kill count doesn't exceed attempt count. Check your data entry.

### Error: "Duplicate key value violates unique constraint"
**Solution**: Each player can only have one stat record per match. Use UPDATE instead of INSERT.

## 📝 Notes

- The `updated_at` field is automatically managed by database triggers
- All counts are incremental (e.g., entering 5 kills means 5 kills, not "set to 5")
- Use calculated percentages for performance metrics (kill rate, ace rate, etc.)
- Position-specific stats can be filtered by player position in the players table


