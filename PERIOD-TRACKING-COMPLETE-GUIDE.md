# 🏆 Universal Period/Quarter/Set Tracking for All Sports

## 🎯 Goal

Track stats by **period** for all sports:
- **Basketball**: Q1, Q2, Q3, Q4, OT
- **Futsal**: 1st Half, 2nd Half, ET1, ET2, Penalties
- **Volleyball**: Set 1-5
- **Badminton**: Set 1-3

---

## 🏗️ Architecture

### **Single Universal Column: `period`**

Instead of sport-specific columns, use ONE column that supports all sports:

```sql
basketball_stats:
  - period: 'Q1' | 'Q2' | 'Q3' | 'Q4' | 'OT' | '1H' | '2H' | 'S1' | ... | 'FULL'
  
futsal_stats (future):
  - period: '1H' | '2H' | 'ET1' | 'ET2' | 'PEN' | 'FULL'
  
volleyball_stats (future):
  - period: 'S1' | 'S2' | 'S3' | 'S4' | 'S5' | 'FULL'
```

**Benefits:**
- ✅ Works for ALL sports
- ✅ Easy to add new period types (OT2, ET3, S6, etc.)
- ✅ Consistent across all stats tables
- ✅ Simple to query and aggregate

---

## 🚀 Implementation

### **Step 1: Run SQL Migration**

```sql
-- In Supabase SQL Editor:
-- Copy & paste entire: add-period-to-stats.sql
-- Click RUN
```

**What it does:**
1. ✅ Adds `period` column to `basketball_stats`
2. ✅ Creates `period_definitions` reference table
3. ✅ Inserts period codes for all sports
4. ✅ Updates unique constraint: `(match_id, player_id, period)`
5. ✅ Creates helper function `get_periods_for_sport()`
6. ✅ Sets existing records to `period = 'FULL'`
7. ✅ Tests multi-period inserts

**Expected output:**
```
✅ PERIOD TRACKING ADDED
✅ Test PASSED: Can insert multiple periods (Q1, Q2, OT)
Q1 Points: 17
Q2 Points: 12
OT Points: 5
Total: 34
🧹 Test data cleaned up
```

---

### **Step 2: Update TypeScript Types**

In `src/lib/supabase.ts`:

```typescript
// Add period types
export type Period = 
  | 'Q1' | 'Q2' | 'Q3' | 'Q4' | 'OT' | 'OT1' | 'OT2'  // Basketball
  | '1H' | '2H' | 'ET1' | 'ET2' | 'PEN'                // Futsal
  | 'S1' | 'S2' | 'S3' | 'S4' | 'S5'                   // Volleyball/Badminton
  | 'FULL';                                            // Full game

// Update basketball_stats type
basketball_stats: {
  Row: {
    id: string
    match_id: string
    player_id: string
    period: Period                          // ← ADD THIS
    free_throw_made: number
    free_throw_attempt: number
    // ... rest of fields
  }
  Insert: {
    match_id: string
    player_id: string
    period?: Period                         // ← ADD THIS (optional, defaults to 'FULL')
    // ... rest of fields
  }
  Update: {
    period?: Period                         // ← ADD THIS
    // ... rest of fields
  }
}

// Add period_definitions type
period_definitions: {
  Row: {
    id: number
    sport_type: string
    period_code: string
    period_name: string
    display_order: number
    created_at: string
  }
}
```

---

### **Step 3: Add Helper Functions**

Copy `period-types-and-helpers.ts` to `src/lib/period-helpers.ts`

**Key functions:**
```typescript
// Get available periods for a sport
getPeriodsForSport('basketball-putra')
// Returns: [Q1, Q2, Q3, Q4, OT, FULL]

// Get period display name
getPeriodName('Q1') // → "Quarter 1"
getPeriodName('1H') // → "1st Half"
getPeriodName('S1') // → "Set 1"

// Get default period for sport
getDefaultPeriod('basketball-putra') // → 'Q1'
getDefaultPeriod('futsal') // → '1H'
getDefaultPeriod('volleyball') // → 'S1'
```

---

### **Step 4: Update Query Functions**

In `src/lib/supabase-queries.ts`:

```typescript
import { Period } from './supabase';

export async function getBasketballStats(
  matchId: string, 
  period?: Period
) {
  try {
    let query = supabase
      .from('basketball_stats')
      .select(`
        *,
        players (
          id,
          name,
          jersey_number,
          position
        )
      `)
      .eq('match_id', matchId);
    
    // Filter by period if provided
    if (period) {
      query = query.eq('period', period);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching basketball stats:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Error in getBasketballStats:', error);
    return [];
  }
}

export async function saveBasketballStats(
  matchId: string,
  statsToSave: any[]
) {
  // statsToSave now includes 'period' field
  const { data, error } = await supabase
    .from('basketball_stats')
    .upsert(
      statsToSave.map(stat => ({
        match_id: matchId,
        ...stat
      })),
      {
        onConflict: 'match_id,player_id,period'  // Updated conflict key
      }
    );
    
  if (error) throw error;
  return data;
}
```

---

### **Step 5: Update Admin Dashboard UI**

In `src/app/admin/dashboard/page.tsx`:

#### **5a. Add Imports**
```typescript
import { 
  PeriodSelector, 
  Period, 
  getDefaultPeriod,
  getPeriodsForSport 
} from '@/lib/period-helpers';
```

#### **5b. Add State**
```typescript
const [selectedPeriod, setSelectedPeriod] = useState<Period>('FULL');
```

#### **5c. Update Expand Function**
```typescript
const toggleStatsExpand = async (matchId: string) => {
  if (expandedMatchId === matchId) {
    // Collapse
    setExpandedMatchId(null);
    setTeam1Players([]);
    setTeam2Players([]);
    setPlayerStats({});
  } else {
    // Expand
    setExpandedMatchId(matchId);
    
    const match = matches.find(m => m.id === matchId);
    if (match) {
      // Set default period for this sport
      const defaultPeriod = getDefaultPeriod(match.competitionId);
      setSelectedPeriod(defaultPeriod);
      
      try {
        const [team1, team2, existingStats] = await Promise.all([
          getPlayersByFaculty(match.faculty1Id),
          getPlayersByFaculty(match.faculty2Id),
          getBasketballStats(matchId, defaultPeriod)  // ← Pass period
        ]);
        
        setTeam1Players(team1);
        setTeam2Players(team2);
        
        // Initialize stats for selected period
        const initialStats: {[playerId: string]: any} = {};
        
        [...team1, ...team2].forEach(player => {
          const existingStat = existingStats.find(
            (s: any) => s.player_id === player.id && s.period === defaultPeriod
          );
          initialStats[player.id] = existingStat || {
            period: defaultPeriod,  // ← Add period
            free_throw_made: 0,
            // ... rest of default stats
          };
        });
        
        setPlayerStats(initialStats);
      } catch (error: any) {
        console.error('Error loading basketball stats:', error);
      }
    }
  }
};
```

#### **5d. Add Period Selector UI**
```typescript
// Inside the expanded stats section, BEFORE the teams table:
{expandedMatchId === match.id && isBasketballMatch(match) && (
  <tr>
    <td colSpan={8} className="bg-gray-50 p-6">
      {/* Period Selector */}
      <PeriodSelector
        competitionId={match.competitionId}
        selectedPeriod={selectedPeriod}
        onPeriodChange={async (newPeriod) => {
          setSelectedPeriod(newPeriod);
          
          // Reload stats for new period
          const stats = await getBasketballStats(match.id, newPeriod);
          
          // Re-initialize player stats for new period
          const updatedStats: {[playerId: string]: any} = {};
          [...team1Players, ...team2Players].forEach(player => {
            const existingStat = stats.find(
              (s: any) => s.player_id === player.id && s.period === newPeriod
            );
            updatedStats[player.id] = existingStat || {
              period: newPeriod,
              free_throw_made: 0,
              // ... rest
            };
          });
          
          setPlayerStats(updatedStats);
        }}
        showFullGame={true}
      />
      
      {/* Teams table below */}
      <div className="flex gap-4">
        {/* ... existing teams table ... */}
      </div>
    </td>
  </tr>
)}
```

#### **5e. Update Save Function**
```typescript
const handleSaveAllBasketballStats = async () => {
  if (!expandedMatchId) return;

  // ... validation ...

  try {
    const statsToSave = Object.entries(playerStats)
      .filter(/* ... */)
      .map(([playerId, stats]) => ({
        player_id: playerId,
        period: selectedPeriod,  // ← Include period
        ...stats
      }));

    // ... save logic ...
  } catch (error: any) {
    // ... error handling ...
  }
};
```

---

## 🎨 UI Mockup

```
┌─────────────────────────────────────────────────────────────┐
│ Basketball Men's: BBS vs SOD                                │
│                                                             │
│ Period: [Q1] [Q2] [Q3] [Q4] [OT] [Full]   ← Period tabs   │
│         ^^^^                                                 │
│                                                             │
│ ┌───────────────────────┬───────────────────────┐          │
│ │ BBS (Q1)             │ SOD (Q1)              │          │
│ ├───────────────────────┼───────────────────────┤          │
│ │ Lee #14              │ Smith #10             │          │
│ │ FT: 2/3  2PT: 4/5    │ FT: 1/2  2PT: 3/4     │          │
│ │ Points: 12           │ Points: 8             │          │
│ └───────────────────────┴───────────────────────┘          │
│                                                             │
│ [💾 Save Q1 Stats] [Close]                                 │
└─────────────────────────────────────────────────────────────┘

// Click Q2 → UI updates to show Q2 stats
// Click Q3 → UI updates to show Q3 stats
// etc.
```

---

## 📊 Period Codes Reference

| Sport | Periods Available | Codes |
|-------|------------------|-------|
| **Basketball** | Quarters 1-4, Overtime, Full Game | `Q1`, `Q2`, `Q3`, `Q4`, `OT`, `FULL` |
| **Futsal** | Halves, Extra Time, Penalties, Full Match | `1H`, `2H`, `ET1`, `ET2`, `PEN`, `FULL` |
| **Volleyball** | Sets 1-5, Full Match | `S1`, `S2`, `S3`, `S4`, `S5`, `FULL` |
| **Badminton** | Sets 1-3, Full Match | `S1`, `S2`, `S3`, `FULL` |

---

## 🔍 Example Queries

### **Get Q1 Stats for All Players**
```sql
SELECT 
  p.name,
  p.jersey_number,
  bs.total_points,
  bs.assists
FROM basketball_stats bs
JOIN players p ON bs.player_id = p.id
WHERE bs.match_id = 'match-uuid'
  AND bs.period = 'Q1'
ORDER BY bs.total_points DESC;
```

### **Get Player Total Across All Quarters**
```sql
SELECT 
  p.name,
  SUM(bs.total_points) as total_points,
  SUM(bs.free_throw_made) as total_ft,
  SUM(bs.assists) as total_assists
FROM basketball_stats bs
JOIN players p ON bs.player_id = p.id
WHERE bs.match_id = 'match-uuid'
  AND bs.period != 'FULL'  -- Exclude full game stats
GROUP BY p.id, p.name
ORDER BY total_points DESC;
```

### **Get Quarter-by-Quarter Breakdown**
```sql
SELECT 
  p.name,
  MAX(CASE WHEN bs.period = 'Q1' THEN bs.total_points ELSE 0 END) as q1,
  MAX(CASE WHEN bs.period = 'Q2' THEN bs.total_points ELSE 0 END) as q2,
  MAX(CASE WHEN bs.period = 'Q3' THEN bs.total_points ELSE 0 END) as q3,
  MAX(CASE WHEN bs.period = 'Q4' THEN bs.total_points ELSE 0 END) as q4,
  SUM(CASE WHEN bs.period != 'FULL' THEN bs.total_points ELSE 0 END) as total
FROM basketball_stats bs
JOIN players p ON bs.player_id = p.id
WHERE bs.match_id = 'match-uuid'
GROUP BY p.id, p.name
ORDER BY total DESC;
```

---

## ✅ Migration Checklist

- [ ] **Step 1:** Run `add-period-to-stats.sql` in Supabase SQL Editor
- [ ] **Step 2:** Verify `period` column exists: `SELECT * FROM basketball_stats LIMIT 1;`
- [ ] **Step 3:** Verify `period_definitions` table: `SELECT * FROM period_definitions;`
- [ ] **Step 4:** Copy `period-types-and-helpers.ts` to `src/lib/period-helpers.ts`
- [ ] **Step 5:** Update `src/lib/supabase.ts` types (add `Period` type)
- [ ] **Step 6:** Update `getBasketballStats()` to accept `period` parameter
- [ ] **Step 7:** Update `saveBasketballStats()` conflict key
- [ ] **Step 8:** Add `PeriodSelector` component to admin dashboard
- [ ] **Step 9:** Update `toggleStatsExpand()` to load period-specific stats
- [ ] **Step 10:** Update `handleSaveAllBasketballStats()` to include period
- [ ] **Step 11:** Test: Save Q1 stats for a match
- [ ] **Step 12:** Test: Switch to Q2, save different stats
- [ ] **Step 13:** Test: Query totals across all quarters
- [ ] **Step 14:** Test: Works for other sports (futsal, volleyball)

---

## 🎯 Benefits

| Feature | Before | After |
|---------|--------|-------|
| Granularity | Full game only | Per quarter/half/set ✅ |
| Multi-sport | Basketball only | All sports ✅ |
| Overtime | Not supported | OT, ET1, ET2 supported ✅ |
| Analysis | Basic | Detailed (Q1 vs Q4 comparison) ✅ |
| Flexibility | Fixed | Extensible (add new periods) ✅ |

---

## 🚀 Next Steps

1. **Now:** Run `add-period-to-stats.sql` to add database support
2. **Next:** Implement frontend UI (period selector + stats loading)
3. **Future:** Add same period tracking to other sports (futsal_stats, volleyball_stats)

---

**Want me to implement the full frontend integration now?** 🎯







