# Basketball Stats - Manual Entry Guide

## ✅ What's Already Done

### Database Ready:
- ✅ `players` table created
- ✅ `basketball_stats` table created with all detailed fields
- ✅ Auto-calculation trigger for `total_points` and `total_rebound`
- ✅ TypeScript types updated in `src/lib/supabase.ts`
- ✅ Query functions ready in `src/lib/supabase-queries.ts`

### Available Functions:
```typescript
// Fetch functions
getPlayers()                          // Get all players
getPlayersByFaculty(facultyId)        // Get players by faculty
getBasketballStats(matchId)           // Get stats for a match
getPlayerBasketballStats(playerId)    // Get player's history

// Save functions
createPlayer(player)                  // Add new player
saveBasketballStats(matchId, stats)   // Save/update match stats
updateBasketballStat(statId, updates) // Update individual stat
```

---

## 📋 Admin UI Flow - Manual Entry

### Step 1: Select Match
```
Admin Dashboard → Select Basketball Match
└─ Match: FIK vs FEB (Basketball Men's - Final)
   Date: Oct 5, 2025
   Status: Live/Completed
```

### Step 2: Select Team & Players
```
Select Faculty: [FIK ▼]
└─ Available Players:
   ☑ John Doe (#23) - Point Guard
   ☑ Mike Smith (#10) - Center
   ☐ Sarah Johnson (#5) - Forward
```

### Step 3: Input Stats (Manual Entry Form)

```
┌─────────────────────────────────────────────────────┐
│ Input Stats: John Doe (#23, FIK)                   │
├─────────────────────────────────────────────────────┤
│                                                     │
│ 🎯 SHOOTING                                         │
│ ┌───────────────────────────────────────────────┐  │
│ │ Free Throws                                    │  │
│ │   Made:    [8]    Attempt: [10]               │  │
│ │   → 80.0% • 8 points                          │  │
│ │                                                │  │
│ │ 2-Point Shots                                  │  │
│ │   Made:    [5]    Attempt: [12]               │  │
│ │   → 41.7% • 10 points                         │  │
│ │                                                │  │
│ │ 3-Point Shots                                  │  │
│ │   Made:    [3]    Attempt: [7]                │  │
│ │   → 42.9% • 9 points                          │  │
│ └───────────────────────────────────────────────┘  │
│                                                     │
│ 🏀 REBOUNDS                                         │
│ ┌───────────────────────────────────────────────┐  │
│ │ Offensive: [3]    Defensive: [5]              │  │
│ │ → Total: 8 rebounds                           │  │
│ └───────────────────────────────────────────────┘  │
│                                                     │
│ 📊 OTHER STATS                                      │
│ ┌───────────────────────────────────────────────┐  │
│ │ Assists:   [4]    Steals:    [2]              │  │
│ │ Blocks:    [1]    Turnovers: [3]              │  │
│ │ Fouls:     [4]                                │  │
│ └───────────────────────────────────────────────┘  │
│                                                     │
│ ⏱️ GAME INFO                                        │
│ ┌───────────────────────────────────────────────┐  │
│ │ Minutes Played: [28]                          │  │
│ │ Starting Lineup: ☑                            │  │
│ └───────────────────────────────────────────────┘  │
│                                                     │
│ 💡 TOTAL POINTS: 27 (Auto-calculated)              │
│                                                     │
│          [Save Stats]  [Cancel]                    │
└─────────────────────────────────────────────────────┘
```

---

## 💻 Implementation Code Example

### Example Admin Component (Simplified)

```typescript
'use client';

import { useState, useEffect } from 'react';
import { getPlayersByFaculty, saveBasketballStats } from '@/lib/supabase-queries';

export default function BasketballStatsInput({ matchId, match }) {
  const [selectedFaculty, setSelectedFaculty] = useState('');
  const [players, setPlayers] = useState([]);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [stats, setStats] = useState({
    free_throw_made: 0,
    free_throw_attempt: 0,
    two_point_made: 0,
    two_point_attempt: 0,
    three_point_made: 0,
    three_point_attempt: 0,
    offensive_rebound: 0,
    defensive_rebound: 0,
    assists: 0,
    steals: 0,
    blocks: 0,
    turnovers: 0,
    fouls: 0,
    minutes_played: 0,
    is_starter: false
  });

  // Calculate totals
  const totalPoints = 
    stats.free_throw_made + 
    (stats.two_point_made * 2) + 
    (stats.three_point_made * 3);
  
  const totalRebound = stats.offensive_rebound + stats.defensive_rebound;

  // Calculate percentages
  const ftPercent = stats.free_throw_attempt > 0 
    ? ((stats.free_throw_made / stats.free_throw_attempt) * 100).toFixed(1) 
    : '0.0';
  
  const twoPtPercent = stats.two_point_attempt > 0
    ? ((stats.two_point_made / stats.two_point_attempt) * 100).toFixed(1)
    : '0.0';
  
  const threePtPercent = stats.three_point_attempt > 0
    ? ((stats.three_point_made / stats.three_point_attempt) * 100).toFixed(1)
    : '0.0';

  // Load players when faculty is selected
  useEffect(() => {
    if (selectedFaculty) {
      getPlayersByFaculty(selectedFaculty).then(setPlayers);
    }
  }, [selectedFaculty]);

  const handleSave = async () => {
    if (!selectedPlayer) {
      alert('Please select a player');
      return;
    }

    try {
      await saveBasketballStats(matchId, [{
        player_id: selectedPlayer,
        ...stats
      }]);
      
      alert('Stats saved successfully!');
      // Reset form or redirect
    } catch (error) {
      alert('Error saving stats: ' + error.message);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow">
      {/* Faculty & Player Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">Select Faculty</label>
        <select 
          value={selectedFaculty}
          onChange={(e) => setSelectedFaculty(e.target.value)}
          className="w-full border rounded px-3 py-2"
        >
          <option value="">Choose faculty...</option>
          <option value={match.faculty1_id}>{match.faculty1.name}</option>
          <option value={match.faculty2_id}>{match.faculty2.name}</option>
        </select>
      </div>

      {selectedFaculty && (
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Select Player</label>
          <select 
            value={selectedPlayer}
            onChange={(e) => setSelectedPlayer(e.target.value)}
            className="w-full border rounded px-3 py-2"
          >
            <option value="">Choose player...</option>
            {players.map(player => (
              <option key={player.id} value={player.id}>
                {player.name} (#{player.jersey_number})
              </option>
            ))}
          </select>
        </div>
      )}

      {selectedPlayer && (
        <>
          {/* Shooting Stats */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">🎯 Shooting</h3>
            <div className="space-y-4">
              {/* Free Throws */}
              <div className="bg-gray-50 p-4 rounded">
                <label className="block text-sm font-medium mb-2">Free Throws</label>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="text-xs text-gray-600">Made</label>
                    <input 
                      type="number" 
                      min="0"
                      value={stats.free_throw_made}
                      onChange={(e) => setStats({...stats, free_throw_made: parseInt(e.target.value) || 0})}
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs text-gray-600">Attempt</label>
                    <input 
                      type="number" 
                      min="0"
                      value={stats.free_throw_attempt}
                      onChange={(e) => setStats({...stats, free_throw_attempt: parseInt(e.target.value) || 0})}
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>
                </div>
                <div className="text-sm text-gray-600 mt-2">
                  → {ftPercent}% • {stats.free_throw_made} points
                </div>
              </div>

              {/* 2-Point Shots */}
              <div className="bg-gray-50 p-4 rounded">
                <label className="block text-sm font-medium mb-2">2-Point Shots</label>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="text-xs text-gray-600">Made</label>
                    <input 
                      type="number" 
                      min="0"
                      value={stats.two_point_made}
                      onChange={(e) => setStats({...stats, two_point_made: parseInt(e.target.value) || 0})}
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs text-gray-600">Attempt</label>
                    <input 
                      type="number" 
                      min="0"
                      value={stats.two_point_attempt}
                      onChange={(e) => setStats({...stats, two_point_attempt: parseInt(e.target.value) || 0})}
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>
                </div>
                <div className="text-sm text-gray-600 mt-2">
                  → {twoPtPercent}% • {stats.two_point_made * 2} points
                </div>
              </div>

              {/* 3-Point Shots */}
              <div className="bg-gray-50 p-4 rounded">
                <label className="block text-sm font-medium mb-2">3-Point Shots</label>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="text-xs text-gray-600">Made</label>
                    <input 
                      type="number" 
                      min="0"
                      value={stats.three_point_made}
                      onChange={(e) => setStats({...stats, three_point_made: parseInt(e.target.value) || 0})}
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs text-gray-600">Attempt</label>
                    <input 
                      type="number" 
                      min="0"
                      value={stats.three_point_attempt}
                      onChange={(e) => setStats({...stats, three_point_attempt: parseInt(e.target.value) || 0})}
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>
                </div>
                <div className="text-sm text-gray-600 mt-2">
                  → {threePtPercent}% • {stats.three_point_made * 3} points
                </div>
              </div>
            </div>
          </div>

          {/* Rebounds */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">🏀 Rebounds</h3>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="text-sm">Offensive</label>
                <input 
                  type="number" 
                  min="0"
                  value={stats.offensive_rebound}
                  onChange={(e) => setStats({...stats, offensive_rebound: parseInt(e.target.value) || 0})}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div className="flex-1">
                <label className="text-sm">Defensive</label>
                <input 
                  type="number" 
                  min="0"
                  value={stats.defensive_rebound}
                  onChange={(e) => setStats({...stats, defensive_rebound: parseInt(e.target.value) || 0})}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
            </div>
            <div className="text-sm text-gray-600 mt-2">
              → Total: {totalRebound} rebounds
            </div>
          </div>

          {/* Other Stats */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">📊 Other Stats</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm">Assists</label>
                <input 
                  type="number" 
                  min="0"
                  value={stats.assists}
                  onChange={(e) => setStats({...stats, assists: parseInt(e.target.value) || 0})}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="text-sm">Steals</label>
                <input 
                  type="number" 
                  min="0"
                  value={stats.steals}
                  onChange={(e) => setStats({...stats, steals: parseInt(e.target.value) || 0})}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="text-sm">Blocks</label>
                <input 
                  type="number" 
                  min="0"
                  value={stats.blocks}
                  onChange={(e) => setStats({...stats, blocks: parseInt(e.target.value) || 0})}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="text-sm">Turnovers</label>
                <input 
                  type="number" 
                  min="0"
                  value={stats.turnovers}
                  onChange={(e) => setStats({...stats, turnovers: parseInt(e.target.value) || 0})}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="text-sm">Fouls</label>
                <input 
                  type="number" 
                  min="0"
                  value={stats.fouls}
                  onChange={(e) => setStats({...stats, fouls: parseInt(e.target.value) || 0})}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="text-sm">Minutes Played</label>
                <input 
                  type="number" 
                  min="0"
                  value={stats.minutes_played}
                  onChange={(e) => setStats({...stats, minutes_played: parseInt(e.target.value) || 0})}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
            </div>
          </div>

          {/* Game Info */}
          <div className="mb-6">
            <label className="flex items-center space-x-2">
              <input 
                type="checkbox"
                checked={stats.is_starter}
                onChange={(e) => setStats({...stats, is_starter: e.target.checked})}
                className="rounded"
              />
              <span className="text-sm">Starting Lineup</span>
            </label>
          </div>

          {/* Total Points Display */}
          <div className="bg-blue-50 p-4 rounded mb-6">
            <div className="text-center">
              <div className="text-sm text-gray-600">Total Points (Auto-calculated)</div>
              <div className="text-3xl font-bold text-blue-600">{totalPoints}</div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button 
              onClick={handleSave}
              className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
            >
              Save Stats
            </button>
            <button 
              onClick={() => setSelectedPlayer(null)}
              className="px-6 py-3 border rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </>
      )}
    </div>
  );
}
```

---

## 🚀 Next Steps

### 1. **Run SQL Migrations**
```bash
# In Supabase SQL Editor:
1. Run create-players-table.sql
2. Run create-basketball-stats-table.sql
```

### 2. **Add Players to Database**
Create players first before inputting stats:
```sql
INSERT INTO players (name, student_id, faculty_id, position, jersey_number)
VALUES 
  ('John Doe', '2201234567', 'fik-id', 'Point Guard', 23),
  ('Mike Smith', '2201234568', 'fik-id', 'Center', 10);
```

### 3. **Build Admin UI**
- Add the stats input component to your admin dashboard
- Integrate with existing match management
- Add validation for input fields

### 4. **Test the Flow**
1. Admin selects a basketball match
2. Admin selects faculty (FIK or FEB)
3. Admin selects player from that faculty
4. Admin inputs stats manually
5. System auto-calculates total_points and total_rebound
6. Save to database

---

## ✅ What's Auto-Calculated

The database trigger automatically calculates:
- ✅ `total_points` = FT + (2PT × 2) + (3PT × 3)
- ✅ `total_rebound` = Offensive + Defensive

Admin doesn't need to input these!

---

## 💡 Tips for Manual Entry

1. **Validation**: Add frontend validation (made ≤ attempt)
2. **Save Progress**: Auto-save or draft feature
3. **Bulk Entry**: Allow entering stats for multiple players at once
4. **Edit Mode**: Allow editing stats after saving
5. **Real-time Updates**: Show live totals as admin types

---

Ready to implement! Would you like me to help you build the actual admin component?

