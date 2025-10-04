'use client';

import { useState, useEffect } from 'react';
import { X, Trophy, Calendar, Clock, MapPin, RefreshCw } from 'lucide-react';
import { Competition, Faculty } from '@/types';
import { getFacultyColorClasses, getCompetitionIcon } from '@/lib/utils';
import { getMatchesByCompetition, getTableStandings, getArtsCompetitionScores, testSupabaseConnection } from '@/lib/supabase-queries';

interface StandingsModalProps {
  competition: Competition;
  isOpen: boolean;
  onClose: () => void;
}

interface Match {
  id: string;
  faculty1: Faculty;
  faculty2: Faculty;
  score1: number;
  score2: number;
  status: 'upcoming' | 'ongoing' | 'completed';
  date: string;
  time: string;
  location: string;
  round: string;
}

interface TableStanding {
  faculty: Faculty;
  points: number;
  rank: number;
}

export default function StandingsModal({ competition, isOpen, onClose }: StandingsModalProps) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [tableStandings, setTableStandings] = useState<TableStanding[]>([]);
  const [artsScores, setArtsScores] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Utility function to format time
  const formatTime = (timeString: string) => {
    // If timeString already contains WIB, return as is
    if (timeString.includes('WIB')) {
      return timeString;
    }
    
    // Format time to HH:MM format and add WIB
    const time = new Date(`2000-01-01T${timeString}`);
    return time.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }) + ' WIB';
  };

  // Fetch real data from Supabase
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Test connection first
        await testSupabaseConnection();
        
        if (competition.format === 'elimination') {
          // Fetch elimination bracket matches
          const matchesData = await getMatchesByCompetition(competition.id);
          const transformedMatches = matchesData.map((match: any) => ({
            id: match.id,
            faculty1: {
              id: match.faculty1.id,
              name: match.faculty1.name,
              color: match.faculty1.color,
              shortName: match.faculty1.short_name
            },
            faculty2: {
              id: match.faculty2.id,
              name: match.faculty2.name,
              color: match.faculty2.color,
              shortName: match.faculty2.short_name
            },
            score1: match.score1 || 0,
            score2: match.score2 || 0,
            status: (match.status === 'live' ? 'ongoing' : match.status === 'completed' ? 'completed' : 'upcoming') as Match['status'],
            date: match.date,
            time: match.time,
            location: match.location,
            round: match.round || 'Regular'
          }));
          setMatches(transformedMatches);
        } else {
          // Check if it's an arts competition
          if (competition.type === 'art') {
            // For arts competitions, fetch individual faculty scores from matches
            const matchesData = await getMatchesByCompetition(competition.id);
            const transformedMatches = matchesData.map((match: any) => ({
              id: match.id,
              faculty1: {
                id: match.faculty1.id,
                name: match.faculty1.name,
                color: match.faculty1.color,
                shortName: match.faculty1.short_name
              },
              faculty2: {
                id: match.faculty2.id,
                name: match.faculty2.name,
                color: match.faculty2.color,
                shortName: match.faculty2.short_name
              },
              score1: match.score1 || 0,
              score2: match.score2 || 0,
              status: (match.status === 'live' ? 'ongoing' : match.status === 'completed' ? 'completed' : 'upcoming') as Match['status'],
              date: match.date,
              time: match.time,
              location: match.location,
              round: match.round || 'Regular'
            }));
            setMatches(transformedMatches);
            
            if (matchesData.length > 0) {
              // Get scores from the most recent match
              const latestMatch = matchesData[0];
              const scoresData = await getArtsCompetitionScores(latestMatch.id);
              setArtsScores(scoresData);
            } else {
              setArtsScores([]);
            }
          } else {
            // Fetch table standings for non-arts competitions
            const standingsData = await getTableStandings(competition.id);
            const transformedStandings = standingsData.map((standing: any) => ({
              faculty: {
                id: standing.faculty_id,
                name: standing.faculty.name,
                color: standing.faculty.color,
                shortName: standing.faculty.short_name
              },
              points: standing.points,
              rank: standing.rank
            }));
            setTableStandings(transformedStandings);
          }
        }
      } catch (error) {
        console.error('Error fetching modal data:', error);
        // Fallback to empty arrays if fetch fails
        setMatches([]);
        setTableStandings([]);
        setArtsScores([]);
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      fetchData();
    }
  }, [competition, isOpen, refreshKey]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const IconComponent = getCompetitionIcon(competition.icon);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 transition-opacity"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}
          onClick={onClose}
        />
        
        {/* Modal */}
        <div className="relative bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className={`flex items-center justify-between p-6 ${
            competition.type === 'sport' 
              ? 'bg-gradient-to-r from-blue-50 to-blue-100 border-b border-blue-200' 
              : 'bg-gradient-to-r from-purple-50 to-purple-100 border-b border-purple-200'
          }`}>
            <div className="flex items-center space-x-3">
              {IconComponent && (
                <IconComponent className={`w-8 h-8 ${
                  competition.type === 'sport' ? 'text-blue-600' : 'text-purple-600'
                }`} />
              )}
              <div>
                <h2 className={`text-2xl font-bold ${
                  competition.type === 'sport' ? 'text-blue-900' : 'text-purple-900'
                }`}>
                  {competition.name}
                </h2>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setRefreshKey(prev => prev + 1)}
                className="p-2 hover:bg-white hover:bg-opacity-50 rounded-full transition-colors"
                title="Refresh data"
              >
                <RefreshCw className="w-5 h-5 text-gray-600" />
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white hover:bg-opacity-50 rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-gray-600" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">Loading...</span>
              </div>
            ) : competition.format === 'elimination' ? (
              /* Elimination Bracket */
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Tournament Bracket</h3>
                
        {matches.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No matches found for this competition.</p>
          </div>
        ) : (
          <>
            {/* Other Rounds (before Semifinals) */}
            {(() => {
              const otherRounds = matches.filter(match => 
                match.round !== 'Semifinal' && 
                match.round !== '3rd Place' && 
                match.round !== 'Final' &&
                match.round !== 'Regular'
              );
              
              if (otherRounds.length > 0) {
                // Group matches by round
                const roundsMap = otherRounds.reduce((acc, match) => {
                  const round = match.round || 'Other';
                  if (!acc[round]) acc[round] = [];
                  acc[round].push(match);
                  return acc;
                }, {} as {[key: string]: any[]});
                
                return Object.entries(roundsMap).map(([roundName, roundMatches]) => (
                  <div key={roundName} className="space-y-4">
                    <h4 className="text-md font-medium text-gray-700">{roundName}</h4>
                    {roundMatches.map((match) => (
                      <div key={match.id} className="bg-gray-50 rounded-lg p-4 border">
                        <div className="mb-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            match.status === 'completed' 
                              ? 'bg-green-100 text-green-800' 
                              : match.status === 'ongoing'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {match.status === 'completed' ? 'COMPLETED' : match.status === 'ongoing' ? 'LIVE' : 'UPCOMING'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            <div className={`w-3 h-3 rounded-full ${getFacultyColorClasses(match.faculty1.id).split(' ')[0]}`}></div>
                            <span className="font-medium text-gray-900">{match.faculty1.shortName}</span>
                          </div>
                          <div className="text-center">
                            <div className="text-xl font-bold text-gray-900">
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
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-gray-900">{match.faculty2.shortName}</span>
                            <div className={`w-3 h-3 rounded-full ${getFacultyColorClasses(match.faculty2.id).split(' ')[0]}`}></div>
                          </div>
                        </div>
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
                ));
              }
              return null;
            })()}

            {/* Semifinals */}
            {matches.filter(match => match.round === 'Semifinal').length > 0 && (
              <div className="space-y-4">
                <h4 className="text-md font-medium text-gray-700">Semifinals</h4>
                {matches.filter(match => match.round === 'Semifinal').map((match) => (
                      <div key={match.id} className="bg-gray-50 rounded-lg p-4 border">
                        <div className="mb-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            match.status === 'completed' 
                              ? 'bg-green-100 text-green-800' 
                              : match.status === 'ongoing'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {match.status === 'completed' ? 'COMPLETED' : match.status === 'ongoing' ? 'LIVE' : 'UPCOMING'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            <div className={`w-3 h-3 rounded-full ${getFacultyColorClasses(match.faculty1.id).split(' ')[0]}`}></div>
                            <span className="font-medium text-gray-900">{match.faculty1.shortName}</span>
                          </div>
                        <div className="text-center">
                          <div className="text-xl font-bold text-gray-900">
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
                              <div className="w-16 h-1 bg-gradient-to-r from-red-500 to-red-300 rounded-full mx-auto animate-pulse"></div>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-gray-900">{match.faculty2.shortName}</span>
                          <div className={`w-3 h-3 rounded-full ${getFacultyColorClasses(match.faculty2.id).split(' ')[0]}`}></div>
                        </div>
                      </div>
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
            )}

                {/* 3rd Place Match */}
                <div className="space-y-4">
                  <h4 className="text-md font-medium text-gray-700">3rd Place</h4>
                  {matches.filter(match => match.round === '3rd Place').map((match) => (
                    <div key={match.id} className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
                      <div className="mb-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          match.status === 'completed' 
                            ? 'bg-green-100 text-green-800' 
                            : match.status === 'ongoing'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {match.status === 'completed' ? 'COMPLETED' : match.status === 'ongoing' ? 'LIVE' : 'UPCOMING'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <div className={`w-3 h-3 rounded-full ${getFacultyColorClasses(match.faculty1.id).split(' ')[0]}`}></div>
                          <span className="font-medium text-gray-900">{match.faculty1.shortName}</span>
                        </div>
                        <div className="text-center">
                          <div className="text-xl font-bold text-gray-900">
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
                              <div className="w-16 h-1 bg-gradient-to-r from-red-500 to-red-300 rounded-full mx-auto animate-pulse"></div>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-gray-900">{match.faculty2.shortName}</span>
                          <div className={`w-3 h-3 rounded-full ${getFacultyColorClasses(match.faculty2.id).split(' ')[0]}`}></div>
                        </div>
                      </div>
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

                {/* Final */}
                <div className="space-y-4">
                  <h4 className="text-md font-medium text-gray-700">Final</h4>
                  {matches.filter(match => match.round === 'Final').map((match) => (
                    <div key={match.id} className="bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-lg p-4 border border-yellow-200">
                      <div className="mb-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          match.status === 'completed' 
                            ? 'bg-green-100 text-green-800' 
                            : match.status === 'ongoing'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {match.status === 'completed' ? 'COMPLETED' : match.status === 'ongoing' ? 'LIVE' : 'UPCOMING'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <div className={`w-3 h-3 rounded-full ${getFacultyColorClasses(match.faculty1.id).split(' ')[0]}`}></div>
                          <span className="font-medium text-gray-900">{match.faculty1.shortName}</span>
                        </div>
                        <div className="text-center">
                          <div className="text-xl font-bold text-gray-900">
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
                              <div className="w-16 h-1 bg-gradient-to-r from-red-500 to-red-300 rounded-full mx-auto animate-pulse"></div>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-gray-900">{match.faculty2.shortName}</span>
                          <div className={`w-3 h-3 rounded-full ${getFacultyColorClasses(match.faculty2.id).split(' ')[0]}`}></div>
                        </div>
                      </div>
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
                  </>
                )}
              </div>
            ) : (
              /* Table Standing or Arts Competition Scores */
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {competition.type === 'art' ? 'Performance Scores' : 'Standings'}
                </h3>
                
                {competition.type === 'art' ? (
                  /* Arts Competition Scores */
                  artsScores.length === 0 || (matches.length > 0 && matches[0].status !== 'completed') ? (
                    <div className="text-center py-8">
                      {(() => {
                        // Check if there are any matches for this competition
                        if (matches.length === 0) {
                          return (
                            <div>
                              <p className="text-gray-500 mb-2">Competition not yet started</p>
                              <p className="text-sm text-gray-400">No matches have been scheduled for this competition.</p>
                            </div>
                          );
                        }
                        
                        // Check the status of the latest match
                        const latestMatch = matches[0];
                        if (latestMatch.status === 'upcoming') {
                          return (
                            <div>
                              <p className="text-gray-500 mb-2">Competition not yet started</p>
                              <p className="text-sm text-gray-400">The competition is scheduled but hasn't begun yet.</p>
                            </div>
                          );
                        } else if (latestMatch.status === 'ongoing') {
                          const isBand = competition.id === 'band';
                          const gifSrc = isBand ? '/guitar.gif' : '/dancing.gif';
                          const altText = isBand ? 'Band Performance' : 'Dance Performance';
                          
                          return (
                            <div className="text-center">
                              <img 
                                src={gifSrc} 
                                alt={altText}
                                className="w-16 h-16 mx-auto mb-4 object-contain"
                              />
                              <p className="text-blue-500 mb-2">Competition ongoing</p>
                              <p className="text-sm text-gray-400">Performances are currently in progress. Scores will be available after judging.</p>
                            </div>
                          );
                        } else if (latestMatch.status === 'completed') {
                          return (
                            <div>
                              <p className="text-orange-500 mb-2">Judging in progress</p>
                              <p className="text-sm text-gray-400">Competition completed. Judges are still evaluating performances.</p>
                            </div>
                          );
                        } else {
                          return (
                            <div>
                              <p className="text-gray-500 mb-2">No scores available</p>
                              <p className="text-sm text-gray-400">Scores have not been inputted yet.</p>
                            </div>
                          );
                        }
                      })()}
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Faculty</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {artsScores
                            .sort((a, b) => b.score - a.score) // Sort by score descending
                            .map((score, index) => (
                            <tr key={score.faculty_id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  {index + 1 <= 3 ? (
                                    <Trophy className={`w-5 h-5 mr-2 ${
                                      index + 1 === 1 ? 'text-yellow-500' :
                                      index + 1 === 2 ? 'text-gray-400' :
                                      'text-orange-600'
                                    }`} />
                                  ) : (
                                    <span className="w-5 h-5 mr-2 flex items-center justify-center text-sm font-medium text-gray-500">
                                      {index + 1}
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center space-x-3">
                                  <div className={`w-3 h-3 rounded-full ${getFacultyColorClasses(score.faculty_id).split(' ')[0]}`}></div>
                                  <span className="text-sm font-medium text-gray-900">{score.faculty.short_name}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-center">
                                <span className="text-lg font-bold text-gray-900">{score.score}</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )
                ) : (
                  /* Regular Table Standings */
                  tableStandings.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500">No standings available for this competition.</p>
                    </div>
                  ) : (
                  <>
                    <div className="overflow-x-auto">
                  <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Faculty</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Points</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {tableStandings.map((standing) => (
                        <tr key={standing.faculty.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              {standing.rank <= 3 ? (
                                <Trophy className={`w-5 h-5 mr-2 ${
                                  standing.rank === 1 ? 'text-yellow-500' :
                                  standing.rank === 2 ? 'text-gray-400' :
                                  'text-orange-600'
                                }`} />
                              ) : (
                                <span className="w-5 h-5 mr-2 flex items-center justify-center text-sm font-medium text-gray-500">
                                  {standing.rank}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-3">
                              <div className={`w-3 h-3 rounded-full ${getFacultyColorClasses(standing.faculty.id).split(' ')[0]}`}></div>
                              <span className="text-sm font-medium text-gray-900">{standing.faculty.shortName}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className="text-lg font-bold text-gray-900">{standing.points}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-purple-900 mb-2">Scoring System</h4>
                      <p className="text-sm text-purple-800">
                        Points awarded based on performance evaluation and judging criteria
                      </p>
                    </div>
                  </>
                  )
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
