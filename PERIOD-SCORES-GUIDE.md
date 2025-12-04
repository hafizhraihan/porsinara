# 🎯 Period Scores System - Complete Guide

## 📊 Database Architecture

### **Three-Table System:**

```
┌─────────────────────────────────────────────────────────┐
│ matches                                                 │
├─────────────────────────────────────────────────────────┤
│ id | competition | status | current_period | score1 | score2
│ 1  | basketball  | live   | Q3             | 65     | 57    ← Total (auto-calculated)
└─────────────────────────────────────────────────────────┘
                              ↑
                              │ Auto-updates from period_scores
                              │
┌─────────────────────────────────────────────────────────┐
│ period_scores                                           │
├─────────────────────────────────────────────────────────┤
│ match_id | period | faculty1_score | faculty2_score    │
│ 1        | Q1     | 12             | 10                │
│ 1        | Q2     | 15             | 14                │
│ 1        | Q3     | 18             | 16                │
│ 1        | Q4     | 20             | 17                │
│          Total:     65               57                 │
└─────────────────────────────────────────────────────────┘
```

---

## 🏀 **Sport-Specific Examples**

### **Basketball:**
```sql
match_id | period | faculty1_score | faculty2_score
uuid-1   | Q1     | 12             | 10
uuid-1   | Q2     | 15             | 14
uuid-1   | Q3     | 18             | 16
uuid-1   | Q4     | 20             | 17
         Total:    65               57             ← Auto in matches.score1/score2
```

**Display:** "BBS 65 - 57 SOD (Q1: 12-10, Q2: 15-14, Q3: 18-16, Q4: 20-17)"

---

### **Volleyball:**
```sql
match_id | period | faculty1_score | faculty2_score
uuid-2   | Set 1  | 25             | 22             ← SOCS wins
uuid-2   | Set 2  | 23             | 25             ← BBS wins
uuid-2   | Set 3  | 25             | 20             ← SOCS wins
         Sets:     2                1               ← SOCS wins 2-1
         Points:   73               67              ← Total points (less important)
```

**Display:** "SOCS 2 - 1 BBS (25-22, 23-25, 25-20)"

**Note:** For volleyball, **sets won** matters more than total points!

---

### **Badminton:**
```sql
match_id | period | faculty1_score | faculty2_score
uuid-3   | Set 1  | 21             | 18             ← SOD wins
uuid-3   | Set 2  | 19             | 21             ← FDCHT wins
uuid-3   | Set 3  | 21             | 15             ← SOD wins
         Sets:     2                1               ← SOD wins 2-1
```

**Display:** "SOD 2 - 1 FDCHT (21-18, 19-21, 21-15)"

---

### **Futsal (Regular Time):**
```sql
match_id | period    | faculty1_score | faculty2_score
uuid-4   | 1st Half  | 1              | 1
uuid-4   | 2nd Half  | 2              | 1
         Total:       3                2              ← BBS wins 3-2
```

**Display:** "BBS 3 - 2 SOCS (HT: 1-1, FT: 3-2)"

---

### **Futsal (With Penalties):**
```sql
match_id | period    | faculty1_score | faculty2_score
uuid-5   | 1st Half  | 1              | 1
uuid-5   | 2nd Half  | 1              | 1
         Regulation:  2                2              ← Tied!
uuid-5   | PEN       | 4              | 3             ← Penalty shootout
         Final:      BBS wins 4-3 on penalties
```

**Display:** "BBS 2 (4) - 2 (3) SOCS (90': 2-2, Pens: 4-3)"

---

## 🚀 **Implementation**

### **Step 1: Create Tables**

```sql
-- Supabase SQL Editor:
-- 1. Run: add-period-to-matches.sql (adds current_period to matches)
-- 2. Run: add-period-scores-table.sql (creates period_scores table)
```

---

### **Step 2: Update TypeScript Types**

In `src/lib/supabase.ts`:

```typescript
// Add period_scores type
period_scores: {
  Row: {
    id: string
    match_id: string
    period: string
    faculty1_score: number
    faculty2_score: number
    created_at: string
    updated_at: string
  }
  Insert: {
    match_id: string
    period: string
    faculty1_score: number
    faculty2_score: number
  }
  Update: {
    faculty1_score?: number
    faculty2_score?: number
  }
}
```

---

### **Step 3: Create Query Functions**

In `src/lib/supabase-queries.ts`:

```typescript
// Get period scores for a match
export async function getPeriodScores(matchId: string) {
  const { data, error } = await supabase
    .from('period_scores')
    .select('*')
    .eq('match_id', matchId)
    .order('period');
  
  if (error) throw error;
  return data || [];
}

// Upsert period score
export async function upsertPeriodScore(
  matchId: string,
  period: string,
  faculty1Score: number,
  faculty2Score: number
) {
  const { data, error } = await supabase
    .from('period_scores')
    .upsert({
      match_id: matchId,
      period,
      faculty1_score: faculty1Score,
      faculty2_score: faculty2Score
    }, {
      onConflict: 'match_id,period'
    });
  
  if (error) throw error;
  return data;
}

// Get sets won (for volleyball/badminton)
export async function getSetsWon(matchId: string) {
  const scores = await getPeriodScores(matchId);
  
  const faculty1Wins = scores.filter(s => s.faculty1_score > s.faculty2_score).length;
  const faculty2Wins = scores.filter(s => s.faculty2_score > s.faculty1_score).length;
  
  return { faculty1Wins, faculty2Wins };
}
```

---

### **Step 4: Admin Dashboard UI**

#### **For Basketball (Show Quarter Scores):**

```typescript
function MatchCard({ match }: { match: Match }) {
  const [periodScores, setPeriodScores] = useState<PeriodScore[]>([]);
  
  useEffect(() => {
    if (match.status !== 'scheduled') {
      getPeriodScores(match.id).then(setPeriodScores);
    }
  }, [match.id, match.status]);
  
  return (
    <div className="match-card">
      <div className="score-display">
        {match.faculty1.shortName} {match.score1} - {match.score2} {match.faculty2.shortName}
      </div>
      
      {/* Period breakdown */}
      <div className="period-scores flex gap-2 text-sm text-gray-600">
        {periodScores.map(ps => (
          <span key={ps.period}>
            {ps.period}: {ps.faculty1_score}-{ps.faculty2_score}
          </span>
        ))}
      </div>
      
      {/* Period score input (for admins) */}
      {isAdmin && match.status === 'live' && (
        <div className="period-input">
          <label>{match.current_period}:</label>
          <input 
            type="number"
            value={faculty1PeriodScore}
            onChange={(e) => setFaculty1PeriodScore(+e.target.value)}
          />
          <span>-</span>
          <input 
            type="number"
            value={faculty2PeriodScore}
            onChange={(e) => setFaculty2PeriodScore(+e.target.value)}
          />
          <button onClick={savePeriodScore}>Save</button>
        </div>
      )}
    </div>
  );
}
```

#### **For Volleyball (Show Sets Won + Set Scores):**

```typescript
function VolleyballMatchCard({ match }: { match: Match }) {
  const [periodScores, setPeriodScores] = useState<PeriodScore[]>([]);
  const [setsWon, setSetsWon] = useState({ faculty1: 0, faculty2: 0 });
  
  useEffect(() => {
    if (match.status !== 'scheduled') {
      getPeriodScores(match.id).then(scores => {
        setPeriodScores(scores);
        
        // Calculate sets won
        const f1Wins = scores.filter(s => s.faculty1_score > s.faculty2_score).length;
        const f2Wins = scores.filter(s => s.faculty2_score > s.faculty1_score).length;
        setSetsWon({ faculty1: f1Wins, faculty2: f2Wins });
      });
    }
  }, [match.id, match.status]);
  
  return (
    <div className="match-card">
      {/* Sets won (main display) */}
      <div className="score-display">
        {match.faculty1.shortName} {setsWon.faculty1} - {setsWon.faculty2} {match.faculty2.shortName}
      </div>
      
      {/* Set scores breakdown */}
      <div className="set-scores text-sm text-gray-600">
        ({periodScores.map(ps => `${ps.faculty1_score}-${ps.faculty2_score}`).join(', ')})
      </div>
    </div>
  );
}
```

#### **For Futsal (Show Half Scores + Penalties):**

```typescript
function FutsalMatchCard({ match }: { match: Match }) {
  const [periodScores, setPeriodScores] = useState<PeriodScore[]>([]);
  const [hasPenalties, setHasPenalties] = useState(false);
  
  useEffect(() => {
    if (match.status !== 'scheduled') {
      getPeriodScores(match.id).then(scores => {
        setPeriodScores(scores);
        setHasPenalties(scores.some(s => s.period === 'PEN'));
      });
    }
  }, [match.id, match.status]);
  
  const regScore = periodScores
    .filter(s => s.period !== 'PEN')
    .reduce((acc, s) => ({
      faculty1: acc.faculty1 + s.faculty1_score,
      faculty2: acc.faculty2 + s.faculty2_score
    }), { faculty1: 0, faculty2: 0 });
  
  const penScore = periodScores.find(s => s.period === 'PEN');
  
  return (
    <div className="match-card">
      <div className="score-display">
        {match.faculty1.shortName} {regScore.faculty1}
        {hasPenalties && ` (${penScore?.faculty1_score})`}
        {' - '}
        {regScore.faculty2}
        {hasPenalties && ` (${penScore?.faculty2_score})`}
        {' '}{match.faculty2.shortName}
      </div>
      
      {hasPenalties && (
        <div className="text-sm text-gray-600">
          Won on penalties
        </div>
      )}
    </div>
  );
}
```

---

## 🎮 **Admin Workflow**

### **Basketball:**
1. Match starts → Set `current_period = 'Q1'`
2. Q1 ends → Enter Q1 score (12-10)
3. Advance to Q2 → `current_period = 'Q2'`
4. Q2 ends → Enter Q2 score (15-14)
5. Repeat for Q3, Q4
6. Match total auto-updates: 65-57

### **Volleyball:**
1. Match starts → Set `current_period = 'Set 1'`
2. Set 1 ends → Enter score (25-22)
3. Advance to Set 2
4. Set 2 ends → Enter score (23-25)
5. Set 3 ends → Enter score (25-20)
6. Winner: Faculty1 (2-1 in sets)

### **Futsal with Penalties:**
1. 1st Half ends → Enter score (1-1)
2. 2nd Half ends → Enter score (1-1) → Total: 2-2
3. If tied → Advance to `current_period = 'PEN'`
4. Penalties end → Enter score (4-3)
5. Winner: Faculty1 (4-3 on penalties)

---

## 📊 **Queries**

### **Get Match with Period Scores:**
```sql
SELECT 
  m.id,
  c.name as competition,
  f1.short_name || ' vs ' || f2.short_name as matchup,
  m.score1,
  m.score2,
  array_agg(ps.period || ': ' || ps.faculty1_score || '-' || ps.faculty2_score 
    ORDER BY ps.period) as period_breakdown
FROM matches m
JOIN competitions c ON m.competition_id = c.id
JOIN faculties f1 ON m.faculty1_id = f1.id
JOIN faculties f2 ON m.faculty2_id = f2.id
LEFT JOIN period_scores ps ON ps.match_id = m.id
WHERE m.id = 'match-uuid'
GROUP BY m.id, c.name, f1.short_name, f2.short_name;
```

### **Get Sets Won for Volleyball:**
```sql
SELECT 
  m.id,
  COUNT(CASE WHEN ps.faculty1_score > ps.faculty2_score THEN 1 END) as faculty1_sets,
  COUNT(CASE WHEN ps.faculty2_score > ps.faculty1_score THEN 1 END) as faculty2_sets
FROM matches m
LEFT JOIN period_scores ps ON ps.match_id = m.id
WHERE m.id = 'match-uuid'
  AND m.competition_id = 'volleyball'
GROUP BY m.id;
```

---

## ✅ **Benefits**

| Feature | Without period_scores | With period_scores |
|---------|----------------------|-------------------|
| Quarter-by-quarter | ❌ No | ✅ Yes |
| Set scores | ❌ No | ✅ Yes |
| Penalty tracking | ❌ No | ✅ Yes |
| Detailed analytics | ❌ Limited | ✅ Full |
| Auto-calculation | ❌ Manual | ✅ Automatic trigger |

---

## 🎯 **Summary**

1. **`matches.current_period`** → Which period is playing NOW
2. **`period_scores`** → Score for EACH period
3. **`matches.score1/score2`** → Total (auto-calculated from period_scores)

**Perfect for:**
- 🏀 Basketball quarter tracking
- 🏐 Volleyball set tracking
- 🏸 Badminton set tracking
- ⚽ Futsal halves + penalties
- 📊 Detailed match analytics

---

**Run both SQL files:**
1. `add-period-to-matches.sql` (current_period column)
2. `add-period-scores-table.sql` (period_scores table)

Then implement the UI! 🚀







