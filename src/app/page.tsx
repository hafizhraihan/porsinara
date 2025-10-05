'use client';

import { useState, useEffect } from 'react';
import { Trophy, Users, Calendar, Clock, MapPin } from 'lucide-react';
import Link from 'next/link';
import { Competition } from '@/types';
import { getFacultyColorClasses, getCompetitionIcon, formatTime } from '@/lib/utils';
import StandingsModal from '@/components/StandingsModal';
import { 
  getFaculties, 
  getCompetitions, 
  getMatches,
  getTotalMedalTally,
  getArtsCompetitionScores,
  startPolling,
  stopPolling
} from '@/lib/supabase-queries';

interface Faculty {
  id: string;
  name: string;
  short_name: string;
  color: string;
}

interface Standing {
  faculty: {
    id: string;
    name: string;
    shortName: string;
    color: string;
  };
  totalPoints: number;
  rank: number;
  gold: number;
  silver: number;
  bronze: number;
}

interface ArtsScore {
  faculty_id: string;
  score: number;
  faculty?: {
    id: string;
    name: string;
    short_name: string;
    color: string;
  };
}

interface Match {
  id: string;
  competitionId: string;
  faculty1: {
    id: string;
    name: string;
    shortName: string;
  };
  faculty2: {
    id: string;
    name: string;
    shortName: string;
  };
  score1: number;
  score2: number;
  status: string;
  date: string;
  time: string;
  location: string;
  round?: string;
  competition?: {
    id: string;
    name: string;
    icon: string;
  };
}

export default function Home() {
  const [selectedCompetition, setSelectedCompetition] = useState<Competition | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // State for data from Supabase
  const [facultyStandings, setFacultyStandings] = useState<Standing[]>([]);
  const [liveMatches, setLiveMatches] = useState<Match[]>([]);
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [loading, setLoading] = useState(true);
  const [artsScores, setArtsScores] = useState<{[matchId: string]: ArtsScore[]}>({});

  // Utility function to format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };


  const handleCompetitionClick = (competition: Competition) => {
    setSelectedCompetition(competition);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedCompetition(null);
  };

  // Fetch data from Supabase
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch all data in parallel
        const [medalTallyData, matchesData, competitionsData] = await Promise.all([
          getTotalMedalTally(),
          getMatches(),
          getCompetitions()
        ]);

        console.log('Medal tally data:', medalTallyData);

        // Transform medal tally data
        let transformedStandings;
        
        if (medalTallyData.length === 0) {
          // If no medal data, show all faculties with zero medals
          const facultiesData = await getFaculties();
          transformedStandings = facultiesData.map((faculty: Faculty, index: number) => ({
            faculty: {
              id: faculty.id,
              name: faculty.name,
              short_name: faculty.short_name,
              color: faculty.color
            },
            totalPoints: 0,
            rank: index + 1,
            gold: 0,
            silver: 0,
            bronze: 0
          }));
        } else {
          transformedStandings = medalTallyData.map((standing: Record<string, any>, index: number) => ({
            faculty: {
              id: standing.faculty_id,
              name: standing.faculty_name,
              shortName: standing.faculty_short_name,
              color: getFacultyColorClasses(standing.faculty_id).split(' ')[0].replace('bg-', '')
            },
            totalPoints: standing.total_points,
            rank: index + 1,
            gold: standing.total_gold,
            silver: standing.total_silver,
            bronze: standing.total_bronze
          }));
        }

        // Transform matches data and sort by date
        console.log('Raw matches data at', new Date().toLocaleTimeString(), ':', matchesData);
        console.log('Sample match faculty data:', matchesData[0]?.faculty1, matchesData[0]?.faculty2);
        console.log('First match faculty1 name:', matchesData[0]?.faculty1?.name);
        console.log('First match faculty1 short_name:', matchesData[0]?.faculty1?.short_name);
        console.log('First match faculty2 name:', matchesData[0]?.faculty2?.name);
        console.log('First match faculty2 short_name:', matchesData[0]?.faculty2?.short_name);
        const transformedMatches = matchesData
          .map((match: Record<string, any>) => ({
            id: match.id,
            competitionId: match.competition_id,
            faculty1: {
              id: match.faculty1_id,
              name: match.faculty1.name,
              shortName: match.faculty1.short_name
            },
            faculty2: {
              id: match.faculty2_id,
              name: match.faculty2.name,
              shortName: match.faculty2.short_name
            },
            score1: match.score1,
            score2: match.score2,
            status: (() => {
              let transformedStatus;
              if (match.status === 'live') {
                transformedStatus = 'ongoing';
              } else if (match.status === 'completed') {
                transformedStatus = 'completed';
              } else if (match.status === 'scheduled') {
                transformedStatus = 'upcoming';
              } else {
                transformedStatus = 'upcoming';
              }
              console.log(`Match ${match.id}: "${match.status}" -> "${transformedStatus}"`);
              return transformedStatus;
            })(),
            date: match.date,
            time: match.time,
            location: match.location,
            round: match.round,
            competition: {
              id: match.competition_id,
              name: match.competition?.name || 'Unknown Competition',
              icon: match.competition?.icon || 'FaFutbol'
            }
          }))
          .sort((a: Record<string, any>, b: Record<string, any>) => {
            // First sort by status: ongoing -> upcoming -> completed
            const statusOrder = { 'ongoing': 0, 'upcoming': 1, 'completed': 2 };
            const statusA = statusOrder[a.status as keyof typeof statusOrder] ?? 3;
            const statusB = statusOrder[b.status as keyof typeof statusOrder] ?? 3;
            
            if (statusA !== statusB) {
              return statusA - statusB;
            }
            
            // If same status, sort by date (ascending - earliest first)
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);
            if (dateA.getTime() !== dateB.getTime()) {
              return dateA.getTime() - dateB.getTime();
            }
            // If same date, sort by time
            return a.time.localeCompare(b.time);
          });

        // Fetch arts competition scores for completed arts competitions
        const artsScoresMap: {[matchId: string]: ArtsScore[]} = {};
        for (const match of transformedMatches) {
          const competition = competitionsData.find(c => c.id === match.competitionId);
          if (competition?.type === 'art' && match.status === 'completed') {
            try {
              const scores = await getArtsCompetitionScores(match.id);
              console.log(`Fetched arts scores for match ${match.id}:`, scores);
              artsScoresMap[match.id] = scores;
            } catch (error) {
              console.error(`Error fetching arts scores for match ${match.id}:`, error);
              artsScoresMap[match.id] = [];
            }
          }
        }
        console.log('Arts scores map:', artsScoresMap);

        setFacultyStandings(transformedStandings);
        setLiveMatches(transformedMatches);
        setCompetitions(competitionsData);
        setArtsScores(artsScoresMap);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
      }
    };

    fetchData();

    // Set up polling for live updates
    const standingsPolling = startPolling(
      getTotalMedalTally,
      async (data) => {
        let transformed;
        
        if (data.length === 0) {
          // If no medal data, show all faculties with zero medals
          const facultiesData = await getFaculties();
          transformed = facultiesData.map((faculty: Faculty, index: number) => ({
            faculty: {
              id: faculty.id,
              name: faculty.name,
              short_name: faculty.short_name,
              color: faculty.color
            },
            totalPoints: 0,
            rank: index + 1,
            gold: 0,
            silver: 0,
            bronze: 0
          }));
        } else {
          transformed = data.map((standing: Record<string, any>, index: number) => ({
            faculty: {
              id: standing.faculty_id,
              name: standing.faculty_name,
              shortName: standing.faculty_short_name,
              color: getFacultyColorClasses(standing.faculty_id).split(' ')[0].replace('bg-', '')
            },
            totalPoints: standing.total_points,
            rank: index + 1,
            gold: standing.total_gold,
            silver: standing.total_silver,
            bronze: standing.total_bronze
          }));
        }
        setFacultyStandings(transformed);
      },
      5000 // Poll every 5 seconds
    );

    const matchesPolling = startPolling(
      getMatches,
      async (data) => {
        console.log('Polling matches data:', data);
        const transformed = data
          .map((match: Record<string, any>) => ({
            id: match.id,
            competitionId: match.competition_id,
            faculty1: {
              id: match.faculty1_id,
              name: match.faculty1.name,
              shortName: match.faculty1.short_name
            },
            faculty2: {
              id: match.faculty2_id,
              name: match.faculty2.name,
              shortName: match.faculty2.short_name
            },
            score1: match.score1,
            score2: match.score2,
            status: (() => {
              let transformedStatus;
              if (match.status === 'live') {
                transformedStatus = 'ongoing';
              } else if (match.status === 'completed') {
                transformedStatus = 'completed';
              } else if (match.status === 'scheduled') {
                transformedStatus = 'upcoming';
              } else {
                transformedStatus = 'upcoming';
              }
              console.log(`Match ${match.id}: "${match.status}" -> "${transformedStatus}"`);
              return transformedStatus;
            })(),
            date: match.date,
            time: match.time,
            location: match.location,
            round: match.round,
            competition: {
              id: match.competition_id,
              name: match.competition?.name || 'Unknown Competition',
              icon: match.competition?.icon || 'FaFutbol'
            }
          }))
          .sort((a: Record<string, any>, b: Record<string, any>) => {
            // First sort by status: ongoing -> upcoming -> completed
            const statusOrder = { 'ongoing': 0, 'upcoming': 1, 'completed': 2 };
            const statusA = statusOrder[a.status as keyof typeof statusOrder] ?? 3;
            const statusB = statusOrder[b.status as keyof typeof statusOrder] ?? 3;
            
            if (statusA !== statusB) {
              return statusA - statusB;
            }
            
            // If same status, sort by date (ascending - earliest first)
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);
            if (dateA.getTime() !== dateB.getTime()) {
              return dateA.getTime() - dateB.getTime();
            }
            // If same date, sort by time
            return a.time.localeCompare(b.time);
          });

        // Fetch arts competition scores for completed arts competitions
        const artsScoresMap: {[matchId: string]: ArtsScore[]} = {};
        // Get competitions data for polling
        const competitionsData = await getCompetitions();
        for (const match of transformed) {
          const competition = competitionsData.find(c => c.id === match.competitionId);
          if (competition?.type === 'art' && match.status === 'completed') {
            try {
              const scores = await getArtsCompetitionScores(match.id);
              console.log(`Polling: Fetched arts scores for match ${match.id}:`, scores);
              artsScoresMap[match.id] = scores;
            } catch (error) {
              console.error(`Polling: Error fetching arts scores for match ${match.id}:`, error);
              artsScoresMap[match.id] = [];
            }
          }
        }
        console.log('Polling: Arts scores map:', artsScoresMap);

        setLiveMatches(transformed);
        setArtsScores(artsScoresMap);
      },
      5000 // Poll every 5 seconds
    );

    // Cleanup polling on unmount
    return () => {
      stopPolling(standingsPolling);
      stopPolling(matchesPolling);
    };
  }, []);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading PORSINARA data...</p>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Faculty Standings */}
        <section className="mb-12">
          <div className="flex items-center mb-6">
            <Trophy className="w-6 h-6 text-yellow-500 mr-2" />
            <h2 className="text-2xl font-bold text-gray-900">Medal Tally</h2>
          </div>
          
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rank
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Faculty
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      🥇 Gold
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      🥈 Silver
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      🥉 Bronze
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Medals
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Points*
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {facultyStandings.map((standing) => (
                    <tr key={standing.faculty.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                            standing.rank === 1 ? 'bg-yellow-500' :
                            standing.rank === 2 ? 'bg-gray-400' :
                            standing.rank === 3 ? 'bg-orange-600' :
                            'bg-gray-300'
                          }`}>
                            {standing.rank}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className={`w-4 h-4 rounded-full mr-3 ${getFacultyColorClasses(standing.faculty.id).split(' ')[0]}`}></div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{standing.faculty.shortName}</div>
                            <div className="text-sm text-gray-500">{standing.faculty.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="text-lg font-bold text-yellow-600">{standing.gold}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="text-lg font-bold text-gray-500">{standing.silver}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="text-lg font-bold text-orange-600">{standing.bronze}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="text-lg font-bold text-gray-900">
                          {standing.gold + standing.silver + standing.bronze}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="text-lg font-bold text-blue-600">{standing.totalPoints}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-3 bg-gray-50 border-t">
              <p className="text-xs text-gray-500">
                * Scoring System: 🥇 = 3 points, 🥈 = 2 points, 🥉 = 1 point
              </p>
            </div>
          </div>
        </section>

        {/* Matches and Competitions */}
        <section className="mb-12 relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Matches Section */}
            <div className="relative">
              <div className="flex items-center mb-6">
                <Calendar className="w-6 h-6 text-blue-500 mr-2" />
                <h2 className="text-2xl font-bold text-gray-900">Matches</h2>
              </div>
              
              <div className="grid grid-cols-1 gap-6">
            {liveMatches.slice(0, 3).map((match) => (
              <div key={match.id} className={`bg-white rounded-lg shadow-md p-6 border ${
                match.status === 'ongoing' 
                  ? 'border-red-300 border-pulse' 
                  : 'border-gray-200'
              }`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    {(() => {
                      const IconComponent = match.competition?.icon ? getCompetitionIcon(match.competition.icon) : null;
                      return IconComponent ? <IconComponent className="w-5 h-5 text-gray-600" /> : null;
                    })()}
                    <h3 className="text-lg font-semibold text-gray-900">{match.competition?.name || 'Unknown Competition'}</h3>
                    {/* Round Information */}
                    {match.round && (
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        match.round.toLowerCase().includes('final') 
                          ? 'bg-yellow-100 text-yellow-800' // Gold for Final
                          : match.round.toLowerCase().includes('3rd') || match.round.toLowerCase().includes('third')
                          ? 'bg-orange-100 text-orange-800' // Bronze for 3rd Place
                          : 'bg-blue-100 text-blue-800' // Default blue for other rounds
                      }`}>
                        {match.round}
                      </span>
                    )}
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    match.status === 'ongoing' 
                      ? 'bg-red-100 text-red-800' 
                      : match.status === 'completed'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {match.status === 'ongoing' ? 'LIVE' : match.status === 'completed' ? 'COMPLETED' : 'UPCOMING'}
                  </span>
                </div>
                
                {/* Check if this is an arts competition */}
                {(() => {
                  const competition = competitions.find(c => c.id === match.competitionId);
                  const isArtCompetition = competition?.type === 'art';
                  
                  if (isArtCompetition) {
                    if (match.status === 'ongoing') {
                      // For live arts competitions, show GIF animation
                      const isBand = match.competitionId === 'band';
                      const gifSrc = isBand ? '/guitar.gif' : '/dancing.gif';
                      const altText = isBand ? 'Band Performance' : 'Dance Performance';
                      
                      return (
                        <div className="mb-4">
                          <div className="flex items-center justify-center space-x-3">
                            <img 
                              src={gifSrc} 
                              alt={altText}
                              className="w-13 h-13 object-contain"
                            />
                            <div className="text-sm font-medium text-black">Performing...</div>
                          </div>
                        </div>
                      );
                    } else if (match.status === 'completed') {
                      // For completed arts competitions, check if scores are available
                      const scores = artsScores[match.id] || [];
                      console.log(`Display: Match ${match.id} arts scores:`, scores, 'from artsScores:', artsScores);
                      
                      if (scores.length === 0) {
                        // No scores inputted yet - judges still judging
                        return (
                          <div className="mb-4">
                            <div className="flex items-center justify-center space-x-3">
                              <img 
                                src="/judging.gif" 
                                alt="Judges Still Judging"
                                className="w-13 h-13 object-contain"
                              />
                              <div className="text-sm font-medium text-black">Judges Still Judging...</div>
                            </div>
                          </div>
                        );
                      } else {
                        // Scores available - show top 3
                        const top3 = scores
                          .sort((a, b) => b.score - a.score)
                          .slice(0, 3);
                        
                        return (
                          <div className="mb-4">
                            {/* Winner in center */}
                            <div className="flex justify-center mb-3">
                              <div className="flex items-center space-x-2 scale-110">
                                <div className={`w-4 h-4 rounded-full ${getFacultyColorClasses(top3[0].faculty_id).split(' ')[0]}`}></div>
                                <span className="text-base font-semibold text-gray-900">{top3[0].faculty?.short_name || 'Unknown'}</span>
                                <Trophy className="w-5 h-5 text-yellow-500" />
                                <span className="text-base font-bold text-gray-900">{top3[0].score}</span>
                              </div>
                            </div>
                            {/* 2nd and 3rd place below */}
                            <div className="flex items-center justify-center space-x-6">
                              {top3.slice(1).map((score, index) => (
                                <div key={score.faculty_id} className="flex items-center space-x-2">
                                  <div className={`w-3 h-3 rounded-full ${getFacultyColorClasses(score.faculty_id).split(' ')[0]}`}></div>
                                  <span className="text-sm font-medium text-gray-900">{score.faculty?.short_name || 'Unknown'}</span>
                                  {index === 0 && <Trophy className="w-4 h-4 text-gray-400" />}
                                  {index === 1 && <Trophy className="w-4 h-4 text-orange-600" />}
                                  <span className="text-sm font-bold text-gray-900">{score.score}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      }
                    } else {
                      // For upcoming arts competitions
                      return (
                        <div className="mb-4 text-center">
                          <div className="text-black mb-2">
                            <Calendar className="w-5 h-5 mx-auto mb-2" />
                            <div className="text-sm font-medium">Mark your calendar!</div>
                          </div>
                        </div>
                      );
                    }
                  } else {
                    // For sports competitions, show versus format
                    return (
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full ${getFacultyColorClasses(match.faculty1.id).split(' ')[0]}`}></div>
                          <span className="font-medium text-gray-900">{match.faculty1.shortName}</span>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-gray-900">
                            {match.score1} - {match.score2}
                          </div>
                          {match.status === 'completed' && (
                            <div className="text-xs font-semibold text-black mt-1 flex items-center justify-center space-x-1">
                              <div className={`w-3 h-3 rounded-full ${getFacultyColorClasses(match.score1 > match.score2 ? match.faculty1.id : match.faculty2.id).split(' ')[0]}`}></div>
                              <span>{match.score1 > match.score2 ? match.faculty1.shortName : match.faculty2.shortName} Wins!</span>
                            </div>
                          )}
                          {match.status === 'ongoing' && (
                            <div className="mt-2">
                              <div className="w-16 h-1 bg-gray-200 rounded-full mx-auto overflow-hidden">
                                <div className="w-4 h-1 bg-red-500 rounded-full" style={{
                                  animation: 'moveRight 2s linear infinite'
                                }}></div>
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className="font-medium text-gray-900">{match.faculty2.shortName}</span>
                          <div className={`w-3 h-3 rounded-full ${getFacultyColorClasses(match.faculty2.id).split(' ')[0]}`}></div>
                        </div>
                      </div>
                    );
                  }
                })()}

                {/* Date, Time, Location */}
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(match.date)}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>{formatTime(match.time)}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <MapPin className="w-4 h-4" />
                    <span>{match.location}</span>
                  </div>
                </div>
              </div>
            ))}
              </div>
              
              {/* Gradient overlay for limited view - Middle layer (z-20) */}
              {liveMatches.length > 3 && (
                <div 
                  key="matches-gradient-overlay"
                  className="absolute bottom-0 left-0 right-0 h-48 pointer-events-none z-20" 
                  style={{
                    background: 'linear-gradient(to top, #F2F6FA 0%, transparent 100%)'
                  }}
                ></div>
              )}
                
              {/* Show All Button */}
              {liveMatches.length > 3 && (
                <div className="flex justify-center relative z-30 -mt-8">
                  <Link
                    href="/matches"
                    className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200 shadow-lg hover:shadow-xl"
                  >
                    View All Matches ({liveMatches.length})
                  </Link>
                </div>
              )}
            </div>

            {/* Competitions Section */}
            <div>
              <div className="flex items-center mb-6">
                <Users className="w-6 h-6 text-purple-500 mr-2" />
                <h2 className="text-2xl font-bold text-gray-900">Competitions</h2>
              </div>
              
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="grid grid-cols-2 gap-4">
              {competitions.map((competition) => {
                const IconComponent = getCompetitionIcon(competition.icon);
                const isSport = competition.type === 'sport';
                return (
                  <div 
                    key={competition.id} 
                    onClick={() => handleCompetitionClick(competition)}
                    className={`relative p-4 rounded-lg text-center overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-lg border group ${
                      isSport ? 'border-blue-200' : 'border-purple-200'
                    }`}
                    style={{}}
                  >
                    {/* Background Image Zoom Effect */}
                    <div 
                      className="absolute inset-0 transition-transform duration-200 group-hover:scale-125"
                      style={{
                        backgroundImage: competition.id === 'futsal' 
                          ? `url('https://tse3.mm.bing.net/th/id/OIP.ABzqT2CFPBIN-JjXq8wXNwHaE8?rs=1&pid=ImgDetMain&o=7&rm=3')`
                          : competition.id === 'basketball-putra'
                          ? `url('https://fitpeople.com/wp-content/uploads/2019/03/man-dribbling-basketball.jpg')`
                          : competition.id === 'basketball-putri'
                          ? `url('https://wallpapers.com/images/hd/basketball-girl-shooting-hoop-outdoor-court-jpg-4dk4ayysutnxirtf.jpg')`
                          : competition.id === 'volleyball'
                          ? `url('https://stillmed.olympics.com/media/Images/OlympicOrg/News/2017/04/11/2017-04-11-Volleyball-thumbnail.jpg?interpolation=lanczos-none&resize=2120:1200')`
                          : competition.id === 'esports'
                          ? `url('https://evolveetfs.com/wp-content/uploads/2022/06/HERO_image1-scaled.jpg')`
                          : competition.id === 'badminton-putra'
                          ? `url('https://images.pexels.com/photos/8007419/pexels-photo-8007419.jpeg?cs=srgb&dl=pexels-shvets-production-8007419.jpg&fm=jpg')`
                          : competition.id === 'badminton-putri'
                          ? `url('https://img.olympics.com/images/image/private/t_16-9_640/f_auto/primary/xubxfwfgzwch91r0yfbd')`
                          : competition.id === 'badminton-mixed'
                          ? `url('https://www.thestatesman.com/wp-content/uploads/2023/01/badminton-iStock-1.jpg')`
                          : competition.id === 'band'
                          ? `url('https://thumbs.dreamstime.com/b/music-band-performing-stage-multiracial-59012401.jpg')`
                          : competition.id === 'dance'
                          ? `url('https://as2.ftcdn.net/v2/jpg/04/75/71/17/1000_F_475711769_KbwhdvzU0DP9FDVNui47wDJvOb9GRKe2.jpg')`
                          : `url('/${competition.id}.jpg')`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat'
                      }}
                    ></div>
                    
                    {/* Colored Overlay */}
                    <div 
                      className="absolute inset-0"
                      style={{
                        backgroundColor: isSport 
                          ? 'rgba(37, 99, 235, 0.8)' // blue-600 with 80% opacity
                          : 'rgba(147, 51, 234, 0.8)' // purple-600 with 80% opacity
                      }}
                    ></div>
                    
                    {/* Content */}
                    <div className="relative z-10">
                      <div className="flex justify-center mb-3">
                        <IconComponent className="w-8 h-8 text-white" />
                      </div>
                      <div className="font-medium text-sm text-white">
                        {competition.name}
                      </div>
                    </div>
                  </div>
                );
              })}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative mt-16">
        <div 
          className="bg-cover bg-center bg-no-repeat py-12"
          style={{
            backgroundImage: "url('/binus.jpeg')"
          }}
        >
          <div className="absolute inset-0" style={{ backgroundColor: 'rgba(255, 255, 255, 0.8)' }}></div>
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              {/* Logo and Title */}
              <div className="flex items-center justify-center space-x-3 mb-6">
                <img 
                  src="https://student.binus.ac.id/malang/wp-content/uploads/sites/3/2022/08/logo-student.png" 
                  alt="BINUS University Logo" 
                  width={200}
                  height={100}
                  className="object-contain"
                  style={{ color: 'transparent' }}
                  suppressHydrationWarning
                />
                <span className="text-gray-400 mt-4 text-3xl">|</span>
                <span className="text-xl font-bold text-gray-900 mt-7">PORSINARA</span>
              </div>
              
              {/* Social Media Links */}
              <div className="flex justify-center space-x-6 mb-6">
                <a 
                  href="https://instagram.com/sdc_binusmlg" 
            target="_blank"
            rel="noopener noreferrer"
                  className="text-gray-600 hover:text-pink-600 transition-colors"
                  title="Follow us on Instagram"
          >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
          </a>
        <a
                  href="https://www.youtube.com/@sdcbinusmalang" 
          target="_blank"
          rel="noopener noreferrer"
                  className="text-gray-600 hover:text-red-600 transition-colors"
                  title="Subscribe to our YouTube channel"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
        </a>
        <a
                  href="https://student.binus.ac.id/malang" 
          target="_blank"
          rel="noopener noreferrer"
                  className="text-gray-600 hover:text-blue-600 transition-colors"
                  title="Visit our website"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                  </svg>
        </a>
        <a
                  href="https://student.binus.ac.id/malang/student-center/porsinara/" 
          target="_blank"
          rel="noopener noreferrer"
                  className="text-gray-600 hover:text-green-600 transition-colors"
                  title="About PORSINARA"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
                  </svg>
                </a>
              </div>
              
              {/* Copyright */}
              <div className="border-t border-gray-600 pt-6">
                <p className="text-gray-600 text-sm">
                  © {new Date().getFullYear()} PORSINARA. All rights reserved.
                </p>
                <p className="text-gray-500 text-xs mt-1">
                  Student Development Center, BINUS University, Malang
                </p>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Standings Modal */}
      {selectedCompetition && (
        <StandingsModal
          competition={selectedCompetition}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}