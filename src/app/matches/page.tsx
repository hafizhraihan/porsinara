'use client';

import { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, ArrowLeft, ChevronDown, ChevronRight, Filter, Trophy } from 'lucide-react';
import Link from 'next/link';
import { getFacultyColorClasses, getCompetitionIcon, formatTime } from '@/lib/utils';
import { 
  getCompetitions, 
  getMatches,
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
    shortName: string;
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

export default function MatchesPage() {
  const [liveMatches, setLiveMatches] = useState<Match[]>([]);
  const [competitions, setCompetitions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [artsScores, setArtsScores] = useState<{[matchId: string]: ArtsScore[]}>({});
  const [collapsedDates, setCollapsedDates] = useState<Set<string>>(new Set());
  const [selectedCompetition, setSelectedCompetition] = useState<string>('all');

  // Function to toggle collapse state for a date
  const toggleDateCollapse = (date: string) => {
    setCollapsedDates(prev => {
      const newSet = new Set(prev);
      if (newSet.has(date)) {
        newSet.delete(date);
      } else {
        newSet.add(date);
      }
      return newSet;
    });
  };

  // Function to filter matches by competition
  const getFilteredMatches = () => {
    if (selectedCompetition === 'all') {
      return liveMatches;
    }
    return liveMatches.filter(match => match.competitionId === selectedCompetition);
  };

  // Utility function to format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Fetch data from Supabase
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch all data in parallel
        const [matchesData, competitionsData] = await Promise.all([
          getMatches(),
          getCompetitions()
        ]);

        // Transform matches data and sort by date
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
             // Sort by date (ascending - earliest first)
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
              artsScoresMap[match.id] = scores;
            } catch (error) {
              console.error(`Error fetching arts scores for match ${match.id}:`, error);
              artsScoresMap[match.id] = [];
            }
          }
        }

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
    const matchesPolling = startPolling(
      getMatches,
      async (data) => {
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
             // Sort by date (ascending - earliest first)
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
        const competitionsData = await getCompetitions();
        for (const match of transformed) {
          const competition = competitionsData.find(c => c.id === match.competitionId);
          if (competition?.type === 'art' && match.status === 'completed') {
            try {
              const scores = await getArtsCompetitionScores(match.id);
              artsScoresMap[match.id] = scores;
            } catch (error) {
              console.error(`Polling: Error fetching arts scores for match ${match.id}:`, error);
              artsScoresMap[match.id] = [];
            }
          }
        }

        setLiveMatches(transformed);
        setArtsScores(artsScoresMap);
      },
      5000 // Poll every 5 seconds
    );

    // Cleanup polling on unmount
    return () => {
      stopPolling(matchesPolling);
    };
  }, []);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading matches...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/" 
            className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Calendar className="w-8 h-8 text-blue-500 mr-3" />
              <h1 className="text-3xl font-bold text-gray-900">All Matches</h1>
            </div>
            
            {/* Filter Section */}
            <div className="flex items-center space-x-4">
              <Filter className="w-5 h-5 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Filter:</span>
               <select
                 value={selectedCompetition}
                 onChange={(e) => setSelectedCompetition(e.target.value)}
                 className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900 bg-white"
               >
                <option value="all">All Competitions</option>
                {competitions.map((competition) => (
                  <option key={competition.id} value={competition.id}>
                    {competition.name}
                  </option>
                ))}
              </select>
              {selectedCompetition !== 'all' && (
                <button
                  onClick={() => setSelectedCompetition('all')}
                  className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
                >
                  Clear Filter
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Matches by Date */}
        {(() => {
          // Group filtered matches by date
          const filteredMatches = getFilteredMatches();
          const matchesByDate = filteredMatches.reduce((acc, match) => {
            const dateKey = formatDate(match.date);
            if (!acc[dateKey]) {
              acc[dateKey] = [];
            }
            acc[dateKey].push(match);
            return acc;
          }, {} as Record<string, Match[]>);

          return Object.entries(matchesByDate).map(([date, matches]) => (
            <div key={date} className="mb-8">
              {/* Date Header with Collapse Button */}
              <div className="mb-4">
                <button
                  onClick={() => toggleDateCollapse(date)}
                  className="flex items-center justify-between w-full text-left hover:bg-gray-50 rounded-lg p-3 transition-colors"
                >
                  <h2 className="text-xl font-bold text-gray-900 border-b-2 border-blue-500 pb-2 flex-1">
                    {date}
                  </h2>
                  <div className="flex items-center space-x-2 ml-4">
                    <span className="text-sm text-gray-500">
                      {matches.length} match{matches.length !== 1 ? 'es' : ''}
                    </span>
                    {collapsedDates.has(date) ? (
                      <ChevronRight className="w-5 h-5 text-gray-500 transition-transform duration-200" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-500 transition-transform duration-200" />
                    )}
                  </div>
                </button>
              </div>
              
               {/* Matches for this date - conditionally rendered with animation */}
               <div 
                 className={`overflow-hidden transition-all duration-300 ease-in-out ${
                   collapsedDates.has(date) 
                     ? 'max-h-0 opacity-0' 
                     : 'max-h-none opacity-100'
                 }`}
               >
                <div className="space-y-4">
                {matches.map((match) => (
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
                          <div className="flex items-center justify-center mb-4">
                            <div className="flex items-center space-x-8">
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
                          </div>
                        );
                      }
                    })()}

                    {/* Date, Time, Location */}
                    <div className="flex items-center justify-center text-sm text-gray-600">
                      <div className="flex items-center space-x-6">
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(match.date)}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span>{formatTime(match.time)}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <MapPin className="w-4 h-4" />
                          <span>{match.location}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                </div>
              </div>
            </div>
          ));
        })()}

        {/* No matches message */}
        {getFilteredMatches().length === 0 && (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {selectedCompetition === 'all' ? 'No matches found' : 'No matches found for selected competition'}
            </h3>
            <p className="text-gray-600">
              {selectedCompetition === 'all' 
                ? 'Check back later for upcoming matches.' 
                : 'Try selecting a different competition or clear the filter.'
              }
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
