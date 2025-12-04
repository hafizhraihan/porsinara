/**
 * Test Supabase connection and schema access
 * Use this to diagnose connection and permission issues
 */

import { supabase } from './supabase'

export async function testSupabaseConnection() {
  console.log('🔍 Testing Supabase Connection...')
  console.log('📍 Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
  console.log('🔑 Anon Key:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 30) + '...')

  const results = {
    connectionOk: false,
    matchesAccessible: false,
    playersAccessible: false,
    basketballStatsAccessible: false,
    errors: [] as string[]
  }

  try {
    // Test 1: Basic connection with matches table
    console.log('\n1️⃣ Testing matches table access...')
    const { data: matchesData, error: matchesError } = await supabase
      .from('matches')
      .select('id')
      .limit(1)

    if (matchesError) {
      results.errors.push(`Matches error: ${matchesError.message}`)
      console.error('❌ Matches table error:', matchesError)
    } else {
      results.matchesAccessible = true
      results.connectionOk = true
      console.log('✅ Matches table accessible')
    }

    // Test 2: Players table
    console.log('\n2️⃣ Testing players table access...')
    const { data: playersData, error: playersError } = await supabase
      .from('players')
      .select('id, name')
      .limit(1)

    if (playersError) {
      results.errors.push(`Players error: ${playersError.message}`)
      console.error('❌ Players table error:', playersError)
    } else {
      results.playersAccessible = true
      console.log('✅ Players table accessible')
      console.log(`   Found ${playersData?.length || 0} player(s)`)
    }

    // Test 3: Basketball stats table
    console.log('\n3️⃣ Testing basketball_stats table access...')
    const { data: statsData, error: statsError } = await supabase
      .from('basketball_stats')
      .select('id')
      .limit(1)

    if (statsError) {
      results.errors.push(`Basketball stats error: ${statsError.message}`)
      console.error('❌ Basketball stats table error:', statsError)
      console.error('   Error details:', JSON.stringify(statsError, null, 2))
    } else {
      results.basketballStatsAccessible = true
      console.log('✅ Basketball stats table accessible')
      console.log(`   Found ${statsData?.length || 0} stat record(s)`)
    }

    // Test 4: Test JOIN query
    console.log('\n4️⃣ Testing JOIN query...')
    const { data: joinData, error: joinError } = await supabase
      .from('basketball_stats')
      .select(`
        id,
        match_id,
        player_id,
        players (
          name,
          jersey_number
        )
      `)
      .limit(1)

    if (joinError) {
      results.errors.push(`JOIN error: ${joinError.message}`)
      console.error('❌ JOIN query error:', joinError)
    } else {
      console.log('✅ JOIN query successful')
      console.log('   Sample data:', joinData)
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error)
    results.errors.push(`Unexpected error: ${error}`)
  }

  // Summary
  console.log('\n📊 CONNECTION TEST SUMMARY:')
  console.log('─────────────────────────────')
  console.log('Connection OK:', results.connectionOk ? '✅' : '❌')
  console.log('Matches accessible:', results.matchesAccessible ? '✅' : '❌')
  console.log('Players accessible:', results.playersAccessible ? '✅' : '❌')
  console.log('Basketball stats accessible:', results.basketballStatsAccessible ? '✅' : '❌')
  
  if (results.errors.length > 0) {
    console.log('\n⚠️ ERRORS FOUND:')
    results.errors.forEach((err, i) => {
      console.log(`${i + 1}. ${err}`)
    })
  } else {
    console.log('\n✅ All tests passed!')
  }

  return results
}

/**
 * Test INSERT operation
 */
export async function testBasketballStatsInsert(matchId: string, playerId: string) {
  console.log('\n🧪 Testing INSERT operation...')
  
  const testData = {
    match_id: matchId,
    player_id: playerId,
    free_throw_attempt: 5,
    free_throw_made: 3,
    two_point_attempt: 10,
    two_point_made: 7,
    three_point_attempt: 3,
    three_point_made: 1,
    offensive_rebound: 2,
    defensive_rebound: 4,
    assists: 3,
    turnovers: 2
  }

  const { data, error } = await supabase
    .from('basketball_stats')
    .insert(testData)
    .select()

  if (error) {
    console.error('❌ INSERT failed:', error)
    console.error('   Error details:', JSON.stringify(error, null, 2))
    return { success: false, error }
  }

  console.log('✅ INSERT successful')
  console.log('   Data:', data)
  console.log('   Total points should be:', (3 + 7*2 + 1*3), '(auto-calculated)')
  console.log('   Total rebound should be:', (2 + 4), '(auto-calculated)')
  
  return { success: true, data }
}

/**
 * Test UPDATE operation
 */
export async function testBasketballStatsUpdate(statId: string) {
  console.log('\n🧪 Testing UPDATE operation...')
  
  const { data, error } = await supabase
    .from('basketball_stats')
    .update({
      assists: 5,
      turnovers: 3
    })
    .eq('id', statId)
    .select()

  if (error) {
    console.error('❌ UPDATE failed:', error)
    return { success: false, error }
  }

  console.log('✅ UPDATE successful')
  console.log('   Data:', data)
  
  return { success: true, data }
}


