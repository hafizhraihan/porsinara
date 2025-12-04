# 🔧 Troubleshooting Basketball Stats

## 🎯 Quick Start (Paling Cepat!)

### 1️⃣ **Run Quick Fix Script**
```sql
-- Copy paste seluruh isi dari: quick-fix.sql
-- Paste ke Supabase SQL Editor
-- Click RUN
```

**Script ini akan:**
- ✅ Verify table exists
- ✅ Enable RLS
- ✅ Drop old policies
- ✅ Create fresh policies
- ✅ Grant all permissions
- ✅ Test INSERT operation
- ✅ Verify auto-calculation works
- ✅ Clean up test data

**Expected Output:**
```
✅ basketball_stats table EXISTS
✅ Auto-calculation trigger EXISTS
✅ INSERT test SUCCESSFUL
✅ Auto-calculation WORKS - total_points: 17
🧹 Test data cleaned up
✅ SETUP COMPLETE
```

---

## 📋 Detailed Troubleshooting

### Jika Quick Fix Tidak Berhasil:

#### **Step 1: Diagnose Issue**
```sql
-- Run: diagnose-basketball-stats.sql
```

Cek output setiap query:

| Query | Expected | If Failed |
|-------|----------|-----------|
| #1 | `basketball_stats` exists | Run `create-basketball-stats-table.sql` |
| #4 | `rls_enabled = true` | Run `ALTER TABLE basketball_stats ENABLE ROW LEVEL SECURITY;` |
| #5 | 4 policies shown | Run `fix-basketball-stats-permissions.sql` |
| #6 | `calculate_basketball_totals_trigger` shown | Run trigger creation from `create-basketball-stats-table.sql` |
| #7-13 | Returns data/counts | Permission issue, run `quick-fix.sql` |

#### **Step 2: Check Table Structure**
```sql
SELECT column_name, data_type 
FROM information_schema.columns
WHERE table_name = 'basketball_stats'
ORDER BY ordinal_position;
```

**Expected columns (21 total):**
- `id` (uuid)
- `match_id` (uuid)
- `player_id` (uuid)
- `free_throw_made` (integer)
- `free_throw_attempt` (integer)
- `two_point_made` (integer)
- `two_point_attempt` (integer)
- `three_point_made` (integer)
- `three_point_attempt` (integer)
- `offensive_rebound` (integer)
- `defensive_rebound` (integer)
- `total_rebound` (integer) ← Auto-calculated
- `assists` (integer)
- `steals` (integer)
- `blocks` (integer)
- `turnovers` (integer)
- `fouls` (integer)
- `total_points` (integer) ← Auto-calculated
- `minutes_played` (integer)
- `is_starter` (boolean)
- `created_at` (timestamp)
- `updated_at` (timestamp)

#### **Step 3: Verify Foreign Keys**
```sql
-- Get sample match_id
SELECT id, competition_id, status 
FROM matches 
WHERE competition_id IN ('basketball-putra', 'basketball-putri')
LIMIT 3;

-- Get sample player_id
SELECT id, name, faculty_id 
FROM players 
LIMIT 3;
```

Jika **tidak ada data**, tambahkan dulu:
- Matches: Via admin dashboard atau manual INSERT
- Players: Run `add-sample-players.sql`

#### **Step 4: Test CRUD Operations**
```sql
-- Follow instructions in: test-basketball-stats-crud.sql
```

---

## 🚨 Common Errors & Solutions

### Error 1: `permission denied for table basketball_stats`
**Cause:** RLS policies tidak ada atau salah

**Solution:**
```sql
-- Run: quick-fix.sql
-- OR
-- Run: fix-basketball-stats-permissions.sql
```

---

### Error 2: `relation "basketball_stats" does not exist`
**Cause:** Table belum dibuat

**Solution:**
```sql
-- 1. Create players table first (dependency)
-- Run: create-players-table.sql

-- 2. Create basketball_stats table
-- Run: create-basketball-stats-table.sql
```

---

### Error 3: `insert or update on table "basketball_stats" violates foreign key constraint`
**Cause:** `match_id` atau `player_id` tidak valid

**Solution:**
```sql
-- Verify IDs exist:
SELECT id FROM matches WHERE id = 'your-match-id';
SELECT id FROM players WHERE id = 'your-player-id';

-- If not found, check available IDs:
SELECT id FROM matches WHERE competition_id LIKE 'basketball%';
SELECT id FROM players WHERE faculty_id = 'your-faculty-id';
```

---

### Error 4: `new row violates check constraint "basketball_stats_check1"`
**Cause:** `made > attempt` (e.g., 10 successful shots but only 5 attempts)

**Solution:** Fix data entry:
- Ensure `made <= attempt` for all shooting stats
- Frontend validation sudah ditambahkan di admin dashboard

---

### Error 5: `auto-calculation not working` (total_points = 0)
**Cause:** Trigger tidak ada atau tidak aktif

**Solution:**
```sql
-- Check trigger:
SELECT trigger_name, event_manipulation
FROM information_schema.triggers
WHERE event_object_table = 'basketball_stats';

-- If not found, create trigger:
CREATE OR REPLACE FUNCTION calculate_basketball_totals() 
RETURNS TRIGGER AS $$
BEGIN
  NEW.total_points := NEW.free_throw_made + (NEW.two_point_made * 2) + (NEW.three_point_made * 3);
  NEW.total_rebound := NEW.offensive_rebound + NEW.defensive_rebound;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS calculate_basketball_totals_trigger ON basketball_stats;

CREATE TRIGGER calculate_basketball_totals_trigger 
BEFORE INSERT OR UPDATE ON basketball_stats 
FOR EACH ROW 
EXECUTE FUNCTION calculate_basketball_totals();
```

---

### Error 6: `Cannot read properties of undefined (reading 'from')`
**Cause:** Supabase client tidak ter-initialize atau ENV variables missing

**Solution:**
1. Check `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

2. Restart dev server:
```bash
# Stop current server (Ctrl+C)
npm run dev
```

3. Test connection:
```typescript
// Add to admin dashboard
import { testSupabaseConnection } from '@/lib/test-connection'

useEffect(() => {
  testSupabaseConnection()
}, [])
```

---

## 🔄 Reset Everything (Nuclear Option)

Jika semua gagal, reset dari awal:

```sql
-- 1. Drop everything
DROP TABLE IF EXISTS basketball_stats CASCADE;
DROP TABLE IF EXISTS players CASCADE;
DROP FUNCTION IF EXISTS calculate_basketball_totals() CASCADE;

-- 2. Recreate
-- Run: create-players-table.sql
-- Run: create-basketball-stats-table.sql
-- Run: quick-fix.sql

-- 3. Add sample data
-- Run: add-sample-players.sql
```

---

## ✅ Verification Checklist

Setelah fix, verify dengan checklist ini:

```sql
-- 1. Table exists
SELECT COUNT(*) FROM basketball_stats; -- Should return 0 or more (no error)

-- 2. Can INSERT
INSERT INTO basketball_stats (match_id, player_id, free_throw_attempt, free_throw_made)
VALUES ('valid-match-id', 'valid-player-id', 5, 3);

-- 3. Auto-calculation works
SELECT total_points, total_rebound FROM basketball_stats WHERE id = 'inserted-id';
-- total_points should be 3 (1 FT made)

-- 4. Can UPDATE
UPDATE basketball_stats SET assists = 5 WHERE id = 'inserted-id';

-- 5. Can DELETE
DELETE FROM basketball_stats WHERE id = 'inserted-id';
```

Jika **semua 5 operations berhasil**, setup sudah benar! ✅

---

## 🆘 Still Having Issues?

1. **Restart Supabase Project:**
   - Supabase Dashboard → Project Settings → General → Restart Project
   - Wait 2-3 minutes

2. **Clear Browser Cache:**
   - Hard refresh: `Ctrl + Shift + R`
   - Or clear all browser cache

3. **Check Supabase Logs:**
   - Supabase Dashboard → Logs → Query Logs
   - Look for failed queries with error messages

4. **Test with Supabase Client:**
   ```typescript
   import { testSupabaseConnection } from '@/lib/test-connection'
   testSupabaseConnection() // Check browser console
   ```

---

## 📞 Contact Info

Jika masih stuck, share screenshot/copy paste error message lengkap dari:
- Supabase SQL Editor output
- Browser console (F12)
- Supabase Logs


