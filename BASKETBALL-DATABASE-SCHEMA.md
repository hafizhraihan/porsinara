# Basketball Stats Database Schema

## 📊 Complete Database Structure

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           basketball_stats                               │
├─────────────────────────────────────────────────────────────────────────┤
│ Primary Keys & References                                               │
│ • id                    UUID (PK)                                       │
│ • match_id              UUID (FK → matches)                             │
│ • player_id             UUID (FK → players)                             │
│                                                                          │
│ 🎯 SHOOTING STATISTICS (Admin Input Required)                           │
│ • free_throw_made       INTEGER  ─┐                                     │
│ • free_throw_attempt    INTEGER  ─┤ FT%                                 │
│ • two_point_made        INTEGER  ─┐                                     │
│ • two_point_attempt     INTEGER  ─┤ 2PT%                                │
│ • three_point_made      INTEGER  ─┐                                     │
│ • three_point_attempt   INTEGER  ─┤ 3PT%                                │
│                                   │                                      │
│ 🏀 REBOUND STATISTICS (Admin Input Required)                            │
│ • offensive_rebound     INTEGER  ─┐                                     │
│ • defensive_rebound     INTEGER  ─┤ → total_rebound (AUTO)              │
│                                                                          │
│ 📈 OTHER STATISTICS (Admin Input Required)                              │
│ • assists               INTEGER                                         │
│ • steals                INTEGER                                         │
│ • blocks                INTEGER                                         │
│ • turnovers             INTEGER  ← NEW!                                 │
│ • fouls                 INTEGER                                         │
│                                                                          │
│ 🔢 AUTO-CALCULATED FIELDS (Database Trigger)                            │
│ • total_points          INTEGER  ← FT + (2PT×2) + (3PT×3)              │
│ • total_rebound         INTEGER  ← OFF_REB + DEF_REB                    │
│                                                                          │
│ ⏱️ GAME METADATA (Admin Input Required)                                │
│ • minutes_played        INTEGER                                         │
│ • is_starter            BOOLEAN                                         │
│                                                                          │
│ 🕐 TIMESTAMPS                                                           │
│ • created_at            TIMESTAMP                                       │
│ • updated_at            TIMESTAMP                                       │
└─────────────────────────────────────────────────────────────────────────┘
```

## 🔗 Relationship Diagram

```
┌──────────────┐
│ competitions │
│ - id         │
│ - name       │  "Basketball Putra"
│ - type       │  "Basketball Putri"
└──────┬───────┘
       │
       │ competition_id
       ▼
┌──────────────┐
│   matches    │
│ - id         │
│ - faculty1   │
│ - faculty2   │
│ - score1     │
│ - score2     │
└──────┬───────┘
       │
       │ match_id
       ▼
┌──────────────────┐        ┌──────────────┐
│ basketball_stats │───────▶│   players    │
│ - match_id       │ player │ - id         │
│ - player_id      │  _id   │ - name       │
│ - FT made/att    │        │ - faculty_id │
│ - 2PT made/att   │        │ - jersey#    │
│ - 3PT made/att   │        └──────────────┘
│ - OFF/DEF reb    │
│ - assists        │
│ - steals         │
│ - blocks         │
│ - turnovers      │
│ - fouls          │
│ - total_points*  │ * auto-calculated
│ - total_rebound* │ * auto-calculated
└──────────────────┘
```

## 🎯 Data Flow Example

### Input → Processing → Output

```
ADMIN INPUT:
┌─────────────────────────────────────┐
│ Match: FIK vs FEB (Basketball Putra)│
│ Player: John Doe (#23, FIK)         │
│                                     │
│ Free Throws: 8 / 10                 │
│ 2-Point: 5 / 12                     │
│ 3-Point: 3 / 7                      │
│                                     │
│ Offensive Rebound: 3                │
│ Defensive Rebound: 5                │
│                                     │
│ Assists: 4                          │
│ Steals: 2                           │
│ Blocks: 1                           │
│ Turnovers: 3                        │
│ Fouls: 4                            │
│                                     │
│ Minutes: 28                         │
│ Starter: Yes                        │
└─────────────────────────────────────┘
           │
           ▼
DATABASE TRIGGER CALCULATES:
┌─────────────────────────────────────┐
│ total_points = 8 + (5×2) + (3×3)    │
│              = 8 + 10 + 9            │
│              = 27 points             │
│                                     │
│ total_rebound = 3 + 5                │
│               = 8 rebounds           │
└─────────────────────────────────────┘
           │
           ▼
STORED IN DATABASE:
┌─────────────────────────────────────┐
│ basketball_stats:                   │
│   match_id: match-123               │
│   player_id: player-456             │
│   free_throw_made: 8                │
│   free_throw_attempt: 10            │
│   two_point_made: 5                 │
│   two_point_attempt: 12             │
│   three_point_made: 3               │
│   three_point_attempt: 7            │
│   offensive_rebound: 3              │
│   defensive_rebound: 5              │
│   total_rebound: 8 ← AUTO           │
│   assists: 4                        │
│   steals: 2                         │
│   blocks: 1                         │
│   turnovers: 3                      │
│   fouls: 4                          │
│   total_points: 27 ← AUTO           │
│   minutes_played: 28                │
│   is_starter: true                  │
└─────────────────────────────────────┘
           │
           ▼
PUBLIC DISPLAY:
┌─────────────────────────────────────┐
│ John Doe (FIK #23)        27 PTS    │
│ FG: 8/19 (42.1%)                    │
│ FT: 8/10 (80.0%)                    │
│ 3PT: 3/7 (42.9%)                    │
│ REB: 8 (3 OFF, 5 DEF)               │
│ AST: 4  STL: 2  BLK: 1  TO: 3       │
│ 28 MIN  4 FOULS                     │
└─────────────────────────────────────┘
```

## 📝 Key Changes from Simple Version

### ❌ OLD (Simple):
```sql
points INTEGER
rebounds INTEGER
```

### ✅ NEW (Detailed):
```sql
-- Shooting breakdown
free_throw_made INTEGER
free_throw_attempt INTEGER
two_point_made INTEGER
two_point_attempt INTEGER
three_point_made INTEGER
three_point_attempt INTEGER

-- Rebound breakdown
offensive_rebound INTEGER
defensive_rebound INTEGER
total_rebound INTEGER -- auto-calculated

-- New stat
turnovers INTEGER

-- Auto-calculated total
total_points INTEGER -- auto-calculated
```

## 🔐 Validation Constraints

```sql
-- Shooting validation
CHECK (free_throw_made <= free_throw_attempt)
CHECK (two_point_made <= two_point_attempt)
CHECK (three_point_made <= three_point_attempt)

-- Non-negative validation
CHECK (free_throw_made >= 0)
CHECK (offensive_rebound >= 0)
CHECK (turnovers >= 0)
-- etc...

-- Unique constraint
UNIQUE(match_id, player_id) -- One stat record per player per match
```

## 🚀 Auto-Calculation Trigger

```sql
CREATE OR REPLACE FUNCTION calculate_basketball_totals()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-calculate total points
  NEW.total_points := 
    NEW.free_throw_made + 
    (NEW.two_point_made * 2) + 
    (NEW.three_point_made * 3);
  
  -- Auto-calculate total rebounds
  NEW.total_rebound := 
    NEW.offensive_rebound + 
    NEW.defensive_rebound;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_basketball_totals_trigger
  BEFORE INSERT OR UPDATE ON basketball_stats
  FOR EACH ROW
  EXECUTE FUNCTION calculate_basketball_totals();
```

## 💡 Benefits

✅ **Detailed Analytics** - Track shooting efficiency, rebound types  
✅ **Auto-calculation** - No manual point calculation errors  
✅ **Data Integrity** - Constraints prevent invalid data  
✅ **Performance Stats** - Calculate FG%, FT%, efficiency ratings  
✅ **Live Tracking** - Update stats in real-time during games  
✅ **Historical Analysis** - Compare player performance across matches  

## 📊 Advanced Metrics (Frontend Calculation)

```typescript
// Field Goal Percentage
const fgMade = two_point_made + three_point_made;
const fgAttempt = two_point_attempt + three_point_attempt;
const fgPercent = (fgMade / fgAttempt * 100).toFixed(1);

// Free Throw Percentage
const ftPercent = (free_throw_made / free_throw_attempt * 100).toFixed(1);

// True Shooting Percentage
const tsp = total_points / (2 * (fgAttempt + 0.44 * free_throw_attempt)) * 100;

// Efficiency Rating
const eff = total_points + total_rebound + assists + steals + blocks 
          - (fgAttempt - fgMade) - (free_throw_attempt - free_throw_made) - turnovers;
```

## 🎯 Summary

### Total Fields: 21
- **Admin Input**: 13 fields
- **Auto-calculated**: 2 fields  
- **Metadata**: 4 fields (id, timestamps)
- **References**: 2 fields (match_id, player_id)

### Key Features:
- ✅ Detailed shooting breakdown (FT, 2PT, 3PT)
- ✅ Rebound separation (offensive/defensive)
- ✅ Turnovers tracking
- ✅ Auto-calculated totals
- ✅ Database constraints for validation

