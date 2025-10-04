// Simple test script to check Supabase connection and policies
// Run this in browser console to test

const testSupabaseConnection = async () => {
  try {
    // Test read access
    console.log('Testing read access...');
    const { data: faculties, error: readError } = await supabase
      .from('faculties')
      .select('*')
      .limit(1);
    
    if (readError) {
      console.error('Read error:', readError);
    } else {
      console.log('Read access works:', faculties);
    }
    
    // Test write access
    console.log('Testing write access...');
    const testMatch = {
      competition_id: 'futsal',
      faculty1_id: '550e8400-e29b-41d4-a716-446655440001',
      faculty2_id: '550e8400-e29b-41d4-a716-446655440002',
      date: '2025-10-12',
      time: '10:00:00',
      location: 'Test Field',
      round: 'Test'
    };
    
    const { data: insertData, error: writeError } = await supabase
      .from('matches')
      .insert(testMatch)
      .select();
    
    if (writeError) {
      console.error('Write error:', writeError);
    } else {
      console.log('Write access works:', insertData);
      
      // Clean up test data
      if (insertData && insertData[0]) {
        await supabase
          .from('matches')
          .delete()
          .eq('id', insertData[0].id);
        console.log('Test data cleaned up');
      }
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
};

// Run the test
testSupabaseConnection();
