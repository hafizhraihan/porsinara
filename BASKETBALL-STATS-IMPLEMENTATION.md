# Basketball Stats Implementation Guide

## Overview
This guide explains how to implement player statistics for basketball matches, including both Basketball Putra and Basketball Putri competitions.

## Database Structure

### Key Concept: **No `competition_id` needed in stats table**
The `match_id` already contains competition information through the matches table relationship:
```
basketball_stats → match → competition
```

### Tables Created

#### 1. **players** table
Stores all player information across all sports.

```sql
- id (UUID, primary key)
- name (VARCHAR)
- student_id (VARCHAR, unique)
- faculty_id (UUID, references faculties)
- position (VARCHAR, optional) - e.g., "Point Guard", "Center"
- jersey_number (INTEGER, optional)
- created_at, updated_at
```

#### 2. **basketball_stats** table
Stores individual player statistics for basketball matches.

```sql
- id (UUID, primary key)
- match_id (UUID, references matches) ← Links to specific match
- player_id (UUID, references players)
- points, rebounds, assists, steals, blocks, fouls (INTEGER)
- minutes_played (INTEGER)
- is_starter (BOOLEAN)
- created_at, updated_at
- UNIQUE(match_id, player_id) ← One record per player per match
```

## How Basketball Putra and Putri Work

### Competition Structure
```
competitions table:
├── Basketball Putra (ID: bball-putra)
└── Basketball Putri (ID: bball-putri)

matches table:
├── Match 1: FIK vs FEB (competition_id: bball-putra)
├── Match 2: BBS vs SOD (competition_id: bball-putra)
├── Match 3: FIK vs FEB (competition_id: bball-putri)
└── Match 4: BBS vs SOD (competition_id: bball-putri)
```

### Example: Basketball Putra Final
```
Match: FIK vs FEB
├── competition_id: "bball-putra"
├── faculty1_id: FIK
├── faculty2_id: FEB
└── score1: 75, score2: 68

Player Stats (stored in basketball_stats):
├── John (FIK): match_id → points: 25, rebounds: 8, assists: 3
├── Mike (FIK): match_id → points: 18, rebounds: 5, assists: 7
├── Sarah (FEB): match_id → points: 20, rebounds: 6, assists: 4
└── Lisa (FEB): match_id → points: 15, rebounds: 10, assists: 2
```

## Query Examples

### Get stats for a specific match with competition info
```sql
SELECT 
  p.name,
  p.jersey_number,
  f.short_name as faculty,
  bs.points,
  bs.rebounds,
  bs.assists,
  c.name as competition  -- "Basketball Putra" or "Basketball Putri"
FROM basketball_stats bs
JOIN players p ON bs.player_id = p.id
JOIN faculties f ON p.faculty_id = f.id
JOIN matches m ON bs.match_id = m.id
JOIN competitions c ON m.competition_id = c.id
WHERE bs.match_id = 'match-123'
ORDER BY bs.points DESC;
```

### Get all Basketball Putra matches
```sql
SELECT 
  m.*,
  c.name as competition
FROM matches m
JOIN competitions c ON m.competition_id = c.id
WHERE c.id = 'bball-putra';
```

### Get player's stats across both competitions
```sql
SELECT 
  bs.*,
  m.date,
  c.name as competition
FROM basketball_stats bs
JOIN matches m ON bs.match_id = m.id
JOIN competitions c ON m.competition_id = c.id
WHERE bs.player_id = 'player-id'
ORDER BY m.date DESC;
```

## TypeScript Functions Available

### Player Management
- `getPlayers()` - Get all players
- `getPlayersByFaculty(facultyId)` - Get players by faculty
- `createPlayer(player)` - Add new player
- `updatePlayer(playerId, updates)` - Update player info
- `deletePlayer(playerId)` - Remove player

### Basketball Stats
- `getBasketballStats(matchId)` - Get all stats for a match
- `saveBasketballStats(matchId, stats)` - Save/update stats for a match
- `updateBasketballStat(statId, updates)` - Update individual stat
- `getPlayerBasketballStats(playerId)` - Get player's stats history

## Setup Instructions

### 1. Run SQL migrations
```bash
# In Supabase SQL Editor:
1. Run create-players-table.sql
2. Run create-basketball-stats-table.sql
```

### 2. TypeScript types are already updated in `src/lib/supabase.ts`

### 3. Query functions are already added in `src/lib/supabase-queries.ts`

## Next Steps for Frontend Implementation

### Admin Dashboard - Add Stats Input UI
1. Select a basketball match
2. Display both teams' rosters
3. Input individual player stats
4. Save to `basketball_stats` table

### Public View - Display Stats
1. Show player stats in match detail modal
2. Display top performers
3. Show team totals

## Important Notes

✅ **DO:**
- Store stats per player per match
- Link through `match_id` (not `competition_id`)
- Use same `basketball_stats` table for both Putra and Putri

❌ **DON'T:**
- Add `competition_id` to `basketball_stats` table
- Create separate tables for Putra and Putri
- Store competition info in stats table (it's already in matches)

## Why This Design Works

1. **Same table for both competitions** - Basketball Putra and Putri use the same stats structure
2. **Competition info through match** - `match.competition_id` tells you if it's Putra or Putri
3. **One player, multiple sports** - Same player can have stats in basketball, volleyball, etc.
4. **Flexible queries** - Easy to filter by competition, faculty, or player
5. **Simple data entry** - Admin only needs to select match and input stats

## Example Usage in Code

```typescript
// Get stats for a basketball match
const matchId = 'some-match-id';
const stats = await getBasketballStats(matchId);

// Display stats
stats.forEach(stat => {
  console.log(`${stat.player.name}: ${stat.points} points, ${stat.rebounds} rebounds`);
});

// Save new stats
await saveBasketballStats(matchId, [
  { player_id: 'player-1', points: 25, rebounds: 8, assists: 3 },
  { player_id: 'player-2', points: 18, rebounds: 5, assists: 7 }
]);
```

