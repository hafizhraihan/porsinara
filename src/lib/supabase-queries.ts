import { supabase } from './supabase'
import { Database } from './supabase'

// Type aliases for easier use
type Faculty = Database['public']['Tables']['faculties']['Row']
type Competition = Database['public']['Tables']['competitions']['Row']
type Match = Database['public']['Tables']['matches']['Row']
type FacultyStanding = Database['public']['Tables']['faculty_standings']['Row']
type TableStanding = Database['public']['Tables']['table_standings']['Row']

// Faculty queries
export async function getFaculties(): Promise<Faculty[]> {
  const { data, error } = await supabase
    .from('faculties')
    .select('*')
    .order('name')

  if (error) {
    console.error('Error fetching faculties:', error)
    throw error
  }

  return data || []
}

// Competition queries
export async function getCompetitions(): Promise<Competition[]> {
  const { data, error } = await supabase
    .from('competitions')
    .select('*')
    .order('type', { ascending: false })
    .order('name')

  if (error) {
    console.error('Error fetching competitions:', error)
    throw error
  }

  return data || []
}

// Match queries
export async function getMatches(): Promise<Match[]> {
  const { data, error } = await supabase
    .from('matches')
    .select(`
      *,
      faculty1:faculties!matches_faculty1_id_fkey(name, short_name),
      faculty2:faculties!matches_faculty2_id_fkey(name, short_name),
      competition:competitions(name, icon)
    `)
    .order('date', { ascending: true })
    .order('time', { ascending: true })

  if (error) {
    console.error('Error fetching matches:', error)
    throw error
  }

  return data || []
}

export async function getLiveMatches(): Promise<Match[]> {
  const { data, error } = await supabase
    .from('matches')
    .select(`
      *,
      faculty1:faculties!matches_faculty1_id_fkey(name, short_name),
      faculty2:faculties!matches_faculty2_id_fkey(name, short_name),
      competition:competitions(name, icon)
    `)
    .eq('status', 'live')
    .order('date', { ascending: true })
    .order('time', { ascending: true })

  if (error) {
    console.error('Error fetching live matches:', error)
    throw error
  }

  return data || []
}


// Faculty standings queries (medal tally)
export async function getFacultyStandings(): Promise<FacultyStanding[]> {
  const { data, error } = await supabase
    .from('faculty_standings')
    .select(`
      *,
      faculty:faculties(name, short_name, color)
    `)
    .order('total_points', { ascending: false })

  if (error) {
    console.error('Error fetching faculty standings:', error)
    throw error
  }

  return data || []
}

// Table standings queries (for arts competitions)
export async function getTableStandings(competitionId: string): Promise<TableStanding[]> {
  const { data, error } = await supabase
    .from('table_standings')
    .select(`
      *,
      faculty:faculties(name, short_name, color)
    `)
    .eq('competition_id', competitionId)
    .order('rank', { ascending: true })

  if (error) {
    console.error('Error fetching table standings:', error)
    throw error
  }

  return data || []
}

export async function getMatchesByCompetition(competitionId: string): Promise<any[]> {
  console.log('Fetching matches for competition:', competitionId)
  
  try {
    // First try a simple query without joins to test basic access
    const { data: simpleData, error: simpleError } = await supabase
      .from('matches')
      .select('*')
      .eq('competition_id', competitionId)
      .order('date', { ascending: true })
      .order('time', { ascending: true })

    if (simpleError) {
      console.error('Simple query failed:', simpleError)
      throw new Error(`Basic query failed: ${simpleError.message}`)
    }

    console.log('Basic query successful, fetched:', simpleData?.length || 0, 'matches')
    console.log('Matches data:', simpleData)

    // If we have data, try to get the related data separately
    if (simpleData && simpleData.length > 0) {
      // Get competitions data
      const { data: competitionsData } = await supabase
        .from('competitions')
        .select('id, name, type, icon, format')
        .eq('id', competitionId)

      // Get faculties data
      const facultyIds = [...new Set([
        ...simpleData.map(m => m.faculty1_id),
        ...simpleData.map(m => m.faculty2_id)
      ])]
      
      const { data: facultiesData } = await supabase
        .from('faculties')
        .select('id, name, short_name, color')
        .in('id', facultyIds)

      // Combine the data
      const enrichedData = simpleData.map(match => ({
        ...match,
        competition: competitionsData?.[0] || null,
        faculty1: facultiesData?.find(f => f.id === match.faculty1_id) || null,
        faculty2: facultiesData?.find(f => f.id === match.faculty2_id) || null
      }))

      return enrichedData
    }

    return []
  } catch (err) {
    console.error('Unexpected error in getMatchesByCompetition:', err)
    throw err
  }
}

// Test function to check Supabase connection and RLS policies
export async function testSupabaseConnection(): Promise<void> {
  try {
    console.log('Testing Supabase connection...')
    
    // Test basic read access
    const { data: faculties, error: facultiesError } = await supabase
      .from('faculties')
      .select('*')
      .limit(1)
    
    if (facultiesError) {
      console.error('Faculties read error:', facultiesError)
    } else {
      console.log('✅ Faculties read access works')
    }

    // Test matches read access
    const { data: matches, error: matchesError } = await supabase
      .from('matches')
      .select('*')
      .limit(1)
    
    if (matchesError) {
      console.error('Matches read error:', matchesError)
    } else {
      console.log('✅ Matches read access works')
    }

    // Test competitions read access
    const { data: competitions, error: competitionsError } = await supabase
      .from('competitions')
      .select('*')
      .limit(1)
    
    if (competitionsError) {
      console.error('Competitions read error:', competitionsError)
    } else {
      console.log('✅ Competitions read access works')
    }

  } catch (error) {
    console.error('Supabase connection test failed:', error)
  }
}

// Admin functions for updating data
export async function updateMatchScore(
  matchId: string, 
  score1: number, 
  score2: number, 
  status: 'scheduled' | 'live' | 'completed' = 'completed'
): Promise<void> {
  const { data, error } = await supabase
    .from('matches')
    .update({ 
      score1, 
      score2, 
      status,
      updated_at: new Date().toISOString()
    })
    .eq('id', matchId)
    .select('competition_id, faculty1_id, faculty2_id, round')

  if (error) {
    console.error('Error updating match score:', error)
    throw error
  }
  
  // If match is completed, assign medals
  if (status === 'completed' && data && data[0]) {
    const match = data[0]
    await assignMedals({
      matchId: (match as any).id,
      competitionId: match.competition_id,
      faculty1Id: match.faculty1_id,
      faculty2Id: match.faculty2_id,
      score1,
      score2,
      round: match.round || ''
    })
  }
}

export async function createMatch(match: {
  competition_id: string
  faculty1_id: string
  faculty2_id: string
  date: string
  time: string
  location: string
  round?: string
}): Promise<void> {
  console.log('Creating match with data:', match)
  
  try {
    const { data, error } = await supabase
      .from('matches')
      .insert(match)
      .select()

    if (error) {
      console.error('Supabase error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      console.error('Match data that failed:', match)
      throw new Error(`Failed to create match: ${error.message}`)
    }
    
    console.log('Match created successfully:', data)
  } catch (err) {
    console.error('Unexpected error in createMatch:', err)
    throw err
  }
}

// Arts competition medal assignment
async function assignArtsMedals(
  competitionId: string,
  firstPlace: { faculty_id: string; score: number } | undefined,
  secondPlace: { faculty_id: string; score: number } | undefined,
  thirdPlace: { faculty_id: string; score: number } | undefined
): Promise<void> {
  console.log('Assigning arts competition medals:', {
    competitionId,
    first: firstPlace?.faculty_id,
    second: secondPlace?.faculty_id,
    third: thirdPlace?.faculty_id
  })

  try {
    // Assign gold medal to 1st place
    if (firstPlace) {
      const { data: firstStanding } = await supabase
        .from('faculty_standings')
        .select('gold, silver, bronze')
        .eq('faculty_id', firstPlace.faculty_id)
        .eq('competition_id', competitionId)
        .single()

      const firstMedals = firstStanding || { gold: 0, silver: 0, bronze: 0 }
      
      await updateFacultyStanding(
        firstPlace.faculty_id,
        competitionId,
        firstMedals.gold + 1,
        firstMedals.silver,
        firstMedals.bronze
      )
      
      console.log(`Gold medal assigned to ${firstPlace.faculty_id}`)
    }

    // Assign silver medal to 2nd place
    if (secondPlace) {
      const { data: secondStanding } = await supabase
        .from('faculty_standings')
        .select('gold, silver, bronze')
        .eq('faculty_id', secondPlace.faculty_id)
        .eq('competition_id', competitionId)
        .single()

      const secondMedals = secondStanding || { gold: 0, silver: 0, bronze: 0 }
      
      await updateFacultyStanding(
        secondPlace.faculty_id,
        competitionId,
        secondMedals.gold,
        secondMedals.silver + 1,
        secondMedals.bronze
      )
      
      console.log(`Silver medal assigned to ${secondPlace.faculty_id}`)
    }

    // Assign bronze medal to 3rd place
    if (thirdPlace) {
      const { data: thirdStanding } = await supabase
        .from('faculty_standings')
        .select('gold, silver, bronze')
        .eq('faculty_id', thirdPlace.faculty_id)
        .eq('competition_id', competitionId)
        .single()

      const thirdMedals = thirdStanding || { gold: 0, silver: 0, bronze: 0 }
      
      await updateFacultyStanding(
        thirdPlace.faculty_id,
        competitionId,
        thirdMedals.gold,
        thirdMedals.silver,
        thirdMedals.bronze + 1
      )
      
      console.log(`Bronze medal assigned to ${thirdPlace.faculty_id}`)
    }

    console.log('Arts competition medals assigned successfully!')
  } catch (error) {
    console.error('Error assigning arts competition medals:', error)
    throw error
  }
}

// Medal assignment logic
export async function assignMedals(matchData: {
  matchId: string
  competitionId: string
  faculty1Id: string
  faculty2Id: string
  score1: number
  score2: number
  round: string
}): Promise<void> {
  const { matchId, competitionId, faculty1Id, faculty2Id, score1, score2, round } = matchData
  
  console.log('Assigning medals for match:', matchData)
  
  // Get competition details
  const { data: competition } = await supabase
    .from('competitions')
    .select('format, type')
    .eq('id', competitionId)
    .single()
  
  if (!competition) {
    console.log('Skipping medal assignment - competition not found')
    return
  }
  
  // Assign medals for elimination competitions OR arts competitions with Final round
  const isEliminationCompetition = competition.format === 'elimination'
  const isArtsCompetitionFinal = competition.type === 'art' && round === 'Final'
  
  if (!isEliminationCompetition && !isArtsCompetitionFinal) {
    console.log('Skipping medal assignment - not an elimination competition or arts final')
    return
  }
  
  let winnerId: string, loserId: string
  
  if (isArtsCompetitionFinal) {
    // For arts competitions, determine ranking based on individual faculty scores
    console.log(`Fetching arts scores for match ${matchId} (${round} round)`)
    const { data: artsScores, error: artsError } = await supabase
      .from('arts_competition_scores')
      .select('faculty_id, score')
      .eq('match_id', matchId)
    
    if (artsError) {
      console.error('Error fetching arts scores:', artsError)
      return
    }
    
    console.log('Arts scores found:', artsScores)
    
    if (!artsScores || artsScores.length === 0) {
      console.log('No arts competition scores found for medal assignment')
      return
    }
    
    // Sort by score to get ranking (highest to lowest)
    const sortedScores = artsScores.sort((a, b) => b.score - a.score)
    console.log('Sorted scores:', sortedScores)
    
    // For arts competitions, we assign medals based on ranking in this single match
    // 1st place gets gold, 2nd place gets silver, 3rd place gets bronze
    const firstPlace = sortedScores[0]
    const secondPlace = sortedScores[1]
    const thirdPlace = sortedScores[2]
    
    console.log('Arts competition ranking:', {
      first: firstPlace?.faculty_id,
      second: secondPlace?.faculty_id,
      third: thirdPlace?.faculty_id
    })
    
    // Assign medals based on ranking
    await assignArtsMedals(competitionId, firstPlace, secondPlace, thirdPlace)
    return // Exit early since we handled arts competition medals
  } else {
    // For elimination competitions, use traditional score comparison
    winnerId = score1 > score2 ? faculty1Id : faculty2Id
    loserId = score1 > score2 ? faculty2Id : faculty1Id
    
    console.log('Elimination winner:', winnerId, 'Loser:', loserId, 'Round:', round)
  }
  
  try {
    // Get current medal counts for both faculties
    const { data: faculty1Standing } = await supabase
      .from('faculty_standings')
      .select('gold, silver, bronze')
      .eq('faculty_id', faculty1Id)
      .eq('competition_id', competitionId)
      .single()
    
    const { data: faculty2Standing } = await supabase
      .from('faculty_standings')
      .select('gold, silver, bronze')
      .eq('faculty_id', faculty2Id)
      .eq('competition_id', competitionId)
      .single()
    
    // Initialize medal counts if no standing exists
    const faculty1Medals = faculty1Standing || { gold: 0, silver: 0, bronze: 0 }
    const faculty2Medals = faculty2Standing || { gold: 0, silver: 0, bronze: 0 }
    
    // Assign medals based on round
    if (round === 'Final') {
      // Winner gets gold, loser gets silver
      const winnerMedals = winnerId === faculty1Id ? faculty1Medals : faculty2Medals
      const loserMedals = loserId === faculty1Id ? faculty1Medals : faculty2Medals
      
      console.log(`Assigning Final medals: Winner ${winnerId} gets gold, Runner-up ${loserId} gets silver`)
      
      await updateFacultyStanding(
        winnerId,
        competitionId,
        winnerMedals.gold + 1,
        winnerMedals.silver,
        winnerMedals.bronze
      )
      
      await updateFacultyStanding(
        loserId,
        competitionId,
        loserMedals.gold,
        loserMedals.silver + 1,
        loserMedals.bronze
      )
      
      console.log(`Gold medal assigned to ${winnerId}, Silver medal assigned to ${loserId}`)
      
    } else if (round === '3rd Place') {
      // Winner gets bronze
      const winnerMedals = winnerId === faculty1Id ? faculty1Medals : faculty2Medals
      
      console.log(`Assigning bronze medal to ${winnerId} for 3rd place in ${competitionId}`)
      console.log('Winner medals before:', winnerMedals)
      
      await updateFacultyStanding(
        winnerId,
        competitionId,
        winnerMedals.gold,
        winnerMedals.silver,
        winnerMedals.bronze + 1
      )
      
      console.log(`Bronze medal assigned to ${winnerId} - new bronze count: ${winnerMedals.bronze + 1}`)
      
    } else if (round === 'Lower Final') {
      // Loser gets bronze (in double elimination, loser of Lower Final gets 3rd place)
      const loserMedals = loserId === faculty1Id ? faculty1Medals : faculty2Medals
      
      await updateFacultyStanding(
        loserId,
        competitionId,
        loserMedals.gold,
        loserMedals.silver,
        loserMedals.bronze + 1
      )
      
      console.log(`Bronze medal assigned to ${loserId} (Lower Final loser)`)
    }
    
  } catch (error) {
    console.error('Error assigning medals:', error)
    // Don't throw error to avoid breaking match update
  }
}

export async function updateMatch(matchId: string, updates: {
  competition_id?: string
  faculty1_id?: string
  faculty2_id?: string
  score1?: number
  score2?: number
  status?: 'scheduled' | 'live' | 'completed'
  date?: string
  time?: string
  location?: string
  round?: string
}): Promise<void> {
  console.log('Updating match:', matchId, 'with updates:', updates)
  
  const { data, error } = await supabase
    .from('matches')
    .update({ 
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', matchId)
    .select()

  if (error) {
    console.error('Error updating match:', error)
    throw error
  }
  
  console.log('Match updated successfully:', data)
  
  // If match is completed and has scores, assign medals
  if (updates.status === 'completed' && 
      updates.score1 !== undefined && 
      updates.score2 !== undefined && 
      updates.competition_id && 
      updates.faculty1_id && 
      updates.faculty2_id && 
      updates.round) {
    await assignMedals({
      matchId: matchId,
      competitionId: updates.competition_id,
      faculty1Id: updates.faculty1_id,
      faculty2Id: updates.faculty2_id,
      score1: updates.score1,
      score2: updates.score2,
      round: updates.round
    })
  }
}

export async function deleteMatch(matchId: string): Promise<void> {
  const { error } = await supabase
    .from('matches')
    .delete()
    .eq('id', matchId)

  if (error) {
    console.error('Error deleting match:', error)
    throw error
  }
}

export async function updateFacultyStanding(
  facultyId: string,
  competitionId: string,
  gold: number,
  silver: number,
  bronze: number
): Promise<void> {
  const totalPoints = gold * 3 + silver * 2 + bronze * 1

  const { error } = await supabase
    .from('faculty_standings')
    .upsert({
      faculty_id: facultyId,
      competition_id: competitionId,
      gold,
      silver,
      bronze,
      total_points: totalPoints,
      updated_at: new Date().toISOString()
    })

  if (error) {
    console.error('Error updating faculty standing:', error)
    throw error
  }
}

// Get total medal tally for all faculties
export async function getTotalMedalTally(): Promise<Array<{
  faculty_id: string
  faculty_name: string
  faculty_short_name: string
  total_gold: number
  total_silver: number
  total_bronze: number
  total_points: number
}>> {
  console.log('Fetching medal tally...')
  
  const { data, error } = await supabase
    .from('faculty_standings')
    .select(`
      faculty_id,
      gold,
      silver,
      bronze,
      total_points,
      faculties!faculty_standings_faculty_id_fkey(name, short_name)
    `)

  if (error) {
    console.error('Error fetching medal tally:', error)
    throw error
  }

  console.log('Raw medal tally data:', data)

  // If no data, return empty array
  if (!data || data.length === 0) {
    console.log('No medal tally data found')
    return []
  }

  // Group by faculty and sum medals
  const facultyTotals = new Map<string, {
    faculty_id: string
    faculty_name: string
    faculty_short_name: string
    total_gold: number
    total_silver: number
    total_bronze: number
    total_points: number
  }>()

  data.forEach(standing => {
    const facultyId = standing.faculty_id
    const faculty = standing.faculties as any
    
    if (!facultyTotals.has(facultyId)) {
      facultyTotals.set(facultyId, {
        faculty_id: facultyId,
        faculty_name: faculty.name,
        faculty_short_name: faculty.short_name,
        total_gold: 0,
        total_silver: 0,
        total_bronze: 0,
        total_points: 0
      })
    }
    
    const total = facultyTotals.get(facultyId)!
    total.total_gold += standing.gold
    total.total_silver += standing.silver
    total.total_bronze += standing.bronze
    total.total_points += standing.total_points
  })

  const result = Array.from(facultyTotals.values()).sort((a, b) => b.total_points - a.total_points)
  console.log('Processed medal tally:', result)
  
  return result
}

// Reset all medal tally data
export async function resetMedalTally(): Promise<void> {
  console.log('Resetting medal tally...')
  
  try {
    // Delete all records from faculty_standings table
    const { error } = await supabase
      .from('faculty_standings')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all records
    
    if (error) {
      console.error('Error resetting medal tally:', error)
      throw error
    }
    
    console.log('Medal tally reset successfully!')
  } catch (error) {
    console.error('Error resetting medal tally:', error)
    throw error
  }
}

// Sync medal tally based on all completed matches
export async function syncMedalTally(): Promise<void> {
  console.log('Syncing medal tally from completed matches...')
  
  try {
    // First reset all medal data
    await resetMedalTally()
    
    // Get all completed matches
    const { data: completedMatches, error } = await supabase
      .from('matches')
      .select(`
        id,
        competition_id,
        faculty1_id,
        faculty2_id,
        score1,
        score2,
        round,
        competitions!matches_competition_id_fkey(format, type)
      `)
      .eq('status', 'completed')
      .not('round', 'is', null)
    
    if (error) {
      console.error('Error fetching completed matches:', error)
      throw error
    }
    
    console.log('Found completed matches:', completedMatches)
    
    // Process each completed match
    for (const match of completedMatches || []) {
      // Process elimination competitions OR arts competitions with Final round
      const competition = match.competitions as any
      const isEliminationCompetition = competition?.format === 'elimination'
      const isArtsCompetitionFinal = competition?.type === 'art' && match.round === 'Final'
      
      console.log(`Processing match ${match.id}:`, {
        competitionId: match.competition_id,
        round: match.round,
        competitionFormat: competition?.format,
        competitionType: competition?.type,
        isEliminationCompetition,
        isArtsCompetitionFinal,
        score1: match.score1,
        score2: match.score2
      })
      
      if (isEliminationCompetition || isArtsCompetitionFinal) {
        console.log(`Assigning medals for match ${match.id}`)
        await assignMedals({
          matchId: match.id,
          competitionId: match.competition_id,
          faculty1Id: match.faculty1_id,
          faculty2Id: match.faculty2_id,
          score1: match.score1,
          score2: match.score2,
          round: match.round
        })
      } else {
        console.log(`Skipping match ${match.id} - not eligible for medal assignment`)
      }
    }
    
    console.log('Medal tally synced successfully!')
  } catch (error) {
    console.error('Error syncing medal tally:', error)
    throw error
  }
}

// Test function to add sample medal data
export async function addSampleMedalData(): Promise<void> {
  console.log('Adding sample medal data...')
  
  try {
    // Add some sample medal data for testing
    const sampleData = [
      {
        faculty_id: '550e8400-e29b-41d4-a716-446655440001',
        competition_id: 'futsal',
        gold: 1,
        silver: 0,
        bronze: 1,
        total_points: 4
      },
      {
        faculty_id: '550e8400-e29b-41d4-a716-446655440002',
        competition_id: 'basketball-putra',
        gold: 0,
        silver: 1,
        bronze: 0,
        total_points: 2
      },
      {
        faculty_id: '550e8400-e29b-41d4-a716-446655440003',
        competition_id: 'volleyball',
        gold: 0,
        silver: 0,
        bronze: 1,
        total_points: 1
      }
    ]

    for (const data of sampleData) {
      await updateFacultyStanding(
        data.faculty_id,
        data.competition_id,
        data.gold,
        data.silver,
        data.bronze
      )
    }
    
    console.log('Sample medal data added successfully!')
  } catch (error) {
    console.error('Error adding sample medal data:', error)
  }
}

export async function updateTableStanding(
  facultyId: string,
  competitionId: string,
  points: number,
  rank: number
): Promise<void> {
  const { error } = await supabase
    .from('table_standings')
    .upsert({
      faculty_id: facultyId,
      competition_id: competitionId,
      points,
      rank,
      updated_at: new Date().toISOString()
    })

  if (error) {
    console.error('Error updating table standing:', error)
    throw error
  }
}

// Polling functions for live updates (until real-time is available)
export function startPolling(
  fetchFunction: () => Promise<any>,
  callback: (data: any) => void,
  intervalMs: number = 5000
): NodeJS.Timeout {
  // Initial fetch
  fetchFunction().then(callback).catch(console.error)
  
  // Set up polling
  return setInterval(() => {
    fetchFunction().then(callback).catch(console.error)
  }, intervalMs)
}

export function stopPolling(intervalId: NodeJS.Timeout): void {
  clearInterval(intervalId)
}

// Real-time subscriptions (for future use when Replication is available)
export function subscribeToMatches(callback: (payload: any) => void) {
  return supabase
    .channel('matches')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'matches' }, 
      callback
    )
    .subscribe()
}

export function subscribeToFacultyStandings(callback: (payload: any) => void) {
  return supabase
    .channel('faculty_standings')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'faculty_standings' }, 
      callback
    )
    .subscribe()
}

export function subscribeToTableStandings(callback: (payload: any) => void) {
  return supabase
    .channel('table_standings')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'table_standings' }, 
      callback
    )
    .subscribe()
}

export async function clearTableStandings(): Promise<void> {
  try {
    const { error } = await supabase
      .from('table_standings')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all records
    
    if (error) {
      console.error('Error clearing table standings:', error)
      throw error
    }
    
    console.log('Table standings cleared')
  } catch (error) {
    console.error('Error clearing table standings:', error)
    throw error
  }
}

// Arts Competition Scores functions
export async function saveArtsCompetitionScores(matchId: string, scores: { facultyId: string, score: number }[]): Promise<void> {
  try {
    // First, delete existing scores for this match
    await supabase
      .from('arts_competition_scores')
      .delete()
      .eq('match_id', matchId)
    
    // Then, insert new scores
    const scoreData = scores.map(({ facultyId, score }) => ({
      match_id: matchId,
      faculty_id: facultyId,
      score: score
    }))
    
    const { error } = await supabase
      .from('arts_competition_scores')
      .insert(scoreData)
    
    if (error) {
      console.error('Error saving arts competition scores:', error)
      throw error
    }
    
    console.log('Arts competition scores saved successfully')
  } catch (error) {
    console.error('Error saving arts competition scores:', error)
    throw error
  }
}

export async function getArtsCompetitionScores(matchId: string): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('arts_competition_scores')
      .select(`
        *,
        faculty:faculties(id, name, short_name, color)
      `)
      .eq('match_id', matchId)
    
    if (error) {
      console.error('Error fetching arts competition scores:', error)
      throw error
    }
    
    return data || []
  } catch (error) {
    console.error('Error fetching arts competition scores:', error)
    throw error
  }
}
