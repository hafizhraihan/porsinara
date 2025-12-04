# 🏀 Basketball Quarter Tracking

## 🎯 Goal

Track basketball stats **per quarter** (Q1, Q2, Q3, Q4) for each player.

---

## 📋 Two Approaches

### **Approach 1: Single Quarter Column** ⭐ **RECOMMENDED**

**File:** `add-quarter-column.sql`

**Structure:**
```
match_id | player_id | quarter | ft_made | ft_attempt | 2pt_made | ... | total_points
uuid-1   | player-A  | Q1      | 2       | 3          | 4        | ... | 12
uuid-1   | player-A  | Q2      | 1       | 2          | 3        | ... | 9
uuid-1   | player-A  | Q3      | 3       | 4          | 2        | ... | 11
uuid-1   | player-A  | Q4      | 0       | 1          | 5        | ... | 10
```

**Pros:**
- ✅ Normalized (proper database design)
- ✅ Flexible (can add OT1, OT2 later)
- ✅ Easy to query specific quarter
- ✅ Easy to aggregate stats
- ✅ Same structure as current stats

**Cons:**
- ⚠️ 4 rows per player (one per quarter)
- ⚠️ Need to SUM to get full game stats

---

### **Approach 2: Separate Columns**

**File:** `add-quarter-columns-alternative.sql`

**Structure:**
```
match_id | player_id | q1_points | q2_points | q3_points | q4_points
uuid-1   | player-A  | 12        | 9         | 11        | 10
```

**Pros:**
- ✅ Single row per player
- ✅ Simple to display

**Cons:**
- ❌ Only stores points (not FT/2PT/3PT breakdown)
- ❌ Hard to add overtime
- ❌ Denormalized design

---

## 🚀 Implementation (Recommended Approach)

### **Step 1: Add Quarter Column**

Run in Supabase SQL Editor:
```sql
-- Copy entire: add-quarter-column.sql
-- Paste and RUN
```

**What it does:**
1. Adds `quarter` column (Q1, Q2, Q3, Q4)
2. Updates unique constraint: `(match_id, player_id, quarter)` instead of `(match_id, player_id)`
3. Tests multi-quarter inserts
4. Cleans up test data

**Expected output:**
```
✅ QUARTER COLUMN ADDED
✅ Test PASSED: Can insert multiple quarters for same player
Q1 Points: 17
Q2 Points: 12
🧹 Test data cleaned up
```

---

### **Step 2: Update TypeScript Types**

In `src/lib/supabase.ts`:

```typescript
basketball_stats: {
  Row: {
    id: string
    match_id: string
    player_id: string
    quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4' | null  // ← ADD THIS
    free_throw_made: number
    // ... rest of fields
  }
  Insert: {
    // ... same structure
    quarter?: 'Q1' | 'Q2' | 'Q3' | 'Q4' | null  // ← ADD THIS
  }
  Update: {
    // ... same structure
    quarter?: 'Q1' | 'Q2' | 'Q3' | 'Q4' | null  // ← ADD THIS
  }
}
```

---

### **Step 3: Update Admin Dashboard UI**

In `src/app/admin/dashboard/page.tsx`:

#### **3a. Add Quarter Selector**

```typescript
// Add state for selected quarter
const [selectedQuarter, setSelectedQuarter] = useState<'Q1' | 'Q2' | 'Q3' | 'Q4'>('Q1');

// Add UI dropdown
<div className="mb-4">
  <label className="block text-sm font-medium mb-2">Quarter:</label>
  <select 
    value={selectedQuarter}
    onChange={(e) => setSelectedQuarter(e.target.value as any)}
    className="border rounded px-3 py-2"
  >
    <option value="Q1">Q1</option>
    <option value="Q2">Q2</option>
    <option value="Q3">Q3</option>
    <option value="Q4">Q4</option>
  </select>
</div>
```

#### **3b. Load Stats for Selected Quarter**

```typescript
const toggleStatsExpand = async (matchId: string) => {
  if (expandedMatchId === matchId) {
    // Collapse
    setExpandedMatchId(null);
    // ...
  } else {
    // Expand
    const [team1, team2, existingStats] = await Promise.all([
      getPlayersByFaculty(match.faculty1Id),
      getPlayersByFaculty(match.faculty2Id),
      getBasketballStats(matchId, selectedQuarter)  // ← Pass quarter
    ]);
    
    // Initialize stats filtered by quarter
    [...team1, ...team2].forEach(player => {
      const existingStat = existingStats.find(
        (s: any) => s.player_id === player.id && s.quarter === selectedQuarter
      );
      // ...
    });
  }
};
```

#### **3c. Save with Quarter**

```typescript
const handleSaveAllBasketballStats = async () => {
  // ...
  const statsToSave = Object.entries(playerStats)
    .filter(/* ... */)
    .map(([playerId, stats]) => ({
      player_id: playerId,
      quarter: selectedQuarter,  // ← Add quarter
      ...stats
    }));
  
  await saveBasketballStats(expandedMatchId, statsToSave);
};
```

---

### **Step 4: Update Query Function**

In `src/lib/supabase-queries.ts`:

```typescript
export async function getBasketballStats(
  matchId: string, 
  quarter?: 'Q1' | 'Q2' | 'Q3' | 'Q4'
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
    
    // Filter by quarter if provided
    if (quarter) {
      query = query.eq('quarter', quarter);
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
```

---

## 📊 UI Mockup

```
┌─────────────────────────────────────────────────┐
│ Quarter: [Q1 ▼] [Q2] [Q3] [Q4]                 │
├─────────────────────────────────────────────────┤
│         BBS (Q1)          │      SOD (Q1)       │
├───────────────────────────┼─────────────────────┤
│ Player       │ Stats      │ Player    │ Stats   │
│ Lee #14      │ [+/-] ...  │ Smith #10 │ [+/-]   │
│ Points: 12   │            │ Points: 8 │         │
└─────────────────────────────────────────────────┘
         [💾 Save Q1 Stats]

// Switch to Q2 → Load Q2 stats
// Switch to Q3 → Load Q3 stats
// etc.
```

---

## 🎮 User Workflow

1. **Admin opens match** → Click expand stats
2. **Select Q1** → Enter stats for all players
3. **Save Q1** → Saves with `quarter = 'Q1'`
4. **Switch to Q2** → Stats reload (empty or existing Q2 data)
5. **Enter Q2 stats** → Save
6. **Repeat for Q3, Q4**

---

## 📈 Queries You Can Run

### **Get Player Stats for Specific Quarter**
```sql
SELECT 
  p.name,
  p.jersey_number,
  bs.quarter,
  bs.total_points,
  bs.assists,
  bs.turnovers
FROM basketball_stats bs
JOIN players p ON bs.player_id = p.id
WHERE bs.match_id = 'match-uuid'
  AND bs.quarter = 'Q2'
ORDER BY bs.total_points DESC;
```

### **Get Player Total Across All Quarters**
```sql
SELECT 
  p.name,
  p.jersey_number,
  SUM(bs.total_points) as total_points,
  SUM(bs.assists) as total_assists,
  SUM(bs.turnovers) as total_turnovers
FROM basketball_stats bs
JOIN players p ON bs.player_id = p.id
WHERE bs.match_id = 'match-uuid'
GROUP BY p.id, p.name, p.jersey_number
ORDER BY total_points DESC;
```

### **Get Quarter-by-Quarter Breakdown**
```sql
SELECT 
  p.name,
  MAX(CASE WHEN bs.quarter = 'Q1' THEN bs.total_points ELSE 0 END) as q1_points,
  MAX(CASE WHEN bs.quarter = 'Q2' THEN bs.total_points ELSE 0 END) as q2_points,
  MAX(CASE WHEN bs.quarter = 'Q3' THEN bs.total_points ELSE 0 END) as q3_points,
  MAX(CASE WHEN bs.quarter = 'Q4' THEN bs.total_points ELSE 0 END) as q4_points,
  SUM(bs.total_points) as total_points
FROM basketball_stats bs
JOIN players p ON bs.player_id = p.id
WHERE bs.match_id = 'match-uuid'
GROUP BY p.id, p.name
ORDER BY total_points DESC;
```

---

## ✅ Migration Checklist

- [ ] Run `add-quarter-column.sql` in Supabase
- [ ] Update `src/lib/supabase.ts` types
- [ ] Update `getBasketballStats()` to accept quarter parameter
- [ ] Add quarter selector UI in admin dashboard
- [ ] Update `toggleStatsExpand()` to load by quarter
- [ ] Update `handleSaveAllBasketballStats()` to include quarter
- [ ] Test: Save Q1 stats
- [ ] Test: Switch to Q2, save different stats
- [ ] Test: View all quarters for one player
- [ ] Test: Calculate total across all quarters

---

## 🎯 Benefits

With quarter tracking, you can:
- ✅ See which quarter a player performed best
- ✅ Track stamina (performance drop in Q4?)
- ✅ Identify clutch players (high Q4 points)
- ✅ Detailed game analysis
- ✅ Coach insights

---

**Ready to implement?** Start with `add-quarter-column.sql`! 🚀







