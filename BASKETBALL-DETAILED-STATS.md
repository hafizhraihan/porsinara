# Basketball Detailed Stats - Admin Input Guide

## Overview
This document explains the detailed basketball statistics that admins can input in the admin panel, including shooting percentages, rebounds breakdown, and turnovers.

## Database Structure

### Complete Stats Fields

#### 🎯 **Shooting Statistics**
| Field | Description | Admin Input | Example |
|-------|-------------|-------------|---------|
| `free_throw_made` | Free throws made | ✅ Yes | 8 |
| `free_throw_attempt` | Free throws attempted | ✅ Yes | 10 |
| `two_point_made` | 2-point shots made | ✅ Yes | 5 |
| `two_point_attempt` | 2-point shots attempted | ✅ Yes | 12 |
| `three_point_made` | 3-point shots made | ✅ Yes | 3 |
| `three_point_attempt` | 3-point shots attempted | ✅ Yes | 7 |

**Shooting Percentages (Auto-calculated on frontend):**
- FT%: `free_throw_made / free_throw_attempt * 100`
- 2PT%: `two_point_made / two_point_attempt * 100`
- 3PT%: `three_point_made / three_point_attempt * 100`
- FG%: `(two_point_made + three_point_made) / (two_point_attempt + three_point_attempt) * 100`

#### 🏀 **Rebound Statistics**
| Field | Description | Admin Input | Example |
|-------|-------------|-------------|---------|
| `offensive_rebound` | Offensive rebounds | ✅ Yes | 3 |
| `defensive_rebound` | Defensive rebounds | ✅ Yes | 5 |
| `total_rebound` | Total rebounds | ❌ Auto-calculated | 8 |

**Auto-calculation:**
- `total_rebound = offensive_rebound + defensive_rebound`

#### 📊 **Other Statistics**
| Field | Description | Admin Input | Example |
|-------|-------------|-------------|---------|
| `assists` | Assists | ✅ Yes | 4 |
| `steals` | Steals | ✅ Yes | 2 |
| `blocks` | Blocks | ✅ Yes | 1 |
| `turnovers` | Turnovers | ✅ Yes | 3 |
| `fouls` | Personal fouls | ✅ Yes | 4 |

#### 🎮 **Game Metadata**
| Field | Description | Admin Input | Example |
|-------|-------------|-------------|---------|
| `minutes_played` | Minutes played | ✅ Yes | 28 |
| `is_starter` | Starting lineup | ✅ Yes | true |

#### 🔢 **Auto-Calculated Fields**
| Field | Formula | Example |
|-------|---------|---------|
| `total_points` | `FT + (2PT × 2) + (3PT × 3)` | 8 + (5×2) + (3×3) = 27 |
| `total_rebound` | `offensive_rebound + defensive_rebound` | 3 + 5 = 8 |

---

## Admin Panel Input Flow

### Step 1: Select Match
```
Match: FIK vs FEB (Basketball Putra - Final)
Date: Oct 5, 2025
```

### Step 2: Select Player
```
Faculty: FIK
Player: John Doe (#23)
Position: Point Guard
```

### Step 3: Input Statistics

#### **Shooting Section**
```
Free Throws:
  Made: [8]
  Attempt: [10]
  → FT%: 80%

2-Point Shots:
  Made: [5]
  Attempt: [12]
  → 2PT%: 41.7%

3-Point Shots:
  Made: [3]
  Attempt: [7]
  → 3PT%: 42.9%

→ Total Points: 27 (auto-calculated)
→ Field Goal%: 42.1% (auto-calculated)
```

#### **Rebounds Section**
```
Offensive: [3]
Defensive: [5]
→ Total: 8 (auto-calculated)
```

#### **Other Stats Section**
```
Assists: [4]
Steals: [2]
Blocks: [1]
Turnovers: [3]
Fouls: [4]
```

#### **Game Info Section**
```
Minutes Played: [28]
Starting Lineup: [✓] Yes
```

---

## Example Data Entry

### Player: John Doe (FIK #23)
```typescript
{
  player_id: "player-123",
  match_id: "match-456",
  
  // Admin inputs these:
  free_throw_made: 8,
  free_throw_attempt: 10,
  two_point_made: 5,
  two_point_attempt: 12,
  three_point_made: 3,
  three_point_attempt: 7,
  
  offensive_rebound: 3,
  defensive_rebound: 5,
  
  assists: 4,
  steals: 2,
  blocks: 1,
  turnovers: 3,
  fouls: 4,
  
  minutes_played: 28,
  is_starter: true,
  
  // Database auto-calculates these:
  total_points: 27,     // 8 + (5*2) + (3*3)
  total_rebound: 8      // 3 + 5
}
```

---

## Admin Panel UI Mockup

```
┌─────────────────────────────────────────────────────────────┐
│ Input Stats: Basketball Putra Final                         │
│ Match: FIK vs FEB | Oct 5, 2025                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ 👤 Player: John Doe (#23) - FIK - Point Guard              │
│                                                              │
│ 🎯 SHOOTING STATS                                           │
│ ┌──────────────────────────────────────────────────────┐   │
│ │ Free Throws:                                          │   │
│ │   Made: [8]  Attempt: [10]  → FT%: 80.0%            │   │
│ │                                                       │   │
│ │ 2-Point Shots:                                        │   │
│ │   Made: [5]  Attempt: [12]  → 2PT%: 41.7%           │   │
│ │                                                       │   │
│ │ 3-Point Shots:                                        │   │
│ │   Made: [3]  Attempt: [7]   → 3PT%: 42.9%           │   │
│ │                                                       │   │
│ │ ➜ Total Points: 27  |  Field Goal%: 42.1%           │   │
│ └──────────────────────────────────────────────────────┘   │
│                                                              │
│ 🏀 REBOUNDS                                                 │
│ ┌──────────────────────────────────────────────────────┐   │
│ │ Offensive: [3]                                        │   │
│ │ Defensive: [5]                                        │   │
│ │ ➜ Total: 8                                           │   │
│ └──────────────────────────────────────────────────────┘   │
│                                                              │
│ 📊 OTHER STATS                                              │
│ ┌──────────────────────────────────────────────────────┐   │
│ │ Assists: [4]      Steals: [2]                        │   │
│ │ Blocks: [1]       Turnovers: [3]                     │   │
│ │ Fouls: [4]                                           │   │
│ └──────────────────────────────────────────────────────┘   │
│                                                              │
│ ⏱️ GAME INFO                                                │
│ ┌──────────────────────────────────────────────────────┐   │
│ │ Minutes Played: [28]                                  │   │
│ │ Starting Lineup: [✓]                                 │   │
│ └──────────────────────────────────────────────────────┘   │
│                                                              │
│              [Save Stats]  [Cancel]                         │
└─────────────────────────────────────────────────────────────┘
```

---

## Display View (Public)

### Match Stats Display
```
┌─────────────────────────────────────────────────────────────┐
│ Basketball Putra Final                                       │
│ FIK 85 - 78 FEB                                             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ 🏆 TOP PERFORMERS                                           │
│                                                              │
│ John Doe (FIK #23)                   27 PTS                 │
│ ├─ FG: 8/19 (42.1%)  FT: 8/10 (80.0%)                      │
│ ├─ REB: 8 (3 OFF, 5 DEF)                                   │
│ └─ AST: 4  STL: 2  BLK: 1  TO: 3                          │
│                                                              │
│ Mike Smith (FEB #10)                 22 PTS                 │
│ ├─ FG: 7/15 (46.7%)  FT: 6/8 (75.0%)                       │
│ ├─ REB: 12 (4 OFF, 8 DEF)                                  │
│ └─ AST: 6  STL: 3  BLK: 0  TO: 2                          │
│                                                              │
│ [View Full Stats]                                           │
└─────────────────────────────────────────────────────────────┘
```

---

## Validation Rules

### Database Constraints
```sql
-- Made shots cannot exceed attempts
CHECK (free_throw_made <= free_throw_attempt)
CHECK (two_point_made <= two_point_attempt)
CHECK (three_point_made <= three_point_attempt)

-- All values must be non-negative
CHECK (free_throw_made >= 0)
CHECK (offensive_rebound >= 0)
CHECK (turnovers >= 0)
-- etc...
```

### Frontend Validation (Recommended)
```typescript
// Validate shooting stats
if (ftMade > ftAttempt) {
  error("Free throws made cannot exceed attempts");
}

// Validate reasonable ranges
if (totalPoints > 100) {
  warning("Are you sure? This is unusually high.");
}

// Validate fouls (typically max 5-6 in basketball)
if (fouls > 6) {
  warning("Player should have fouled out");
}
```

---

## Usage Examples

### Save Player Stats
```typescript
await saveBasketballStats('match-123', [
  {
    player_id: 'player-123',
    free_throw_made: 8,
    free_throw_attempt: 10,
    two_point_made: 5,
    two_point_attempt: 12,
    three_point_made: 3,
    three_point_attempt: 7,
    offensive_rebound: 3,
    defensive_rebound: 5,
    assists: 4,
    steals: 2,
    blocks: 1,
    turnovers: 3,
    fouls: 4,
    minutes_played: 28,
    is_starter: true
  }
]);
```

### Get and Display Stats
```typescript
const stats = await getBasketballStats('match-123');

stats.forEach(stat => {
  const ftPct = (stat.free_throw_made / stat.free_throw_attempt * 100).toFixed(1);
  const fgMade = stat.two_point_made + stat.three_point_made;
  const fgAttempt = stat.two_point_attempt + stat.three_point_attempt;
  const fgPct = (fgMade / fgAttempt * 100).toFixed(1);
  
  console.log(`${stat.player.name}: ${stat.total_points} PTS`);
  console.log(`FG: ${fgMade}/${fgAttempt} (${fgPct}%)`);
  console.log(`FT: ${stat.free_throw_made}/${stat.free_throw_attempt} (${ftPct}%)`);
  console.log(`REB: ${stat.total_rebound} (${stat.offensive_rebound} OFF)`);
});
```

---

## Key Features

✅ **Auto-calculation** - Total points and total rebounds calculated automatically  
✅ **Data validation** - Database constraints prevent invalid data  
✅ **Shooting efficiency** - Calculate FG%, FT%, 2PT%, 3PT% on frontend  
✅ **Detailed tracking** - Separate offensive/defensive rebounds, turnovers  
✅ **Live updates** - Real-time stat updates during games  

---

## Summary

**Admin Inputs (13 fields):**
1. Free throw made/attempt
2. 2-point made/attempt  
3. 3-point made/attempt
4. Offensive rebound
5. Defensive rebound
6. Assists
7. Steals
8. Blocks
9. Turnovers
10. Fouls
11. Minutes played
12. Is starter

**Auto-Calculated (2 fields):**
1. Total points
2. Total rebounds

