'use client';

import { useState, useEffect } from 'react';
import { Save, Plus, Edit, Trash2, Trophy, Users, RotateCcw, RefreshCw, Shield, Download, ChevronDown } from 'lucide-react';
import { getFacultyColorClasses, getCompetitionIcon } from '@/lib/utils';
import { useToast } from '@/components/ToastContainer';
import { 
  getMatches, 
  getCompetitions, 
  getFaculties,
  updateMatchScore,
  createMatch,
  updateMatch,
  deleteMatch,
  resetMedalTally,
  syncMedalTally,
  saveArtsCompetitionScores,
  getArtsCompetitionScores,
  startPolling,
  stopPolling
} from '@/lib/supabase-queries';

interface Match {
  id: string;
  competitionId: string;
  faculty1Id: string;
  faculty2Id: string;
  faculty1Score: number;
  faculty2Score: number;
  status: 'upcoming' | 'ongoing' | 'completed';
  date?: string;
  time?: string;
  location?: string;
  round?: string;
  notes?: string;
}

interface AdminUser {
  id: string;
  username: string;
  role: 'SUP' | 'SPV' | 'STF';
  competition: string | null;
}

interface Competition {
  id: string;
  name: string;
  type: string;
  icon: string;
}

interface Faculty {
  id: string;
  name: string;
  short_name: string;
  color: string;
}

export default function AdminPanel() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [loading, setLoading] = useState(true);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [syncingMedals, setSyncingMedals] = useState(false);
  const { addToast } = useToast();

  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedCompetitionId, setSelectedCompetitionId] = useState<string>('');
  const [artsCompetitionScores, setArtsCompetitionScores] = useState<{[facultyId: string]: number}>({});
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [sortBy, setSortBy] = useState<'date' | 'competition'>('date');
  const [showExportDropdown, setShowExportDropdown] = useState(false);

  // Export functions
  const exportToJSON = () => {
    const exportData = {
      matches: matches,
      competitions: competitions,
      faculties: faculties,
      exportDate: new Date().toISOString(),
      exportedBy: adminUser?.username || 'Unknown'
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `porsinara-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    addToast({
      type: 'success',
      title: 'Export Successful',
      message: 'Data exported to JSON successfully!',
      duration: 4000
    });
  };

  const exportToCSV = () => {
    // Export matches data
    const matchesCSV = [
      ['ID', 'Competition', 'Faculty 1', 'Faculty 2', 'Score 1', 'Score 2', 'Status', 'Date', 'Time', 'Location', 'Round'],
      ...matches.map(match => [
        match.id,
        competitions.find(c => c.id === match.competitionId)?.name || 'Unknown',
        faculties.find(f => f.id === match.faculty1Id)?.name || 'Unknown',
        faculties.find(f => f.id === match.faculty2Id)?.name || 'Unknown',
        match.faculty1Score || '',
        match.faculty2Score || '',
        match.status,
        match.date,
        match.time,
        match.location,
        match.round || ''
      ])
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

    const dataBlob = new Blob([matchesCSV], { type: 'text/csv' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `porsinara-matches-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    addToast({
      type: 'success',
      title: 'Export Successful',
      message: 'Matches data exported to CSV successfully!',
      duration: 4000
    });
  };

  const exportToExcel = async () => {
    try {
      // For Excel export, we'll create a simple HTML table that can be opened in Excel
      const excelData = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta charset="utf-8">
          <meta name="ProgId" content="Excel.Sheet">
          <meta name="Generator" content="Microsoft Excel 11">
          <title>PORSINARA Data Export</title>
        </head>
        <body>
          <table>
            <tr><th colspan="11">PORSINARA Matches Data Export</th></tr>
            <tr><th colspan="11">Exported on: ${new Date().toLocaleString()}</th></tr>
            <tr><th colspan="11">Exported by: ${adminUser?.username || 'Unknown'}</th></tr>
            <tr></tr>
            <tr>
              <th>ID</th>
              <th>Competition</th>
              <th>Faculty 1</th>
              <th>Faculty 2</th>
              <th>Score 1</th>
              <th>Score 2</th>
              <th>Status</th>
              <th>Date</th>
              <th>Time</th>
              <th>Location</th>
              <th>Round</th>
            </tr>
            ${matches.map(match => `
              <tr>
                <td>${match.id}</td>
                <td>${competitions.find(c => c.id === match.competitionId)?.name || 'Unknown'}</td>
                <td>${faculties.find(f => f.id === match.faculty1Id)?.name || 'Unknown'}</td>
                <td>${faculties.find(f => f.id === match.faculty2Id)?.name || 'Unknown'}</td>
                <td>${match.faculty1Score || ''}</td>
                <td>${match.faculty2Score || ''}</td>
                <td>${match.status}</td>
                <td>${match.date}</td>
                <td>${match.time}</td>
                <td>${match.location}</td>
                <td>${match.round || ''}</td>
              </tr>
            `).join('')}
          </table>
        </body>
        </html>
      `;

      const dataBlob = new Blob([excelData], { type: 'application/vnd.ms-excel' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `porsinara-data-${new Date().toISOString().split('T')[0]}.xls`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      addToast({
        type: 'success',
        title: 'Export Successful',
        message: 'Data exported to Excel successfully!',
        duration: 4000
      });
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      addToast({
        type: 'error',
        title: 'Export Failed',
        message: 'Error exporting to Excel. Check console for details.',
        duration: 6000
      });
    }
  };

  // Load admin user data
  useEffect(() => {
    const loadUserData = () => {
      const userData = sessionStorage.getItem('adminUser');
      if (userData) {
        try {
          const user = JSON.parse(userData);
          setAdminUser(user);
        } catch (error) {
          console.error('Error parsing admin user data:', error);
        }
      } else {
        setAdminUser(null);
      }
    };

    loadUserData();

    // Listen for session changes
    const handleSessionChange = () => {
      console.log('Dashboard: Session change detected, reloading user data');
      loadUserData();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('adminSessionChanged', handleSessionChange);
      
      // Also listen for storage changes
      const handleStorageChange = (e: StorageEvent) => {
        if (e.key === 'adminLoggedIn' || e.key === 'adminUser') {
          console.log('Dashboard: Storage change detected, reloading user data');
          loadUserData();
        }
      };
      
      window.addEventListener('storage', handleStorageChange);
      
      return () => {
        window.removeEventListener('adminSessionChanged', handleSessionChange);
        window.removeEventListener('storage', handleStorageChange);
      };
    }
  }, []);

  // Close export dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showExportDropdown) {
        const target = event.target as HTMLElement;
        if (!target.closest('.export-dropdown-container')) {
          setShowExportDropdown(false);
        }
      }
    };

    if (typeof window !== 'undefined') {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      if (typeof window !== 'undefined') {
        document.removeEventListener('mousedown', handleClickOutside);
      }
    };
  }, [showExportDropdown]);

  // Permission functions based on role
  const canAddMatch = () => {
    if (!adminUser) return false;
    return adminUser.role === 'SUP' || adminUser.role === 'SPV';
  };

  const canDeleteMatch = () => {
    if (!adminUser) return false;
    return adminUser.role === 'SUP' || adminUser.role === 'SPV';
  };

  const canSyncMedals = () => {
    if (!adminUser) return false;
    return adminUser.role === 'SUP' || adminUser.role === 'SPV';
  };

  const canResetMedals = () => {
    if (!adminUser) return false;
    return adminUser.role === 'SUP';
  };


  // Helper function to get user's allowed competition IDs
  const getUserCompetitionIds = () => {
    if (!adminUser || !competitions || competitions.length === 0) return [];
    
    if (adminUser.role === 'SUP') {
      return competitions.map(c => c.id); // Super users see all competitions
    }
    
    if (adminUser.competition) {
      // Handle both single competition and comma-separated multiple competitions
      return adminUser.competition.split(',').map(id => id.trim());
    }
    
    return [];
  };


  // Filter matches based on user role and competition
  const getFilteredMatches = () => {
    if (!adminUser || !matches) return [];
    
    const allowedCompetitionIds = getUserCompetitionIds();
    return matches.filter(match => allowedCompetitionIds.includes(match.competitionId));
  };

  // Sort matches by selected criteria
  const sortedMatches = [...getFilteredMatches()].sort((a, b) => {
    if (sortBy === 'date') {
      if (!a.date || !b.date) return 0;
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      
      if (sortOrder === 'asc') {
        return dateA.getTime() - dateB.getTime();
      } else {
        return dateB.getTime() - dateA.getTime();
      }
    } else if (sortBy === 'competition') {
      const competitionA = competitions.find(c => c.id === a.competitionId);
      const competitionB = competitions.find(c => c.id === b.competitionId);
      const nameA = competitionA?.name || 'Unknown';
      const nameB = competitionB?.name || 'Unknown';
      
      if (sortOrder === 'asc') {
        return nameA.localeCompare(nameB);
      } else {
        return nameB.localeCompare(nameA);
      }
    }
    return 0;
  });

  // Debug matches state
  useEffect(() => {
    console.log('Matches state updated:', matches);
    if (matches.length > 0) {
      console.log('First match in state keys:', Object.keys(matches[0]));
      console.log('First match in state date/time/location/round:', {
        date: matches[0].date,
        time: matches[0].time,
        location: matches[0].location,
        round: matches[0].round
      });
    }
  }, [matches]);

  // Set selectedCompetitionId when editing a match
  useEffect(() => {
    if (editingMatch) {
      setSelectedCompetitionId(editingMatch.competitionId);
    } else {
      setSelectedCompetitionId('');
    }
  }, [editingMatch]);

  // Load arts competition scores when editing a match
  useEffect(() => {
    const loadArtsScores = async () => {
      if (editingMatch) {
        const competition = competitions.find(c => c.id === editingMatch.competitionId);
        if (competition?.type === 'art') {
          try {
            const scores = await getArtsCompetitionScores(editingMatch.id);
            const scoresMap: {[facultyId: string]: number} = {};
            scores.forEach((score: { faculty_id: string; score: number }) => {
              scoresMap[score.faculty_id] = score.score;
            });
            setArtsCompetitionScores(scoresMap);
          } catch (error) {
            console.error('Error loading arts competition scores:', error);
            setArtsCompetitionScores({});
          }
        } else {
          setArtsCompetitionScores({});
        }
      } else {
        setArtsCompetitionScores({});
      }
    };

    loadArtsScores();
  }, [editingMatch, competitions]);

  // Fetch data from Supabase
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        const [matchesData, competitionsData, facultiesData] = await Promise.all([
          getMatches(),
          getCompetitions(),
          getFaculties()
        ]);

        console.log('Raw matches data from database:', matchesData);
        if (matchesData.length > 0) {
          console.log('First match raw data:', matchesData[0]);
          console.log('First match keys:', Object.keys(matchesData[0]));
        }

        // Transform matches data
        const transformedMatches = matchesData.map((match: Record<string, any>) => {
          console.log('Transforming match:', match.id, {
            rawDate: match.date,
            rawTime: match.time,
            rawLocation: match.location,
            rawRound: match.round
          });
          
          const transformed = {
            id: match.id,
            competitionId: match.competition_id,
            faculty1Id: match.faculty1_id,
            faculty2Id: match.faculty2_id,
            faculty1Score: match.score1 || 0,
            faculty2Score: match.score2 || 0,
            status: (match.status === 'live' ? 'ongoing' : match.status === 'completed' ? 'completed' : match.status === 'scheduled' ? 'upcoming' : 'upcoming') as Match['status'],
            date: match.date ?? new Date().toISOString().split('T')[0],
            time: match.time ? match.time.substring(0, 5) : '09:00', // Convert HH:MM:SS to HH:MM
            location: match.location ?? 'Main Field',
            round: match.round ?? 'Semifinal',
            notes: match.notes ?? ''
          };
          
          console.log('Transformed result:', transformed);
          console.log('Transformed result keys:', Object.keys(transformed));
          console.log('Transformed result date/time/location/round:', {
            date: transformed.date,
            time: transformed.time,
            location: transformed.location,
            round: transformed.round
          });
          return transformed;
        });

        console.log('Transformed matches data:', transformedMatches);
        console.log('First transformed match keys:', Object.keys(transformedMatches[0]));
        console.log('First transformed match date/time/location/round:', {
          date: transformedMatches[0].date,
          time: transformedMatches[0].time,
          location: transformedMatches[0].location,
          round: transformedMatches[0].round
        });
        setMatches(transformedMatches);
        setCompetitions(competitionsData);
        setFaculties(facultiesData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching admin data:', error);
        setLoading(false);
      }
    };

    fetchData();

    // Set up polling for live updates
    const matchesPolling = startPolling(
      getMatches,
      (data) => {
        const transformed = data.map((match: Record<string, any>) => ({
          id: match.id,
          competitionId: match.competition_id,
          faculty1Id: match.faculty1_id,
          faculty2Id: match.faculty2_id,
          faculty1Score: match.score1 || 0,
          faculty2Score: match.score2 || 0,
          status: (match.status === 'live' ? 'ongoing' : match.status === 'completed' ? 'completed' : 'upcoming') as Match['status'],
          date: match.date ?? new Date().toISOString().split('T')[0],
          time: match.time ? match.time.substring(0, 5) : '09:00', // Convert HH:MM:SS to HH:MM
          location: match.location ?? 'Main Field',
          round: match.round ?? 'Semifinal',
          notes: match.notes ?? ''
        }));
        setMatches(transformed);
      },
      5000 // Poll every 5 seconds
    );

    return () => {
      stopPolling(matchesPolling);
    };
  }, []);

  const handleScoreUpdate = async (matchId: string, faculty: 'faculty1' | 'faculty2', score: number) => {
    try {
      const match = matches.find(m => m.id === matchId);
      if (!match) return;

      const score1 = faculty === 'faculty1' ? score : match.faculty1Score;
      const score2 = faculty === 'faculty2' ? score : match.faculty2Score;
      
      // Update in Supabase
      await updateMatchScore(matchId, score1, score2, 'live');
      
      // Update local state
      setMatches(prev => prev.map(m => 
        m.id === matchId 
          ? { ...m, [`${faculty}Score`]: score }
          : m
      ));
    } catch (error) {
      console.error('Error updating score:', error);
    }
  };


  const handleStatusUpdate = async (matchId: string, status: Match['status']) => {
    try {
      // Map the status to Supabase format
      const supabaseStatus = status === 'ongoing' ? 'live' : status === 'completed' ? 'completed' : 'scheduled';
      
      // Update in Supabase
      await updateMatch(matchId, { status: supabaseStatus });
      
      // Update local state
      setMatches(prev => prev.map(match => 
        match.id === matchId 
          ? { ...match, status }
          : match
      ));
    } catch (error) {
      console.error('Error updating match status:', error);
    }
  };

  const handleSaveMatch = async (matchData: Partial<Match>) => {
    try {
      if (editingMatch) {
        // Update existing match
        const supabaseStatus = matchData.status === 'ongoing' ? 'live' : matchData.status === 'completed' ? 'completed' : 'scheduled';
        
        await updateMatch(editingMatch.id, {
          competition_id: matchData.competitionId,
          faculty1_id: matchData.faculty1Id,
          faculty2_id: matchData.faculty2Id,
          score1: matchData.faculty1Score,
          score2: matchData.faculty2Score,
          status: supabaseStatus,
          date: matchData.date || new Date().toISOString().split('T')[0],
          time: matchData.time || '09:00:00',
          location: matchData.location || 'Main Field',
          round: matchData.round || 'Regular'
        });
        
        // Refresh matches from database after update
        const updatedMatches = await getMatches();
        const transformedMatches = updatedMatches.map((match: Record<string, any>) => ({
          id: match.id,
          competitionId: match.competition_id,
          faculty1Id: match.faculty1_id,
          faculty2Id: match.faculty2_id,
          faculty1Score: match.score1 || 0,
          faculty2Score: match.score2 || 0,
          status: (match.status === 'live' ? 'ongoing' : match.status === 'completed' ? 'completed' : 'upcoming') as Match['status'],
          date: match.date,
          time: match.time,
          location: match.location,
          round: match.round,
          notes: ''
        }));
        setMatches(transformedMatches);
        setEditingMatch(null);
      } else {
        // Create new match
        const supabaseStatus = matchData.status === 'ongoing' ? 'live' : matchData.status === 'completed' ? 'completed' : 'scheduled';
        
        // Ensure time is in HH:MM:SS format
        const timeFormatted = matchData.time ? 
          (matchData.time.includes(':') && matchData.time.split(':').length === 2 ? 
            `${matchData.time}:00` : matchData.time) : '09:00:00';
        
        const matchDataToSend = {
          competition_id: matchData.competitionId || 'futsal',
          faculty1_id: matchData.faculty1Id || '550e8400-e29b-41d4-a716-446655440001',
          faculty2_id: matchData.faculty2Id || '550e8400-e29b-41d4-a716-446655440002',
          date: matchData.date || new Date().toISOString().split('T')[0],
          time: timeFormatted,
          location: matchData.location || 'Main Field',
          round: matchData.round || 'Regular',
          status: supabaseStatus
        };
        
        console.log('Sending match data to createMatch:', matchDataToSend);
        
        // Validate required fields
        if (!matchDataToSend.competition_id || !matchDataToSend.faculty1_id || !matchDataToSend.faculty2_id) {
          console.error('Missing required fields:', matchDataToSend);
          throw new Error('Missing required fields for match creation');
        }
        
        await createMatch(matchDataToSend);
        
        // Refresh matches from database
        const updatedMatches = await getMatches();
        const transformedMatches = updatedMatches.map((match: Record<string, any>) => ({
          id: match.id,
          competitionId: match.competition_id,
          faculty1Id: match.faculty1_id,
          faculty2Id: match.faculty2_id,
          faculty1Score: match.score1 || 0,
          faculty2Score: match.score2 || 0,
          status: (match.status === 'live' ? 'ongoing' : match.status === 'completed' ? 'completed' : 'upcoming') as Match['status'],
          date: match.date,
          time: match.time,
          location: match.location,
          round: match.round,
          notes: ''
        }));
        setMatches(transformedMatches);
        setShowAddForm(false);
      }
    } catch (error) {
      console.error('Error saving match:', error);
    }
  };

  const getFacultyName = (facultyId: string) => {
    return faculties.find(f => f.id === facultyId)?.short_name || facultyId;
  };

  const getCompetitionName = (competitionId: string) => {
    const competition = competitions.find(c => c.id === competitionId);
    return competition ? competition.name : 'Unknown';
  };

  const handleDeleteMatch = async (matchId: string) => {
    if (!canDeleteMatch()) {
      addToast({
        type: 'error',
        title: 'Permission Denied',
        message: 'You do not have permission to delete matches.',
        duration: 5000
      });
      return;
    }

    if (confirm('Are you sure you want to delete this match?')) {
      try {
        // Delete from Supabase
        await deleteMatch(matchId);
        
        // Update local state
        setMatches(prev => prev.filter(match => match.id !== matchId));
        
        addToast({
          type: 'success',
          title: 'Match Deleted',
          message: 'Match has been deleted successfully.',
          duration: 4000
        });
      } catch (error) {
        console.error('Error deleting match:', error);
        addToast({
          type: 'error',
          title: 'Delete Failed',
          message: 'Error deleting match. Check console for details.',
          duration: 6000
        });
      }
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Admin Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
            <p className="text-gray-600 mt-1">
              {adminUser?.competition && competitions && competitions.length > 0
                ? `Managing ${getUserCompetitionIds().map(id => getCompetitionName(id)).join(', ')} matches`
                : 'Live Score Management'
              }
            </p>
            {adminUser && (
              <div className="mt-2 flex items-center space-x-2 text-sm">
                <Shield className="w-4 h-4 text-blue-600" />
                <span className="text-gray-600">
                  {adminUser.role === 'SUP' && 'Super User - Full Access'}
                  {adminUser.role === 'SPV' && competitions && competitions.length > 0 && `Supervisor - ${getUserCompetitionIds().map(id => getCompetitionName(id)).join(', ')} Access`}
                  {adminUser.role === 'STF' && competitions && competitions.length > 0 && `Staff - ${getUserCompetitionIds().map(id => getCompetitionName(id)).join(', ')} Limited Access`}
                </span>
              </div>
            )}
          </div>
          <div className="flex space-x-3">
            {canSyncMedals() && (
              <button
                onClick={async () => {
                  if (!canSyncMedals()) {
                    addToast({
                      type: 'error',
                      title: 'Permission Denied',
                      message: 'You do not have permission to sync medals.',
                      duration: 5000
                    });
                    return;
                  }

                  setSyncingMedals(true);
                  try {
                    await syncMedalTally();
                    addToast({
                      type: 'success',
                      title: 'Medal Tally Synced',
                      message: 'All completed matches have been processed successfully!',
                      duration: 4000
                    });
                  } catch (error) {
                    console.error('Error syncing medal tally:', error);
                    addToast({
                      type: 'error',
                      title: 'Sync Failed',
                      message: 'Error syncing medal tally. Check console for details.',
                      duration: 6000
                    });
                  } finally {
                    setSyncingMedals(false);
                  }
                }}
                disabled={syncingMedals}
                className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors ${
                  syncingMedals 
                    ? 'bg-green-500 text-white cursor-not-allowed opacity-75' 
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                <RefreshCw className={`w-4 h-4 ${syncingMedals ? 'animate-spin' : ''}`} />
                <span>{syncingMedals ? 'Syncing...' : 'Sync Medals'}</span>
              </button>
            )}
            {canResetMedals() && (
              <button
                onClick={async () => {
                  if (!canResetMedals()) {
                    addToast({
                      type: 'error',
                      title: 'Permission Denied',
                      message: 'Only Super Users can reset medals.',
                      duration: 5000
                    });
                    return;
                  }

                  if (confirm('Are you sure you want to reset all medal tally data? This action cannot be undone.')) {
                    try {
                      await resetMedalTally();
                      addToast({
                        type: 'success',
                        title: 'Medal Tally Reset',
                        message: 'All medal tallies have been reset successfully!',
                        duration: 4000
                      });
                    } catch (error) {
                      console.error('Error resetting medal tally:', error);
                      addToast({
                        type: 'error',
                        title: 'Reset Failed',
                        message: 'Error resetting medal tally. Check console for details.',
                        duration: 6000
                      });
                    }
                  }
                }}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center space-x-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reset Medals</span>
              </button>
            )}
            {adminUser?.role === 'SUP' && (
              <div className="relative export-dropdown-container">
                <button
                  onClick={() => setShowExportDropdown(!showExportDropdown)}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Export Data</span>
                  <ChevronDown className="w-4 h-4" />
                </button>
                
                {showExportDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                    <div className="py-1">
                      <button
                        onClick={() => {
                          exportToJSON();
                          setShowExportDropdown(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                      >
                        <span>📄</span>
                        <span>Export as JSON</span>
                      </button>
                      <button
                        onClick={() => {
                          exportToCSV();
                          setShowExportDropdown(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                      >
                        <span>📊</span>
                        <span>Export as CSV</span>
                      </button>
                      <button
                        onClick={() => {
                          exportToExcel();
                          setShowExportDropdown(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                      >
                        <span>📈</span>
                        <span>Export as Excel</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
            {canAddMatch() && (
              <button
                onClick={() => setShowAddForm(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add Match</span>
              </button>
            )}
          </div>
        </div>
        {/* Quick Stats */}
        <section className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <Trophy className="w-8 h-8 text-yellow-500 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Matches</p>
                  <p className="text-2xl font-bold text-gray-900">{matches.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <Users className="w-8 h-8 text-green-500 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Live Matches</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {matches.filter(m => m.status === 'ongoing').length}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <Save className="w-8 h-8 text-blue-500 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {matches.filter(m => m.status === 'completed').length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Matches Management */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Match Management</h2>
            <div className="flex items-center space-x-3">
              <label className="text-sm font-medium text-gray-700">Sort:</label>
              <button
                onClick={() => {
                  if (sortBy === 'date') {
                    // If already sorting by date, toggle order
                    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                  } else {
                    // Switch to date sorting
                    setSortBy('date');
                    setSortOrder('asc');
                  }
                }}
                className={`px-4 py-2 rounded-md transition-colors font-medium flex items-center space-x-2 ${
                  sortBy === 'date' 
                    ? 'bg-blue-100 text-blue-800 hover:bg-blue-200' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <span>📅 Date</span>
                {sortBy === 'date' && (
                  <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                )}
              </button>
              <button
                onClick={() => {
                  if (sortBy === 'competition') {
                    // If already sorting by competition, toggle order
                    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                  } else {
                    // Switch to competition sorting
                    setSortBy('competition');
                    setSortOrder('asc');
                  }
                }}
                className={`px-4 py-2 rounded-md transition-colors font-medium flex items-center space-x-2 ${
                  sortBy === 'competition' 
                    ? 'bg-blue-100 text-blue-800 hover:bg-blue-200' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <span>🏆 Competition</span>
                {sortBy === 'competition' && (
                  <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                )}
              </button>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                      Competition
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                      Round
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                      Teams
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                      Score
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedMatches.map((match) => (
                    <tr key={match.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          {(() => {
                            const competition = competitions.find((c: Competition) => c.id === match.competitionId);
                            const IconComponent = competition ? getCompetitionIcon(competition.icon) : null;
                            return IconComponent ? <IconComponent className="w-4 h-4 text-gray-600" /> : null;
                          })()}
                          <div className="text-sm font-medium text-gray-900">
                            {getCompetitionName(match.competitionId)}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">{match.round || 'Regular'}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {(() => {
                          const competition = competitions.find(c => c.id === match.competitionId);
                          const isArtCompetition = competition?.type === 'art';
                          
                          if (isArtCompetition) {
                            // For arts competitions, show individual performance
                            return (
                              <div className="text-left">
                                <div className="text-sm text-gray-600">Individual Performance</div>
                              </div>
                            );
                          } else {
                            // For sports competitions, show versus format
                            return (
                              <div className="flex items-center space-x-4">
                                <div className="flex items-center space-x-2">
                                  <div className={`w-3 h-3 rounded-full ${getFacultyColorClasses(match.faculty1Id).split(' ')[0]}`}></div>
                                  <span className="text-sm text-gray-900">{getFacultyName(match.faculty1Id)}</span>
                                </div>
                                <span className="text-gray-600">vs</span>
                                <div className="flex items-center space-x-2">
                                  <div className={`w-3 h-3 rounded-full ${getFacultyColorClasses(match.faculty2Id).split(' ')[0]}`}></div>
                                  <span className="text-sm text-gray-900">{getFacultyName(match.faculty2Id)}</span>
                                </div>
                              </div>
                            );
                          }
                        })()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {(() => {
                          const competition = competitions.find(c => c.id === match.competitionId);
                          const isArtCompetition = competition?.type === 'art';
                          
                          if (isArtCompetition) {
                            // For arts competitions, show scores button
                            return (
                              <div className="flex items-center justify-center">
                                <button
                                  onClick={() => setEditingMatch(match)}
                                  className="px-3 py-1 bg-blue-100 text-blue-800 rounded-md text-sm hover:bg-blue-200 transition-colors"
                                >
                                  View Scores
                                </button>
                              </div>
                            );
                          } else {
                            // For sports competitions, show versus scores
                            return (
                              <div className="flex items-center space-x-4">
                                <input
                                  type="number"
                                  value={match.faculty1Score}
                                  onChange={(e) => handleScoreUpdate(match.id, 'faculty1', parseInt(e.target.value) || 0)}
                                  className="w-16 px-2 py-1 border border-gray-300 rounded text-center text-sm text-gray-900"
                                  min="0"
                                />
                                <span className="text-gray-600">-</span>
                                <input
                                  type="number"
                                  value={match.faculty2Score}
                                  onChange={(e) => handleScoreUpdate(match.id, 'faculty2', parseInt(e.target.value) || 0)}
                                  className="w-16 px-2 py-1 border border-gray-300 rounded text-center text-sm text-gray-900"
                                  min="0"
                                />
                              </div>
                            );
                          }
                        })()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={match.status}
                          onChange={(e) => handleStatusUpdate(match.id, e.target.value as Match['status'])}
                          className={`px-3 py-1 border rounded text-sm font-medium ${
                            match.status === 'upcoming' 
                              ? 'border-blue-300 bg-blue-50 text-blue-700' 
                              : match.status === 'ongoing' 
                              ? 'border-orange-300 bg-orange-50 text-orange-700' 
                              : 'border-green-300 bg-green-50 text-green-700'
                          }`}
                        >
                          <option value="upcoming">Upcoming</option>
                          <option value="ongoing">Ongoing</option>
                          <option value="completed">Completed</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                            <button
                              onClick={() => {
                                console.log('Edit button clicked for match:', match);
                                console.log('Match keys:', Object.keys(match));
                                console.log('Match date:', match.date);
                                console.log('Match time:', match.time);
                                console.log('Match location:', match.location);
                                console.log('Match round:', match.round);
                                console.log('All match properties:', {
                                  id: match.id,
                                  competitionId: match.competitionId,
                                  faculty1Id: match.faculty1Id,
                                  faculty2Id: match.faculty2Id,
                                  faculty1Score: match.faculty1Score,
                                  faculty2Score: match.faculty2Score,
                                  status: match.status,
                                  date: match.date,
                                  time: match.time,
                                  location: match.location,
                                  round: match.round,
                                  notes: match.notes
                                });
                                
                                // Ensure editingMatch has all required fields with fallbacks
                                const matchWithFallbacks = {
                                  ...match,
                                  date: match.date ?? new Date().toISOString().split('T')[0],
                                  time: match.time ? match.time.substring(0, 5) : '09:00', // Convert HH:MM:SS to HH:MM
                                  location: match.location ?? 'Main Field',
                                  round: match.round ?? 'Semifinal',
                                  notes: match.notes ?? ''
                                };
                                
                                console.log('Match with fallbacks:', matchWithFallbacks);
                                setEditingMatch(matchWithFallbacks);
                              }}
                              className="text-blue-600 hover:text-blue-900"
                            >
                            <Edit className="w-4 h-4" />
                          </button>
                          {canDeleteMatch() && (
                            <button
                              onClick={() => handleDeleteMatch(match.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </main>

      {/* Add/Edit Match Modal */}
      {(showAddForm || editingMatch) && (
        <div 
          className="fixed inset-0 flex items-center justify-center p-4 z-50 overflow-y-auto"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}
        >
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto my-8">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">
              {editingMatch ? 'Edit Match' : 'Add New Match'}
            </h3>
            
            <form 
              key={editingMatch?.id || 'new'}
              onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.target as HTMLFormElement);
              const competitionId = formData.get('competition') as string;
              const selectedCompetition = competitions.find(c => c.id === competitionId);
              const isArtCompetition = selectedCompetition?.type === 'art';
              
              try {
                // Handle arts competition scores separately
                if (isArtCompetition && editingMatch) {
                // Collect all faculty scores from state
                const facultyScores = faculties.map(faculty => ({
                  facultyId: faculty.id,
                  score: artsCompetitionScores[faculty.id] || 0
                }));
                
                // Save arts competition scores
                await saveArtsCompetitionScores(editingMatch.id, facultyScores);
                
                  // Update match with basic info (no scores needed for arts competitions)
                  await updateMatch(editingMatch.id, {
                    competition_id: competitionId,
                    faculty1_id: editingMatch.faculty1Id,
                    faculty2_id: editingMatch.faculty2Id,
                    // Don't update score1 and score2 for arts competitions - they're stored separately
                    status: formData.get('status') as string === 'ongoing' ? 'live' : formData.get('status') as string === 'completed' ? 'completed' : 'scheduled',
                    date: formData.get('date') as string,
                    time: formData.get('time') as string,
                    location: formData.get('location') as string,
                    round: formData.get('round') as string
                  });
                
                // Refresh matches
                const updatedMatches = await getMatches();
                const transformedMatches = updatedMatches.map((match: Record<string, any>) => ({
                  id: match.id,
                  competitionId: match.competition_id,
                  faculty1Id: match.faculty1_id,
                  faculty2Id: match.faculty2_id,
                  faculty1Score: match.score1 || 0,
                  faculty2Score: match.score2 || 0,
                  status: (match.status === 'live' ? 'ongoing' : match.status === 'completed' ? 'completed' : 'upcoming') as Match['status'],
                  date: match.date,
                  time: match.time,
                  location: match.location,
                  round: match.round || 'Regular',
                  notes: match.notes || ''
                }));
                setMatches(transformedMatches);
                setEditingMatch(null);
              } else {
                // Handle regular match saving
                handleSaveMatch({
                  competitionId: competitionId,
                  faculty1Id: formData.get('faculty1') as string,
                  faculty2Id: isArtCompetition ? formData.get('faculty1') as string : formData.get('faculty2') as string,
                  faculty1Score: editingMatch ? (
                    isArtCompetition 
                      ? (parseInt(formData.get('faculty_score_' + editingMatch.faculty1Id) as string) || 0)
                      : (parseInt(formData.get('score1') as string) || 0)
                  ) : 0,
                  faculty2Score: editingMatch ? (
                    isArtCompetition 
                      ? (parseInt(formData.get('faculty_score_' + editingMatch.faculty2Id) as string) || 0)
                      : (parseInt(formData.get('score2') as string) || 0)
                  ) : 0,
                  status: editingMatch ? (formData.get('status') as Match['status']) : 'upcoming',
                  date: formData.get('date') as string,
                  time: formData.get('time') as string,
                  location: formData.get('location') as string,
                  round: formData.get('round') as string,
                  notes: formData.get('notes') as string
                });
              }
              } catch (error) {
                console.error('Error saving match:', error);
                alert('Error saving match. Check console for details.');
              }
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Competition</label>
                  <select
                    name="competition"
                    value={selectedCompetitionId}
                    onChange={(e) => setSelectedCompetitionId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                    required
                  >
                    <option value="">Select Competition</option>
                    {competitions.map(comp => (
                      <option key={comp.id} value={comp.id}>{comp.name}</option>
                    ))}
                  </select>
                </div>

                {/* Dynamic team selection based on competition type */}
                {(() => {
                  const currentCompetitionId = editingMatch?.competitionId || selectedCompetitionId;
                  const selectedCompetition = competitions.find(c => c.id === currentCompetitionId);
                  const isArtCompetition = selectedCompetition?.type === 'art';
                  
                  if (isArtCompetition && !editingMatch) {
                    // For arts competitions when adding new match, skip team selection
                    return (
                      <div className="text-center py-4 text-gray-600">
                        <p>Arts competition - All faculties will participate</p>
                        {/* Hidden fields to maintain form structure */}
                        <input type="hidden" name="faculty1" value="550e8400-e29b-41d4-a716-446655440001" />
                        <input type="hidden" name="faculty2" value="550e8400-e29b-41d4-a716-446655440001" />
                      </div>
                    );
                  } else if (isArtCompetition && editingMatch) {
                    // For arts competitions when editing, skip team selection
                    return (
                      <div className="text-center py-4 text-gray-600">
                        <p>Arts competition - All faculties will participate</p>
                        <input type="hidden" name="faculty1" value={editingMatch.faculty1Id} />
                        <input type="hidden" name="faculty2" value={editingMatch.faculty2Id} />
                      </div>
                    );
                  } else {
                    // For sports competitions, show two teams
                    return (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Team 1</label>
                          <select
                            name="faculty1"
                            defaultValue={editingMatch?.faculty1Id}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                            required
                          >
                            <option value="">Select Faculty</option>
                            {faculties.map(faculty => (
                              <option key={faculty.id} value={faculty.id}>{faculty.short_name}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Team 2</label>
                          <select
                            name="faculty2"
                            defaultValue={editingMatch?.faculty2Id}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                            required
                          >
                            <option value="">Select Faculty</option>
                            {faculties.map(faculty => (
                              <option key={faculty.id} value={faculty.id}>{faculty.short_name}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    );
                  }
                })()}

                {/* Only show score and status fields when editing existing match */}
                {editingMatch && (
                  <>
                    {(() => {
                      const selectedCompetition = competitions.find(c => c.id === editingMatch.competitionId);
                      const isArtCompetition = selectedCompetition?.type === 'art';
                      
                      if (isArtCompetition) {
                        // For arts competitions, show 4 score fields for all faculties
                        return (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-3">Faculty Scores</label>
                            <div className="grid grid-cols-2 gap-4">
                              {faculties.map((faculty) => (
                                <div key={faculty.id}>
                                  <label className="block text-sm font-medium text-gray-600 mb-1">
                                    <div className="flex items-center space-x-2">
                                      <div className={`w-3 h-3 rounded-full ${getFacultyColorClasses(faculty.id).split(' ')[0]}`}></div>
                                      <span>{faculty.short_name}</span>
                                    </div>
                                  </label>
                                  <input
                                    type="number"
                                    name={`faculty_score_${faculty.id}`}
                                    value={artsCompetitionScores[faculty.id] || 0}
                                    onChange={(e) => {
                                      setArtsCompetitionScores(prev => ({
                                        ...prev,
                                        [faculty.id]: parseInt(e.target.value) || 0
                                      }));
                                    }}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                                    min="0"
                                    placeholder="Score"
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      } else {
                        // For sports competitions, show 2 score fields
                        return (
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Score 1</label>
                              <input
                                type="number"
                                name="score1"
                                defaultValue={editingMatch?.faculty1Score}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                                min="0"
                                placeholder={`Debug: ${editingMatch?.faculty1Score}`}
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Score 2</label>
                              <input
                                type="number"
                                name="score2"
                                defaultValue={editingMatch?.faculty2Score}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                                min="0"
                                placeholder={`Debug: ${editingMatch?.faculty2Score}`}
                              />
                            </div>
                          </div>
                        );
                      }
                    })()}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                      <select
                        name="status"
                        defaultValue={editingMatch?.status}
                        className={`w-full px-3 py-2 border rounded-md font-medium ${
                          editingMatch?.status === 'upcoming' 
                            ? 'border-blue-300 bg-blue-50 text-blue-700' 
                            : editingMatch?.status === 'ongoing' 
                            ? 'border-orange-300 bg-orange-50 text-orange-700' 
                            : 'border-green-300 bg-green-50 text-green-700'
                        }`}
                      >
                        <option value="upcoming">Upcoming</option>
                        <option value="ongoing">Ongoing</option>
                        <option value="completed">Completed</option>
                      </select>
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    name="date"
                    defaultValue={editingMatch?.date || new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                  <input
                    type="time"
                    name="time"
                    defaultValue={editingMatch?.time || '09:00'}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <input
                    type="text"
                    name="location"
                    defaultValue={editingMatch?.location || 'Main Field'}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                    placeholder="Enter match location"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Round</label>
                  <select
                    name="round"
                    defaultValue={editingMatch?.round || 'Semifinal'}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                    required
                  >
                    <option value="Qualifiers">Qualifiers</option>
                    <option value="Playoff">Playoff</option>
                    <option value="Round 1">Round 1</option>
                    <option value="Round 2">Round 2</option>
                    <option value="Round 3">Round 3</option>
                    <option value="Round 4">Round 4</option>
                    <option value="Quarterfinal">Quarterfinal</option>
                    <option value="Lower Semifinal">Lower Semifinal</option>
                    <option value="Semifinal">Semifinal</option>
                    <option value="Lower Final">Lower Final</option>
                    <option value="Upper Final">Upper Final</option>
                    <option value="3rd Place">3rd Place</option>
                    <option value="Final">Final</option>
                    <option value="Regular">Regular</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    name="notes"
                    defaultValue={editingMatch?.notes}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingMatch(null);
                  }}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  {editingMatch ? 'Update' : 'Add'} Match
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}