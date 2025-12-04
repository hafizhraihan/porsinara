# How to Refresh Supabase Schema Cache

## Problem
Setelah membuat tabel baru (`basketball_stats`, `players`), Supabase mungkin tidak langsung mengenali tabel tersebut karena schema cache belum ter-update.

## Solutions

### 1. **Restart Supabase (Recommended)**
Di Supabase Dashboard:
1. Go to **Project Settings** → **General**
2. Scroll down to **Restart project**
3. Click **Restart project** button
4. Wait 1-2 minutes for restart to complete

### 2. **Refresh Connection dari Client**
Di file `src/lib/supabase.ts`, tambahkan query untuk force refresh:

```typescript
// Test connection and refresh schema
export async function testConnection() {
  const { data, error } = await supabase
    .from('basketball_stats')
    .select('*')
    .limit(1)
  
  if (error) {
    console.error('Connection test failed:', error)
    return false
  }
  
  console.log('Connection test successful')
  return true
}
```

Lalu panggil di admin dashboard saat load:
```typescript
useEffect(() => {
  testConnection()
}, [])
```

### 3. **Verify RLS Policies**
Run `diagnose-basketball-stats.sql` untuk cek:
- ✅ Table exists
- ✅ RLS is enabled
- ✅ Policies exist (SELECT, INSERT, UPDATE, DELETE)
- ✅ Triggers exist

Jika ada yang missing, run `fix-basketball-stats-permissions.sql`

### 4. **Clear Browser Cache**
Kadang browser cache menyimpan old schema:
1. Hard refresh: `Ctrl + Shift + R` (Windows) atau `Cmd + Shift + R` (Mac)
2. Clear all cache di browser settings
3. Restart browser

### 5. **Regenerate TypeScript Types**
Jika menggunakan Supabase CLI:

```bash
npx supabase gen types typescript --project-id your-project-ref > src/lib/database.types.ts
```

### 6. **Check API URL and Keys**
Verify `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Test with:
```typescript
console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
console.log('Anon Key:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20) + '...')
```

## Testing Steps

1. **Run diagnostic script**:
   ```sql
   -- Run in Supabase SQL Editor
   -- diagnose-basketball-stats.sql
   ```

2. **Check for errors**:
   - Table doesn't exist → Re-run `create-basketball-stats-table.sql`
   - RLS issues → Run `fix-basketball-stats-permissions.sql`
   - FK constraint fails → Check `players` and `matches` tables exist

3. **Test CRUD operations**:
   ```sql
   -- Run in Supabase SQL Editor
   -- test-basketball-stats-crud.sql
   ```

4. **Test from frontend**:
   ```typescript
   // In browser console (admin dashboard)
   const { data, error } = await supabase
     .from('basketball_stats')
     .select('*')
     .limit(1)
   
   console.log('Data:', data, 'Error:', error)
   ```

## Common Errors

### Error: "relation 'basketball_stats' does not exist"
**Solution**: Table not created. Run `create-basketball-stats-table.sql`

### Error: "permission denied for table basketball_stats"
**Solution**: RLS policy issue. Run `fix-basketball-stats-permissions.sql`

### Error: "insert or update violates foreign key constraint"
**Solution**: `match_id` or `player_id` tidak valid. Check dengan:
```sql
SELECT id FROM matches WHERE id = 'your-match-id';
SELECT id FROM players WHERE id = 'your-player-id';
```

### Error: "new row violates check constraint"
**Solution**: Validation error (e.g., made > attempt). Fix data entry logic.

## Next Steps

1. Run `diagnose-basketball-stats.sql` first
2. If issues found, run `fix-basketball-stats-permissions.sql`
3. Test with `test-basketball-stats-crud.sql`
4. If still failing, restart Supabase project
5. Clear browser cache and hard refresh

---

**Note**: Jika semua langkah sudah dilakukan tapi masih error, bisa jadi ada issue dengan Supabase project. Consider contacting Supabase support atau re-create table dari scratch.


