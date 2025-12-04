# 🎯 Simple Set Scores Solution

## ✅ **Your Approach is BETTER!**

Instead of creating a separate `period_scores` table, just **add columns to `matches`**!

---

## 📊 **Column Mapping by Sport**

| Sport | Set 1 | Set 2 | Set 3 | Set 4 | Set 5 |
|-------|-------|-------|-------|-------|-------|
| 🏀 **Basketball** | Q1 | Q2 | Q3 | Q4 | OT |
| ⚽ **Futsal** | 1st Half | 2nd Half | Penalties | - | - |
| 🏐 **Volleyball** | Set 1 | Set 2 | Set 3 | Set 4 | Set 5 |
| 🏸 **Badminton** | Set 1 | Set 2 | Set 3 | - | - |

---

## 🏗️ **Database Structure**

```sql
matches:
  id | competition | set1_score1 | set1_score2 | set2_score1 | set2_score2 | ... | score1 | score2
  1  | basketball  | 12          | 10          | 15          | 14          | ... | 65     | 57
  2  | futsal      | 1           | 1           | 1           | 1           | 4  | 3 | ... | 6 | 5
  3  | volleyball  | 25          | 22          | 23          | 25          | ... | 73     | 67
```

**Benefits:**
- ✅ **Simple** - Just add columns to existing table
- ✅ **No JOINs** - All data in one table
- ✅ **Auto-calculation** - Trigger updates total score
- ✅ **Flexible** - Works for all sports

---

## 🎮 **Examples**

### **Basketball (BBS vs SOD):**
```sql
UPDATE matches SET
  set1_score1 = 12, set1_score2 = 10,  -- Q1
  set2_score1 = 15, set2_score2 = 14,  -- Q2
  set3_score1 = 18, set3_score2 = 16,  -- Q3
  set4_score1 = 20, set4_score2 = 17   -- Q4
WHERE id = 'match-uuid';

-- Auto-calculated:
-- score1 = 65 (12+15+18+20)
-- score2 = 57 (10+14+16+17)
```

**Display:** 
```
BBS 65 - 57 SOD
Q1: 12-10 | Q2: 15-14 | Q3: 18-16 | Q4: 20-17
```

---

### **Volleyball (SOCS vs BBS):**
```sql
UPDATE matches SET
  set1_score1 = 25, set1_score2 = 22,  -- Set 1 (SOCS wins)
  set2_score1 = 23, set2_score2 = 25,  -- Set 2 (BBS wins)
  set3_score1 = 25, set3_score2 = 20   -- Set 3 (SOCS wins)
WHERE id = 'match-uuid';

-- Auto-calculated:
-- score1 = 73, score2 = 67 (total points)
-- But winner is SOCS (2-1 in sets)
```

**Display:**
```
SOCS 2 - 1 BBS
(25-22, 23-25, 25-20)
```

---

### **Futsal with Penalties (BBS vs SOCS):**
```sql
UPDATE matches SET
  set1_score1 = 1, set1_score2 = 1,  -- 1st Half
  set2_score1 = 1, set2_score2 = 1,  -- 2nd Half
  set3_score1 = 4, set3_score2 = 3   -- Penalties
WHERE id = 'match-uuid';

-- Regulation (set1 + set2): 2-2
-- Penalties (set3): 4-3
```

**Display:**
```
BBS 2 (4) - 2 (3) SOCS
90': 2-2 | Penalties: 4-3
```

---

### **Badminton (SOD vs FDCHT):**
```sql
UPDATE matches SET
  set1_score1 = 21, set1_score2 = 18,  -- Set 1 (SOD wins)
  set2_score1 = 19, set2_score2 = 21,  -- Set 2 (FDCHT wins)
  set3_score1 = 21, set3_score2 = 15   -- Set 3 (SOD wins)
WHERE id = 'match-uuid';

-- Winner: SOD (2-1 in sets)
```

**Display:**
```
SOD 2 - 1 FDCHT
(21-18, 19-21, 21-15)
```

---

## 🚀 **Implementation**

### **Step 1: Run SQL**
```sql
-- Supabase SQL Editor:
-- Copy & paste: add-set-scores-to-matches.sql
-- Click RUN
```

**Expected output:**
```
✅ SET SCORE COLUMNS ADDED
10 columns added (set1-5 for each faculty)
Auto-calculation trigger created
✅ Auto-calculation CORRECT!
Faculty1: 65, Faculty2: 57
```

---

### **Step 2: Update TypeScript Types**

In `src/lib/supabase.ts`:

```typescript
matches: {
  Row: {
    id: string
    competition_id: string
    faculty1_id: string
    faculty2_id: string
    score1: number  // Total (auto-calculated)
    score2: number  // Total (auto-calculated)
    // Period/Set scores
    set1_score1: number | null
    set1_score2: number | null
    set2_score1: number | null
    set2_score2: number | null
    set3_score1: number | null
    set3_score2: number | null
    set4_score1: number | null
    set4_score2: number | null
    set5_score1: number | null
    set5_score2: number | null
    status: 'scheduled' | 'live' | 'completed'
    current_period: string
    date: string
    time: string
    location: string
    round: string | null
    youtube_stream_link: string | null
    created_at: string
    updated_at: string
  }
}
```

---

### **Step 3: Helper Functions**

```typescript
// Get sets won (for volleyball/badminton)
export function getSetsWon(match: Match) {
  const sets = [
    { f1: match.set1_score1, f2: match.set1_score2 },
    { f1: match.set2_score1, f2: match.set2_score2 },
    { f1: match.set3_score1, f2: match.set3_score2 },
    { f1: match.set4_score1, f2: match.set4_score2 },
    { f1: match.set5_score1, f2: match.set5_score2 },
  ].filter(s => s.f1 !== null && s.f2 !== null);
  
  const faculty1Wins = sets.filter(s => s.f1! > s.f2!).length;
  const faculty2Wins = sets.filter(s => s.f2! > s.f1!).length;
  
  return { faculty1Wins, faculty2Wins };
}

// Get regulation score (futsal - exclude penalties)
export function getRegulationScore(match: Match) {
  return {
    faculty1: (match.set1_score1 || 0) + (match.set2_score1 || 0),
    faculty2: (match.set1_score2 || 0) + (match.set2_score2 || 0),
  };
}

// Format set scores for display
export function formatSetScores(match: Match) {
  const sets = [
    [match.set1_score1, match.set1_score2],
    [match.set2_score1, match.set2_score2],
    [match.set3_score1, match.set3_score2],
    [match.set4_score1, match.set4_score2],
    [match.set5_score1, match.set5_score2],
  ].filter(s => s[0] !== null && s[1] !== null);
  
  return sets.map(s => `${s[0]}-${s[1]}`).join(', ');
}
```

---

### **Step 4: UI Components**

#### **Basketball Display:**
```typescript
function BasketballScore({ match }: { match: Match }) {
  return (
    <div>
      <div className="text-2xl font-bold">
        {match.faculty1.shortName} {match.score1} - {match.score2} {match.faculty2.shortName}
      </div>
      <div className="text-sm text-gray-600">
        {match.set1_score1 !== null && `Q1: ${match.set1_score1}-${match.set1_score2}`}
        {match.set2_score1 !== null && ` | Q2: ${match.set2_score1}-${match.set2_score2}`}
        {match.set3_score1 !== null && ` | Q3: ${match.set3_score1}-${match.set3_score2}`}
        {match.set4_score1 !== null && ` | Q4: ${match.set4_score1}-${match.set4_score2}`}
      </div>
    </div>
  );
}
```

#### **Volleyball Display:**
```typescript
function VolleyballScore({ match }: { match: Match }) {
  const { faculty1Wins, faculty2Wins } = getSetsWon(match);
  const setScores = formatSetScores(match);
  
  return (
    <div>
      <div className="text-2xl font-bold">
        {match.faculty1.shortName} {faculty1Wins} - {faculty2Wins} {match.faculty2.shortName}
      </div>
      <div className="text-sm text-gray-600">
        ({setScores})
      </div>
    </div>
  );
}
```

#### **Futsal with Penalties:**
```typescript
function FutsalScore({ match }: { match: Match }) {
  const reg = getRegulationScore(match);
  const hasPenalties = match.set3_score1 !== null;
  
  return (
    <div>
      <div className="text-2xl font-bold">
        {match.faculty1.shortName} {reg.faculty1}
        {hasPenalties && ` (${match.set3_score1})`}
        {' - '}
        {reg.faculty2}
        {hasPenalties && ` (${match.set3_score2})`}
        {' '}{match.faculty2.shortName}
      </div>
      {hasPenalties && (
        <div className="text-sm text-gray-600">
          90': {reg.faculty1}-{reg.faculty2} | Penalties: {match.set3_score1}-{match.set3_score2}
        </div>
      )}
    </div>
  );
}
```

---

## ⚖️ **Comparison**

| Feature | Separate Table | **Columns in matches** ✅ |
|---------|---------------|--------------------------|
| Complexity | High (JOINs, triggers) | **Low** |
| Query Speed | Slower (JOIN) | **Faster** (single table) |
| Setup | 2 tables + triggers | **Just add columns** |
| Flexibility | Very flexible | **Good enough** |
| Code Simplicity | Complex | **Very simple** |

---

## ✅ **Benefits of This Approach:**

1. ✅ **Simpler** - No need for separate table
2. ✅ **Faster** - No JOINs needed
3. ✅ **Easier to query** - Everything in one table
4. ✅ **Auto-calculation** - Trigger updates totals
5. ✅ **Works for all sports** - Creative column usage
6. ✅ **Less code** - Fewer functions needed

---

## 🎯 **Column Usage Guide**

```
Basketball:
  set1 = Q1 ✅
  set2 = Q2 ✅
  set3 = Q3 ✅
  set4 = Q4 ✅
  set5 = OT ✅

Futsal:
  set1 = 1st Half ✅
  set2 = 2nd Half ✅
  set3 = Penalties ✅
  set4 = (unused)
  set5 = (unused)

Volleyball:
  set1 = Set 1 ✅
  set2 = Set 2 ✅
  set3 = Set 3 ✅
  set4 = Set 4 ✅
  set5 = Set 5 ✅

Badminton:
  set1 = Set 1 ✅
  set2 = Set 2 ✅
  set3 = Set 3 ✅
  set4 = (unused)
  set5 = (unused)
```

---

## 🚀 **Quick Start:**

1. Run `add-set-scores-to-matches.sql` ✅
2. Update TypeScript types ✅
3. Use helper functions in UI ✅
4. Done! 🎉

**This is MUCH simpler than the separate table approach!** 🎯

---

**Files to use:**
- ✅ `add-set-scores-to-matches.sql` (THIS ONE!)
- ❌ ~~`add-period-scores-table.sql`~~ (Too complex, ignore this)







