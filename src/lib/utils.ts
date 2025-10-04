import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { 
  FaFutbol, FaBasketballBall, FaVolleyballBall, FaTableTennis, FaGamepad, FaMusic, FaTheaterMasks, FaGuitar
} from "react-icons/fa"
import { 
  GiShuttlecock
} from "react-icons/gi"
import { type IconType } from "react-icons"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getFacultyColor(facultyId: string): string {
  const colorMap: Record<string, string> = {
    '550e8400-e29b-41d4-a716-446655440001': 'blue', // SOCS
    '550e8400-e29b-41d4-a716-446655440002': 'purple', // SOD
    '550e8400-e29b-41d4-a716-446655440003': 'green', // BBS
    '550e8400-e29b-41d4-a716-446655440004': 'pink' // FDCHT
  }
  return colorMap[facultyId] || 'gray'
}

export function getFacultyColorClasses(facultyId: string): string {
  const colorMap: Record<string, string> = {
    '550e8400-e29b-41d4-a716-446655440001': 'bg-blue-500 text-white border-blue-500', // SOCS
    '550e8400-e29b-41d4-a716-446655440002': 'bg-purple-500 text-white border-purple-500', // SOD
    '550e8400-e29b-41d4-a716-446655440003': 'bg-green-500 text-white border-green-500', // BBS
    '550e8400-e29b-41d4-a716-446655440004': 'bg-pink-500 text-white border-pink-500' // FDCHT
  }
  return colorMap[facultyId] || 'bg-gray-500 text-white border-gray-500'
}

export function getFacultyLightColorClasses(facultyId: string): string {
  const colorMap: Record<string, string> = {
    '550e8400-e29b-41d4-a716-446655440001': 'bg-blue-50 text-blue-700 border-blue-200', // SOCS
    '550e8400-e29b-41d4-a716-446655440002': 'bg-purple-50 text-purple-700 border-purple-200', // SOD
    '550e8400-e29b-41d4-a716-446655440003': 'bg-green-50 text-green-700 border-green-200', // BBS
    '550e8400-e29b-41d4-a716-446655440004': 'bg-pink-50 text-pink-700 border-pink-200' // FDCHT
  }
  return colorMap[facultyId] || 'bg-gray-50 text-gray-700 border-gray-200'
}

export function getCompetitionIcon(iconName: string): IconType {
  const iconMap: Record<string, IconType> = {
    FaFutbol,
    FaBasketballBall,
    FaVolleyballBall,
    FaTableTennis,
    GiShuttlecock,
    FaGamepad,
    FaMusic,
    FaTheaterMasks,
    FaGuitar
  }
  return iconMap[iconName] || FaFutbol
}

export function formatTime(timeString: string): string {
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
}
