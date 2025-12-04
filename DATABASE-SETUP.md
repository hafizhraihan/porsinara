# 🏀 Basketball Stats Database Setup

## 📋 Table of Contents
- [Quick Start](#-quick-start)
- [Files Overview](#-files-overview)
- [Troubleshooting](#-troubleshooting)

---

## 🚀 Quick Start

### First Time Setup

1. **Create Tables** (In Supabase SQL Editor)
   ```sql
   -- Step 1: Create players table
   -- Run: create-players-table.sql
   
   -- Step 2: Create basketball_stats table
   -- Run: create-basketball-stats-table.sql
   
   -- Step 3: Fix permissions
   -- Run: quick-fix.sql
   ```

2. **Add Sample Data** (Optional)
   ```sql
   -- Run: add-sample-players.sql
   ```

3. **Test Connection**
   ```
   Open: http://localhost:3000/test-db
   ```

4. **Use Admin Dashboard**
   ```
   Go to: http://localhost:3000/admin/dashboard
   Find basketball match → Click ⌄ to expand → Add stats
   ```

---

### If Having Issues

**Most common fix:**
```sql
-- In Supabase SQL Editor, run:
-- quick-fix.sql
```

**Visual test:**
```
Open: http://localhost:3000/test-db
```

**Detailed guide:**
```
Read: FIX-GUIDE.md (3-step solution)
```

---

## 📁 Files Overview

### 🔴 Critical Files (Must Run)

| File | Purpose | When to Run |
|------|---------|-------------|
| `create-players-table.sql` | Create players table | First time setup |
| `create-basketball-stats-table.sql` | Create stats table with auto-calculation | First time setup |
| `quick-fix.sql` ⭐ | Fix all permission issues | When stats won't save |

### 🟡 Diagnostic Files

| File | Purpose | When to Use |
|------|---------|-------------|
| `diagnose-basketball-stats.sql` | 13 comprehensive checks | Troubleshooting |
| `src/app/test-db/page.tsx` | Visual connection test | Quick verification |
| `src/lib/test-connection.ts` | Test functions | Used by test page |

### 🟢 Optional Files

| File | Purpose | When to Use |
|------|---------|-------------|
| `add-sample-players.sql` | Sample player data | Testing |
| `test-basketball-stats-crud.sql` | Manual CRUD testing | Advanced debugging |
| `fix-basketball-stats-permissions.sql` | Manual permission fix | If quick-fix fails |

### 📘 Documentation

| File | Content |
|------|---------|
| `FIX-GUIDE.md` ⭐ | **Start here** - 3-step solution |
| `TROUBLESHOOTING.md` | Detailed error solutions |
| `refresh-supabase-schema.md` | Cache & connection issues |
| `DATABASE-SETUP.md` | This file - Overview |

---

## 🎯 Common Workflows

### Workflow 1: Fresh Setup
```
1. create-players-table.sql
2. create-basketball-stats-table.sql
3. quick-fix.sql
4. Open /test-db → Verify all ✅
5. Use admin dashboard
```

### Workflow 2: Permission Issues
```
1. quick-fix.sql
2. Open /test-db → Check results
3. If still failing → diagnose-basketball-stats.sql
4. Read TROUBLESHOOTING.md
```

### Workflow 3: Verify Everything Works
```
1. Open: http://localhost:3000/test-db
2. All should be ✅
3. Open browser console (F12) for details
4. Test in admin dashboard
```

---

## 🔧 Database Schema

### Tables Created

```
players
├── id (uuid, PK)
├── name (varchar)
├── student_id (varchar, unique)
├── faculty_id (uuid, FK → faculties)
├── position (varchar)
├── jersey_number (integer)
├── created_at (timestamp)
└── updated_at (timestamp)

basketball_stats
├── id (uuid, PK)
├── match_id (uuid, FK → matches)
├── player_id (uuid, FK → players)
├── free_throw_attempt (integer)
├── free_throw_made (integer)
├── two_point_attempt (integer)
├── two_point_made (integer)
├── three_point_attempt (integer)
├── three_point_made (integer)
├── offensive_rebound (integer)
├── defensive_rebound (integer)
├── total_rebound (integer) ← Auto-calculated
├── assists (integer)
├── steals (integer)
├── blocks (integer)
├── turnovers (integer)
├── fouls (integer)
├── total_points (integer) ← Auto-calculated
├── minutes_played (integer)
├── is_starter (boolean)
├── created_at (timestamp)
└── updated_at (timestamp)
```

### Auto-Calculation Trigger

```sql
-- Runs BEFORE INSERT OR UPDATE
total_points = free_throw_made + (two_point_made * 2) + (three_point_made * 3)
total_rebound = offensive_rebound + defensive_rebound
```

### RLS Policies

Both `players` and `basketball_stats` have:
- ✅ SELECT (read) - Public access
- ✅ INSERT (create) - Public access
- ✅ UPDATE (modify) - Public access
- ✅ DELETE (remove) - Public access

---

## 🚨 Common Issues

| Issue | Quick Fix |
|-------|-----------|
| Stats won't save | Run `quick-fix.sql` |
| "Permission denied" | Run `quick-fix.sql` |
| "Relation does not exist" | Run `create-basketball-stats-table.sql` |
| "Foreign key violation" | Check match_id and player_id exist |
| "Check constraint violation" | Ensure `made <= attempt` |
| Auto-calculation not working | Verify trigger in `quick-fix.sql` |

**Full error solutions:** See `TROUBLESHOOTING.md`

---

## ✅ Verification

After setup, verify:

```sql
-- 1. Tables exist
SELECT COUNT(*) FROM players;
SELECT COUNT(*) FROM basketball_stats;

-- 2. Can insert
INSERT INTO basketball_stats (
  match_id, player_id, 
  free_throw_attempt, free_throw_made,
  two_point_attempt, two_point_made
) VALUES (
  'valid-match-id', 'valid-player-id',
  5, 3, 10, 7
);

-- 3. Auto-calculation works
-- Should show total_points = 17 (3 + 7*2)
SELECT total_points FROM basketball_stats 
WHERE player_id = 'valid-player-id';
```

Or use visual test:
```
http://localhost:3000/test-db
```

---

## 📊 Admin Dashboard Features

When everything is set up:

1. **View Matches**
   - Lists all matches with basketball icon for basketball games

2. **Expand Stats** (Basketball only)
   - Click ⌄ button next to Edit/Delete
   - Shows both teams side-by-side

3. **Add Stats**
   - + / - buttons for each stat
   - Attempt and Successful columns
   - Offensive/Defensive rebounds
   - Assists, Turnovers

4. **Save Stats**
   - "Save All Stats" button
   - Client-side validation (made <= attempt)
   - Auto-calculates total_points and total_rebound

5. **View Results**
   - Refresh page to verify stats saved
   - Stats persist across sessions

---

## 💡 Pro Tips

1. **Always start with `FIX-GUIDE.md`** - 3-step solution covers 95% of cases
2. **Use `/test-db` page** - Visual feedback beats SQL console
3. **Check browser console (F12)** - Detailed logs with emojis
4. **Run `quick-fix.sql` after any DB changes** - Ensures permissions
5. **Restart Supabase project** - Forces schema cache refresh

---

## 🔗 Quick Links

- **Visual Test:** http://localhost:3000/test-db
- **Admin Dashboard:** http://localhost:3000/admin/dashboard
- **Main Site:** http://localhost:3000

---

## 📞 Getting Help

If stuck, provide:
1. Output from `quick-fix.sql`
2. Screenshot from `/test-db` page
3. Browser console errors (F12)
4. Supabase Query Logs

---

**Need help now? → Read `FIX-GUIDE.md`** 🚀


