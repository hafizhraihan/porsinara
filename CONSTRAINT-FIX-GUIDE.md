# 🔧 Fix Basketball Stats Constraints

## 🚨 Problem

Getting error: **"new row violates check constraint 'basketball_stats_check2'"**

This happens when trying to save basketball stats in the admin dashboard.

---

## 🔍 Step 1: Diagnose the Issue

Run this in Supabase SQL Editor:

```sql
-- Copy paste entire: check-constraints.sql
```

**Look for:**
- Constraint name: `basketball_stats_check2`
- Constraint definition: Shows what rule is being violated

**Common problematic constraints:**
```sql
-- TOO STRICT - blocks valid data:
CHECK (free_throw_made <= free_throw_attempt)  -- This is OK
CHECK (two_point_made <= two_point_attempt)    -- This is OK
CHECK (three_point_made <= three_point_attempt) -- This is OK

-- But combined with these (BAD):
CHECK (free_throw_made > 0 AND free_throw_attempt = 0) -- Blocks 0 attempts
```

---

## 🛠️ Step 2: Fix the Constraints

Run this in Supabase SQL Editor:

```sql
-- Copy paste entire: fix-basketball-constraints.sql
```

**What it does:**
1. ✅ Shows current constraints
2. ✅ Drops old overly-strict constraints
3. ✅ Adds better constraints that only check `made <= attempt`
4. ✅ Tests with valid data (4 test cases)
5. ✅ Confirms fix worked

**Expected output:**
```
✅ Test 1 PASSED: Can insert with made < attempt
✅ Test 2 PASSED: Can insert with made = attempt
✅ Test 3 PASSED: Can insert with only attempts (0 made)
✅ Test 4 PASSED: Correctly rejected made > attempt
✅ CONSTRAINTS FIXED
```

---

## 🎯 What Gets Fixed

### **Before (Problematic):**
```sql
-- Example of overly strict constraint:
CHECK (free_throw_made <= free_throw_attempt)
CHECK (free_throw_made > 0 OR free_throw_attempt = 0)
-- Problem: Can't enter "5 attempts, 0 made" (all misses)
```

### **After (Better):**
```sql
-- Simple and correct:
CHECK (free_throw_made <= free_throw_attempt)
-- Allows: 5 attempts, 0 made ✅
-- Allows: 5 attempts, 3 made ✅
-- Allows: 5 attempts, 5 made ✅
-- Blocks: 5 attempts, 10 made ❌ (correctly rejects)
```

---

## 📋 Valid Data Examples

After fix, these should ALL work:

### ✅ **Valid Case 1: Some Success**
```
Free Throw: 5 Attempt, 3 Successful
2-Point: 10 Attempt, 7 Successful
3-Point: 5 Attempt, 2 Successful
Result: ✅ Saves successfully
Total Points: 3 + (7×2) + (2×3) = 3 + 14 + 6 = 23
```

### ✅ **Valid Case 2: Perfect Shooting**
```
Free Throw: 5 Attempt, 5 Successful (100%)
2-Point: 10 Attempt, 10 Successful (100%)
Result: ✅ Saves successfully
Total Points: 5 + (10×2) = 25
```

### ✅ **Valid Case 3: All Misses**
```
Free Throw: 5 Attempt, 0 Successful (0%)
2-Point: 10 Attempt, 0 Successful (0%)
Result: ✅ Saves successfully
Total Points: 0
```

### ✅ **Valid Case 4: No Attempts Yet**
```
Free Throw: 0 Attempt, 0 Successful
2-Point: 0 Attempt, 0 Successful
Result: ✅ Saves successfully
Total Points: 0
```

### ❌ **Invalid Case: More Made Than Attempt**
```
Free Throw: 5 Attempt, 10 Successful
Result: ❌ Correctly rejected
Error: "new row violates check constraint"
```

---

## 🧪 Test After Fix

### **1. In Supabase (SQL)**
```sql
-- Test insert with all misses (should work now):
INSERT INTO basketball_stats (
  match_id,
  player_id,
  free_throw_attempt,
  free_throw_made,
  two_point_attempt,
  two_point_made
) VALUES (
  'valid-match-id',
  'valid-player-id',
  5, 0,  -- 5 attempts, 0 made (all misses) ✅
  10, 0  -- 10 attempts, 0 made (all misses) ✅
);
```

### **2. In Admin Dashboard**
1. Open: `http://localhost:3000/admin/dashboard`
2. Find basketball match
3. Click ⌄ to expand stats
4. Test these scenarios:
   - Add 5 FT attempts, 3 successful → Save ✅
   - Add 5 FT attempts, 0 successful → Save ✅
   - Add 5 FT attempts, 10 successful → Save ❌ (should show error)
5. All valid cases should save successfully

---

## 🔍 Root Cause Analysis

### **Why Did This Happen?**

When `create-basketball-stats-table.sql` was run, it likely created:
```sql
CREATE TABLE basketball_stats (
  ...
  free_throw_made INTEGER DEFAULT 0 CHECK (free_throw_made >= 0),
  free_throw_attempt INTEGER DEFAULT 0 CHECK (free_throw_attempt >= 0),
  ...
  CHECK (free_throw_made <= free_throw_attempt), -- basketball_stats_check1
  CHECK (two_point_made <= two_point_attempt),   -- basketball_stats_check2
  CHECK (three_point_made <= three_point_attempt) -- basketball_stats_check3
);
```

**These constraints are CORRECT**, but the error suggests either:
1. Frontend sending invalid data (made > attempt)
2. Additional hidden constraints blocking valid data
3. Constraint naming/ordering issue

---

## 🛡️ Prevention - Frontend Validation

The admin dashboard already has validation:
```typescript
// In src/app/admin/dashboard/page.tsx
if (stats.made > stats.attempt) {
  toast.error(`Validation error: Made shots cannot exceed attempts`)
  return
}
```

**But also add:**
```typescript
// Ensure attempt is set if made > 0
if (stats.made > 0 && stats.attempt === 0) {
  toast.error(`Cannot have made shots without attempts`)
  return
}
```

---

## 🚀 Quick Fix Steps

1. **Check constraints:**
   ```sql
   -- Run: check-constraints.sql
   ```

2. **Fix constraints:**
   ```sql
   -- Run: fix-basketball-constraints.sql
   ```

3. **Verify in dashboard:**
   ```
   http://localhost:3000/admin/dashboard
   Test saving stats
   ```

4. **If still failing:**
   - Check browser console (F12) for error details
   - Share the full error message
   - Check Supabase Query Logs

---

## 📞 Troubleshooting

### **Error Still Occurs After Fix?**

Check the **actual data being sent**:
```typescript
// In browser console (F12) while on admin dashboard:
console.log('Stats being saved:', playerStats)
```

Look for:
- `made > attempt` (invalid)
- `made > 0` but `attempt === 0` (invalid)
- Negative values (invalid)

### **Can't Drop Constraints?**

If you get "constraint is being used by table", try:
```sql
ALTER TABLE basketball_stats DROP CONSTRAINT basketball_stats_check2 CASCADE;
```

### **Need to Reset Table?**

**Nuclear option** (deletes ALL stats):
```sql
DROP TABLE basketball_stats CASCADE;
-- Then re-run: create-basketball-stats-table.sql
-- Then run: fix-basketball-constraints.sql
```

---

## ✅ Success Checklist

After running the fix, verify:

- [ ] `check-constraints.sql` shows constraints
- [ ] `fix-basketball-constraints.sql` runs without errors
- [ ] All 4 tests pass (Test 1-4)
- [ ] Can save stats with made < attempt
- [ ] Can save stats with made = attempt
- [ ] Can save stats with made = 0
- [ ] Cannot save stats with made > attempt (correct rejection)
- [ ] Admin dashboard saves successfully
- [ ] Stats persist after page refresh

---

## 📝 Summary

**Problem:** Constraint `basketball_stats_check2` too strict

**Solution:** Drop old constraints, add simpler ones

**Result:** Can save valid stats (including 0 made, or 100% success rate)

**Command:** Run `fix-basketball-constraints.sql` in Supabase SQL Editor

---

**Need help?** Share:
1. Output from `check-constraints.sql`
2. Error message from browser console
3. Data you're trying to save

