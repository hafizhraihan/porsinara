# PORSINARA - Live Competition Report

A modern, responsive web application for live reporting of PORSINARA sports and arts competition between faculties.

## Features

### 🏆 Main Dashboard
- **Faculty Standings**: Real-time leaderboard showing current rankings
- **Live Matches**: Current ongoing and upcoming matches with live scores
- **Competition Overview**: Complete list of sports and arts competitions
- **Responsive Design**: Optimized for both desktop and mobile devices

### ⚙️ Admin Panel
- **Live Score Updates**: Real-time score management for all matches
- **Match Management**: Add, edit, and delete matches
- **Status Control**: Update match status (upcoming, ongoing, completed)
- **Quick Stats**: Overview of total matches, live matches, and completed matches

## Faculties

- **School of Computer Science** (Blue) - SOCS
- **School of Design** (Purple) - SOD  
- **BINUS Business School** (Green) - BBS
- **Faculty of Digital Communication and Hotel & Tourism** (Pink) - FDCHT

## Competitions

### Sports
- Futsal
- Basketball Putra/Putri
- Volleyball
- Badminton Putra/Putri/Mixed
- Esports (Mobile Legends)

### Arts
- Band
- Dance

## Technology Stack

- **Frontend**: Next.js 15 with TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **UI Components**: Radix UI primitives
- **Font**: Inter (Google Fonts)

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd porsinara
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
src/
├── app/
│   ├── admin/          # Admin panel page
│   ├── layout.tsx      # Root layout with navigation
│   └── page.tsx        # Main dashboard
├── components/
│   └── Navigation.tsx  # Navigation component
├── lib/
│   └── utils.ts        # Utility functions
└── types/
    └── index.ts        # TypeScript type definitions
```

## Usage

### For Viewers
1. Visit the main dashboard to see:
   - Current faculty standings
   - Live match scores
   - Competition schedules

### For Admins
1. Navigate to `/admin` to access the admin panel
2. Add new matches using the "Add Match" button
3. Update scores in real-time using the score input fields
4. Change match status (upcoming → ongoing → completed)
5. Edit or delete existing matches

## Features in Development

- [ ] Real-time updates using WebSocket
- [ ] Individual competition detail pages
- [ ] Match scheduling system
- [ ] Photo galleries
- [ ] Live commentary updates
- [ ] Mobile app integration

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support or questions, please contact the development team.