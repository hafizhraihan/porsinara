# Futsal Stats Database Schema

## 📊 Complete Database Structure

```
┌─────────────────────────────────────────────────────────────────────────┐
│                            futsal_stats                                  │
├─────────────────────────────────────────────────────────────────────────┤
│ Primary Keys & References                                               │
│ • id                    UUID (PK)                                       │
│ • match_id              UUID (FK → matches)                             │
│ • player_id             UUID (FK → players)                             │
│                                                                          │
│ ⚽ SHOOTING STATISTICS                                                  │
│ • shots_on_target       INTEGER  - Shots on goal                         │
│ • shots_off_target      INTEGER  - Shots off goal                        │
│                                                                          │
│ 🎯 SCORING & PLAYMAKING                                                │
│ • goals                 INTEGER  - Goals scored                         │
│ • assists               INTEGER  - Assists provided                      │
│                                                                          │
│ 🛡️ DEFENSIVE STATISTICS                                                │
│ • clearances            INTEGER  - Clearances made                      │
│                                                                          │
│ ⚖️ DISCIPLINE STATISTICS                                               │
│ • fouls                 INTEGER  - Fouls committed                       │
│                                                                          │
│ 🔄 OFFENSIVE STATISTICS                                                │
│ • turnovers             INTEGER  - Turnovers committed                    │
│                                                                          │
│ 🥅 GOALKEEPER STATISTICS (Only for keepers)                            │
│ • shots_received        INTEGER  - Shots faced                          │
│ • saves                 INTEGER  - Saves made                           │
│                                                                          │
│ 🔢 METADATA                                                             │
│ • minutes_played        INTEGER                                         │
│ • is_starter            BOOLEAN                                         │
│ • is_goalkeeper         BOOLEAN  - Role in the team                      │
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
│ - name       │  "Futsal"
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
│  futsal_stats    │───────▶│   players    │
│ - match_id       │ player │ - id         │
│ - player_id      │  _id   │ - name       │
│ - shots on/off   │        │ - faculty_id │
│ - goals          │        │ - jersey#    │
│ - assists        │        │ - position    │
│ - clearances     │        └──────────────┘
│ - fouls          │
│ - turnovers      │
│ - (gk) saves     │
│ - (gk) received  │
└──────────────────┘
```

## 🎯 Data Flow Example

### Input → Processing → Output

```
ADMIN INPUT - FIELD PLAYER:
┌─────────────────────────────────────┐
│ Match: SOCS vs SOD (Futsal)        │
│ Player: John Doe (#10, SOCS)       │
│ Role: Field Player                 │
│                                     │
│ Shots on target: 3                 │
│ Shots off target: 5                │
│ Goals: 2                           │
│ Assists: 1                         │
│ Clearances: 4                      │
│ Fouls: 2                           │
│ Turnovers: 3                       │
│                                     │
│ Minutes: 40                         │
│ Starter: Yes                        │
└─────────────────────────────────────┘
           │
           ▼
STORED IN DATABASE:
┌─────────────────────────────────────┐
│ futsal_stats:                       │
│   match_id: match-123               │
│   player_id: player-456             │
│   shots_on_target: 3                │
│   shots_off_target: 5               │
│   goals: 2                          │
│   assists: 1                        │
│   clearances: 4                     │
│   fouls: 2                          │
│   turnovers: 3                      │
│   shots_received: NULL              │
│   saves: NULL                       │
│   minutes_played: 40                │
│   is_starter: true                  │
│   is_goalkeeper: false              │
└─────────────────────────────────────┘

ADMIN INPUT - GOALKEEPER:
┌─────────────────────────────────────┐
│ Match: SOCS vs SOD (Futsal)        │
│ Player: Jane Smith (#1, SOCS)       │
│ Role: Goalkeeper                    │
│                                     │
│ Shots received: 12                  │
│ Saves: 9                            │
│ Clearances: 2                       │
│ Fouls: 0                            │
│ Turnovers: 0                        │
│                                     │
│ Minutes: 40                         │
│ Starter: Yes                        │
└─────────────────────────────────────┘
           │
           ▼
STORED IN DATABASE:
┌─────────────────────────────────────┐
│ futsal_stats:                       │
│   match_id: match-123               │
│   player_id: player-789             │
│   shots_on_target: 0                │
│   shots_off_target: 0               │
│   goals: 0                          │
│   assists: 0                        │
│   clearances: 2                     │
│   fouls: 0                          │
│   turnovers: 0                      │
│   shots_received: 12                │
│   saves: 9                          │
│   minutes_played: 40                │
│   is_starter: true                  │
│   is_goalkeeper: true               │
└─────────────────────────────────────┘
```

## 📊 Key Statistics Explained

### Field Players (is_goalkeeper = false)

| Statistic | Description | Example |
|-----------|-------------|---------|
| `shots_on_target` | Shots that would result in a goal if not saved | 5 |
| `shots_off_target` | Shots that miss the goal | 3 |
| `goals` | Goals scored by this player | 2 |
| `assists` | Passes leading directly to a goal | 1 |
| `clearances` | Successful defensive clearances | 8 |
| `fouls` | Fouls committed by this player | 2 |
| `turnovers` | Lost possession due to mistakes | 4 |

### Goalkeepers (is_goalkeeper = true)

| Statistic | Description | Example |
|-----------|-------------|---------|
| `shots_received` | Total shots faced by this keeper | 15 |
| `saves` | Successful defensive saves | 12 |
| `clearances` | Clearances made by the keeper | 3 |
| `fouls` | Fouls committed | 0 |
| `turnovers` | Turnovers committed | 1 |

## 🔐 Validation Constraints

```sql
-- Logical validation
CHECK (goals <= shots_on_target) -- Can't score more than shots on target

-- Goalkeeper validation (enforced by trigger)
-- When is_goalkeeper = true:
--   - shots_on_target, shots_off_target, goals, assists must be 0
--   - shots_received and saves must be set (cannot be NULL)

-- Field player validation (enforced by trigger)
-- When is_goalkeeper = false:
--   - shots_received and saves must be NULL
```

## 🎯 Auto-Validation Trigger

```sql
CREATE OR REPLACE FUNCTION validate_futsal_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- If player is a goalkeeper
  IF NEW.is_goalkeeper = true THEN
    -- Set goalkeeper-specific stats to default if null
    IF NEW.shots_received IS NULL THEN
      NEW.shots_received := 0;
    END IF;
    IF NEW.saves IS NULL THEN
      NEW.saves := 0;
    END IF;
    
    -- Zero out field player stats
    NEW.shots_on_target := 0;
    NEW.shots_off_target := 0;
    NEW.goals := 0;
    NEW.assists := 0;
  ELSE
    -- Null out goalkeeper stats for field players
    NEW.shots_received := NULL;
    NEW.saves := NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

## 📈 Calculated Metrics (Frontend)

```typescript
// Shooting accuracy
const shootingAccuracy = (shotsOnTarget / (shotsOnTarget + shotsOffTarget) * 100).toFixed(1);

// Goalkeeper save percentage
const savePercentage = (saves / shotsReceived * 100).toFixed(1);

// Goals per match
const goalsPerMatch = goals / matches;

// Assists per match
const assistsPerMatch = assists / matches;

// Total actions (field player)
const totalActions = goals + assists + clearances;

// Goalkeeper performance
const shotsNotSaved = shotsReceived - saves;
const goalsConcededRate = shotsNotSaved;
```

## 💡 Benefits

✅ **Role-Based Statistics** - Separate field player and goalkeeper stats  
✅ **Comprehensive Tracking** - Covers all major futsal metrics  
✅ **Data Integrity** - Constraints prevent invalid data  
✅ **Performance Stats** - Calculate shooting accuracy, save percentages  
✅ **Live Tracking** - Update stats in real-time during games  
✅ **Historical Analysis** - Compare player performance across matches  
✅ **Position Flexibility** - Track both field players and goalkeepers  

## 📝 Summary

### Total Fields: 13
- **Admin Input**: 11 fields
- **Auto-validated**: 2 fields (via trigger)
- **Metadata**: 2 fields (id, timestamps)
- **References**: 2 fields (match_id, player_id)

### Key Features:
- ✅ Separate statistics for field players and goalkeepers
- ✅ Comprehensive futsal metrics (shots, goals, assists, clearances)
- ✅ Discipline tracking (fouls, turnovers)
- ✅ Auto-validation based on player role
- ✅ Database constraints for data integrity

## 🚀 Usage Example

```sql
-- Insert field player stats
INSERT INTO futsal_stats (
  match_id, 
  player_id, 
  shots_on_target, 
  shots_off_target, 
  goals, 
  assists, 
  clearances, 
  fouls, 
  turnovers, 
  minutes_played, 
  is_starter, 
  is_goalkeeper
) VALUES (
  'match-uuid',
  'player-uuid',
  5,  -- shots_on_target
  3,  -- shots_off_target
  2,  -- goals
  1,  -- assists
  8,  -- clearances
  2,  -- fouls
  3,  -- turnovers
  40, -- minutes_played
  true, -- is_starter
  false -- is_goalkeeper
);

-- Insert goalkeeper stats
INSERT INTO futsal_stats (
  match_id, 
  player_id, 
  clearances, 
  fouls, 
  turnovers, 
  shots_received, 
  saves, 
  minutes_played, 
  is_starter, 
  is_goalkeeper
) VALUES (
  'match-uuid',
  'keeper-uuid',
  3,  -- clearances
  0,  -- fouls
  0,  -- turnovers
  12, -- shots_received
  9,  -- saves
  40, -- minutes_played
  true, -- is_starter
  true  -- is_goalkeeper
);
```

