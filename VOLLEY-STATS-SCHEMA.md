# Volleyball Stats Database Schema

## 📊 Complete Database Structure

```
┌─────────────────────────────────────────────────────────────────────────┐
│                            volley_stats                                  │
├─────────────────────────────────────────────────────────────────────────┤
│ Primary Keys & References                                               │
│ • id                    UUID (PK)                                       │
│ • match_id              UUID (FK → matches)                             │
│ • player_id             UUID (FK → players)                             │
│                                                                          │
│ 🎾 SERVE STATISTICS                                                     │
│ • serve_attempt         INTEGER  - Total serves attempted              │
│ • serve_ace             INTEGER  - Aces (unreturnable serves)          │
│ • serve_error            INTEGER  - Serve errors                         │
│                                                                          │
│ 🔨 SPIKE STATISTICS                                                     │
│ • spike_attempt         INTEGER  - Total spikes attempted              │
│ • spike_kill            INTEGER  - Successful kills                     │
│ • spike_error            INTEGER  - Spike errors                         │
│                                                                          │
│ 🛡️ BLOCK STATISTICS                                                    │
│ • block_attempt         INTEGER  - Total blocks attempted              │
│ • block_success          INTEGER  - Successful blocks                    │
│                                                                          │
│ 🎯 SET STATISTICS                                                      │
│ • set_attempt           INTEGER  - Total sets attempted                │
│ • set_assist            INTEGER  - Assists (sets leading to kills)      │
│                                                                          │
│ 🏐 DIG STATISTICS                                                      │
│ • dig_attempt           INTEGER  - Total digs attempted                 │
│ • dig_success           INTEGER  - Successful digs                      │
│                                                                          │
│ 📥 RECEIVE STATISTICS                                                  │
│ • receive_attempt       INTEGER  - Total receives attempted            │
│ • receive_good          INTEGER  - Good receives                        │
│                                                                          │
│ ❌ ERROR STATISTICS                                                    │
│ • total_error           INTEGER  - Total errors committed                │
│                                                                          │
│ 🔢 METADATA                                                             │
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
│ - name       │  "Volleyball"
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
│  volley_stats    │───────▶│   players    │
│ - match_id       │ player │ - id         │
│ - player_id      │  _id   │ - name       │
│ - serve stats    │        │ - faculty_id │
│ - spike stats    │        │ - jersey#    │
│ - block stats    │        │ - position    │
│ - set stats      │        └──────────────┘
│ - dig stats      │
│ - receive stats  │
│ - total_error    │
└──────────────────┘
```

## 🎯 Data Flow Example

### Input → Processing → Output

```
ADMIN INPUT - OUTSIDE HITTER:
┌─────────────────────────────────────┐
│ Match: SOCS vs SOD (Volleyball)     │
│ Player: John Doe (#10, SOCS)        │
│ Position: Outside Hitter             │
│                                     │
│ Serve: 15 attempts, 3 aces, 2 errors│
│ Spike: 25 attempts, 12 kills, 3 errors│
│ Block: 8 attempts, 3 successes      │
│ Set: 5 attempts, 2 assists           │
│ Dig: 10 attempts, 7 successes        │
│ Receive: 12 attempts, 9 good         │
│ Total Errors: 5                      │
│                                     │
│ Minutes: 120                         │
│ Starter: Yes                         │
└─────────────────────────────────────┘
           │
           ▼
STORED IN DATABASE:
┌─────────────────────────────────────┐
│ volley_stats:                       │
│   match_id: match-123               │
│   player_id: player-456             │
│   serve_attempt: 15                 │
│   serve_ace: 3                      │
│   serve_error: 2                    │
│   spike_attempt: 25                 │
│   spike_kill: 12                    │
│   spike_error: 3                     │
│   block_attempt: 8                  │
│   block_success: 3                  │
│   set_attempt: 5                    │
│   set_assist: 2                     │
│   dig_attempt: 10                   │
│   dig_success: 7                    │
│   receive_attempt: 12                │
│   receive_good: 9                   │
│   total_error: 5                    │
│   minutes_played: 120               │
│   is_starter: true                  │
└─────────────────────────────────────┘
```

## 📊 Key Statistics Explained

| Statistic | Description | Example |
|-----------|-------------|---------|
| `serve_attempt` | Total number of serves attempted | 15 |
| `serve_ace` | Serves that result directly in a point (unreturnable) | 3 |
| `serve_error` | Serves that result in a point for the opponent | 2 |
| `spike_attempt` | Total number of spikes attempted | 25 |
| `spike_kill` | Successful spikes that result in a point | 12 |
| `spike_error` | Spikes that result in a point for the opponent | 3 |
| `block_attempt` | Total number of blocks attempted | 8 |
| `block_success` | Successful blocks that result in a point | 3 |
| `set_attempt` | Total number of sets attempted | 5 |
| `set_assist` | Sets that lead directly to a kill | 2 |
| `dig_attempt` | Total number of digs attempted | 10 |
| `dig_success` | Successful digs (keeping ball in play) | 7 |
| `receive_attempt` | Total number of receives attempted | 12 |
| `receive_good` | Good receives (playable passes) | 9 |
| `total_error` | Total errors committed (all types) | 5 |

## 🔐 Validation Constraints

```sql
-- Non-negative validation
CHECK (serve_attempt >= 0)
CHECK (serve_ace >= 0)
-- etc...

-- Logical validation
CHECK (serve_ace <= serve_attempt) -- Can't have more aces than attempts
CHECK (spike_kill <= spike_attempt) -- Can't have more kills than attempts
CHECK (block_success <= block_attempt) -- Can't have more successes than attempts
CHECK (set_assist <= set_attempt) -- Can't have more assists than attempts
CHECK (dig_success <= dig_attempt) -- Can't have more successes than attempts
CHECK (receive_good <= receive_attempt) -- Can't have more good receives than attempts
```

## 📈 Calculated Metrics (Frontend)

```typescript
// Serve percentage
const servePercentage = (serveAce / serveAttempt * 100).toFixed(1);

// Spike kill percentage
const spikeKillPercentage = (spikeKill / spikeAttempt * 100).toFixed(1);

// Block success percentage
const blockSuccessPercentage = (blockSuccess / blockAttempt * 100).toFixed(1);

// Set assist percentage
const setAssistPercentage = (setAssist / setAttempt * 100).toFixed(1);

// Dig success percentage
const digSuccessPercentage = (digSuccess / digAttempt * 100).toFixed(1);

// Receive good percentage
const receiveGoodPercentage = (receiveGood / receiveAttempt * 100).toFixed(1);

// Total efficiency
const totalEfficiency = (
  (spikeKill + blockSuccess + serveAce) / 
  (spikeAttempt + blockAttempt + serveAttempt) * 100
).toFixed(1);
```

## 💡 Benefits

✅ **Comprehensive Tracking** - Covers all major volleyball skills  
✅ **Performance Analysis** - Calculate efficiency percentages  
✅ **Position Flexibility** - Works for all positions (setter, hitter, libero, etc.)  
✅ **Data Integrity** - Constraints prevent invalid data  
✅ **Live Tracking** - Update stats in real-time during matches  
✅ **Historical Analysis** - Compare player performance across matches  

## 📝 Summary

### Total Fields: 20
- **Admin Input**: 16 fields
- **Metadata**: 2 fields (id, timestamps)
- **References**: 2 fields (match_id, player_id)

### Key Features:
- ✅ Complete serve statistics (attempts, aces, errors)
- ✅ Comprehensive spike tracking (attempts, kills, errors)
- ✅ Block performance metrics
- ✅ Set and assist tracking
- ✅ Dig and receive statistics
- ✅ Total error tracking
- ✅ Database constraints for data integrity

## 🚀 Usage Example

```sql
-- Insert volleyball stats
INSERT INTO volley_stats (
  match_id, 
  player_id, 
  serve_attempt,
  serve_ace,
  serve_error,
  spike_attempt,
  spike_kill,
  spike_error,
  block_attempt,
  block_success,
  set_attempt,
  set_assist,
  dig_attempt,
  dig_success,
  receive_attempt,
  receive_good,
  total_error,
  minutes_played, 
  is_starter
) VALUES (
  'match-uuid',
  'player-uuid',
  15,  -- serve_attempt
  3,   -- serve_ace
  2,   -- serve_error
  25,  -- spike_attempt
  12,  -- spike_kill
  3,   -- spike_error
  8,   -- block_attempt
  3,   -- block_success
  5,   -- set_attempt
  2,   -- set_assist
  10,  -- dig_attempt
  7,   -- dig_success
  12,  -- receive_attempt
  9,   -- receive_good
  5,   -- total_error
  120, -- minutes_played
  true -- is_starter
);
```


