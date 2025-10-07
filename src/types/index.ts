export interface Faculty {
  id: string;
  name: string;
  color: string;
  shortName: string;
}

export interface Competition {
  id: string;
  name: string;
  type: 'sport' | 'art';
  category: 'individual' | 'team' | 'mixed';
  maxParticipants?: number;
  icon: string;
  format: 'elimination' | 'table';
}

export interface Match {
  id: string;
  competitionId: string;
  faculty1Id: string;
  faculty2Id: string;
  faculty1Score: number;
  faculty2Score: number;
  status: 'upcoming' | 'ongoing' | 'completed';
  scheduledTime?: Date;
  completedAt?: Date;
  notes?: string;
  date?: string;
  time?: string;
  location?: string;
  round?: string;
  youtubeStreamLink?: string;
}

export interface Score {
  facultyId: string;
  competitionId: string;
  points: number;
  wins: number;
  losses: number;
  draws: number;
}

export interface FacultyStanding {
  faculty: Faculty;
  totalPoints: number;
  competitions: Score[];
  rank: number;
  gold: number;
  silver: number;
  bronze: number;
}

export const FACULTIES: Faculty[] = [
  {
    id: 'socs',
    name: 'School of Computer Science',
    color: 'blue',
    shortName: 'SOCS'
  },
  {
    id: 'sod',
    name: 'School of Design',
    color: 'purple',
    shortName: 'SOD'
  },
  {
    id: 'bbs',
    name: 'BINUS Business School',
    color: 'green',
    shortName: 'BBS'
  },
  {
    id: 'fdcht',
    name: 'Faculty of Digital Communication and Hotel & Tourism',
    color: 'pink',
    shortName: 'FDCHT'
  }
];

export const COMPETITIONS: Competition[] = [
  // Sports - Elimination Bracket Format
  { id: 'futsal', name: 'Futsal', type: 'sport', category: 'team', maxParticipants: 2, icon: 'FaFutbol', format: 'elimination' },
  { id: 'basketball-putra', name: 'Basketball Putra', type: 'sport', category: 'team', maxParticipants: 2, icon: 'FaBasketballBall', format: 'elimination' },
  { id: 'basketball-putri', name: 'Basketball Putri', type: 'sport', category: 'team', maxParticipants: 2, icon: 'FaBasketballBall', format: 'elimination' },
  { id: 'volleyball', name: 'Volleyball', type: 'sport', category: 'team', maxParticipants: 2, icon: 'FaVolleyballBall', format: 'elimination' },
  { id: 'badminton-putra', name: 'Badminton Putra', type: 'sport', category: 'individual', icon: 'GiShuttlecock', format: 'elimination' },
  { id: 'badminton-putri', name: 'Badminton Putri', type: 'sport', category: 'individual', icon: 'GiShuttlecock', format: 'elimination' },
  { id: 'badminton-mixed', name: 'Badminton Mixed', type: 'sport', category: 'mixed', icon: 'GiShuttlecock', format: 'elimination' },
  { id: 'esports', name: 'Esports (Mobile Legends)', type: 'sport', category: 'team', maxParticipants: 2, icon: 'FaGamepad', format: 'elimination' },
  
  // Arts - Table Standing Format
  { id: 'band', name: 'Band', type: 'art', category: 'team', icon: 'FaGuitar', format: 'table' },
  { id: 'dance', name: 'Dance', type: 'art', category: 'team', icon: 'FaTheaterMasks', format: 'table' }
];
