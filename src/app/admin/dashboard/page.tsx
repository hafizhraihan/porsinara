'use client';

import { useState, useEffect } from 'react';
import { Save, Plus, Edit, Trash2, Trophy, Users, RotateCcw, RefreshCw, Shield, Download, ChevronDown, FileText } from 'lucide-react';
import jsPDF from 'jspdf';
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

  const generatePDFModule = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPosition = 20;

    // Helper function to add text with word wrapping
    const addText = (text: string, fontSize: number = 12, isBold: boolean = false, color: string = '#000000') => {
      doc.setFontSize(fontSize);
      doc.setFont('helvetica', isBold ? 'bold' : 'normal');
      doc.setTextColor(color);
      
      const lines = doc.splitTextToSize(text, pageWidth - 40);
      doc.text(lines, 20, yPosition);
      yPosition += lines.length * (fontSize * 0.4) + 5;
      
      // Check if we need a new page
      if (yPosition > pageHeight - 20) {
        doc.addPage();
        yPosition = 20;
      }
    };

    // Helper function to add a new page
    const addNewPage = () => {
      doc.addPage();
      yPosition = 20;
    };

    // Cover Page
    doc.setFillColor(0, 102, 204); // Blue background
    doc.rect(0, 0, pageWidth, pageHeight, 'F');
    
    doc.setTextColor(255, 255, 255); // White text
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('PANDUAN ADMIN', pageWidth / 2, pageHeight / 2 - 20, { align: 'center' });
    
    doc.setFontSize(18);
    doc.text('SISTEM PORSINARA', pageWidth / 2, pageHeight / 2, { align: 'center' });
    
    doc.setFontSize(14);
    doc.text('BINUS University Malang', pageWidth / 2, pageHeight / 2 + 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.text(`Dibuat untuk Super User - ${new Date().toLocaleDateString('id-ID')}`, pageWidth / 2, pageHeight / 2 + 40, { align: 'center' });

    // Daftar Isi
    addNewPage();
    doc.setTextColor(0, 0, 0);
    addText('DAFTAR ISI', 18, true, '#0066CC');
    yPosition += 10;
    
    const tocItems = [
      '1. Pengantar',
      '2. Daftar Link Penting',
      '3. Hierarki Admin',
      '4. Daftar Username dan Password Admin',
      '5. Contoh Penggunaan Multi-User',
      '6. Troubleshooting',
      '7. Jenis Kompetisi',
      '8. Menambah Pertandingan',
      '9. Mengelola Status Pertandingan',
      '10. Update Skor',
      '11. Menyelesaikan Pertandingan',
      '12. Sistem Penilaian Band/Dance',
      '13. Perhitungan Medali',
      '14. Sinkronisasi Medali',
      '15. Menghapus Pertandingan',
      '16. Reset Medali',
      '17. Input Skor Kompetisi Tabel',
      '18. Sorting Data',
      '19. Export Data',
      '20. Pembatasan Sistem'
    ];
    
    tocItems.forEach(item => {
      addText(item, 12, false, '#333333');
    });

    // 1. Pengantar
    addNewPage();
    addText('1. PENGANTAR', 18, true, '#0066CC');
    yPosition += 10;
    addText('Selamat datang di sistem PORSINARA! Panduan ini dibuat khusus untuk Super User dalam mengelola sistem kompetisi olahraga dan seni di BINUS University Malang.', 12);
    addText('Sistem ini memungkinkan admin untuk mengelola pertandingan secara real-time, mulai dari penambahan pertandingan, update skor, hingga perhitungan medali otomatis.', 12);
    addText('Pastikan untuk membaca panduan ini dengan seksama sebelum menggunakan sistem.', 12);

    // 2. Daftar Link Penting
    addNewPage();
    addText('2. DAFTAR LINK PENTING', 18, true, '#0066CC');
    yPosition += 10;
    addText('Berikut adalah link-link penting yang perlu diketahui:', 12, true);
    addText('• Website Utama: https://porsinara.netlify.app', 12);
    addText('• Login Admin: https://porsinara.netlify.app/admin/login', 12);
    addText('• Dashboard Admin: https://porsinara.netlify.app/admin/dashboard', 12);
    addText('• Halaman Pertandingan: https://porsinara.netlify.app/matches', 12);
    addText('', 12);
    addText('Simpan link-link ini untuk akses cepat ke sistem.', 12);

    // 3. Hierarki Admin
    addNewPage();
    addText('3. HIERARKI ADMIN', 18, true, '#0066CC');
    yPosition += 10;
    addText('Sistem memiliki 3 level admin dengan hak akses yang berbeda:', 12, true);
    yPosition += 5;
    addText('SUP (Super User):', 14, true, '#FF6B35');
    addText('• Akses penuh ke semua fitur', 12);
    addText('• Dapat menambah, mengedit, menghapus pertandingan', 12);
    addText('• Dapat sinkronisasi dan reset medali', 12);
    addText('• Dapat export data', 12);
    yPosition += 5;
    addText('SPV (Supervisor):', 14, true, '#FF6B35');
    addText('• Akses terbatas sesuai kompetisi yang ditugaskan', 12);
    addText('• Dapat menambah, mengedit, menghapus pertandingan untuk kompetisi tertentu', 12);
    addText('• Dapat sinkronisasi medali', 12);
    addText('• Tidak dapat reset medali', 12);
    yPosition += 5;
    addText('STF (Staff):', 14, true, '#FF6B35');
    addText('• Akses terbatas sesuai kompetisi yang ditugaskan', 12);
    addText('• Dapat mengedit pertandingan untuk kompetisi tertentu', 12);
    addText('• Tidak dapat menambah atau menghapus pertandingan', 12);
    addText('• Tidak dapat sinkronisasi atau reset medali', 12);

    // 4. Daftar Username dan Password
    addNewPage();
    addText('4. DAFTAR USERNAME DAN PASSWORD ADMIN', 18, true, '#0066CC');
    yPosition += 10;
    addText('CATATAN PENTING: Informasi login ini hanya boleh dibagikan kepada 1 orang per akun untuk keamanan sistem.', 12, true, '#FF0000');
    yPosition += 10;
    
    // Basketball
    addText('BASKETBALL:', 14, true, '#FF6B35');
    addText('• basket1 / basket567', 12);
    addText('• basket2 / basket678', 12);
    addText('• basket3 / basket789', 12);
    addText('• basketspv1 / basketspv567', 12);
    addText('• basketspv2 / basketspv678', 12);
    addText('• basketspv3 / basketspv789', 12);
    yPosition += 5;
    
    // Badminton
    addText('BADMINTON:', 14, true, '#FF6B35');
    addText('• badmin1 / badmin567', 12);
    addText('• badmin2 / badmin678', 12);
    addText('• badmin3 / badmin789', 12);
    addText('• badminspv1 / badminspv567', 12);
    addText('• badminspv2 / badminspv678', 12);
    addText('• badminspv3 / badminspv789', 12);
    yPosition += 5;
    
    // Band
    addText('BAND:', 14, true, '#FF6B35');
    addText('• band1 / band567', 12);
    addText('• band2 / band678', 12);
    addText('• band3 / band789', 12);
    addText('• bandspv1 / bandspv567', 12);
    addText('• bandspv2 / bandspv678', 12);
    addText('• bandspv3 / bandspv789', 12);
    yPosition += 5;
    
    // Dance
    addText('DANCE:', 14, true, '#FF6B35');
    addText('• dance1 / dance567', 12);
    addText('• dance2 / dance678', 12);
    addText('• dance3 / dance789', 12);
    addText('• dancespv1 / dancespv567', 12);
    addText('• dancespv2 / dancespv678', 12);
    addText('• dancespv3 / dancespv789', 12);
    yPosition += 5;
    
    // Esports
    addText('ESPORTS:', 14, true, '#FF6B35');
    addText('• esports1 / esports567', 12);
    addText('• esports2 / esports678', 12);
    addText('• esports3 / esports789', 12);
    addText('• esportsspv1 / esportsspv567', 12);
    addText('• esportsspv2 / esportsspv678', 12);
    addText('• esportsspv3 / esportsspv789', 12);
    yPosition += 5;
    
    // Futsal
    addText('FUTSAL:', 14, true, '#FF6B35');
    addText('• futsal1 / futsal567', 12);
    addText('• futsal2 / futsal678', 12);
    addText('• futsal3 / futsal789', 12);
    addText('• futsalspv1 / futsalspv567', 12);
    addText('• futsalspv2 / futsalspv678', 12);
    addText('• futsalspv3 / futsalspv789', 12);
    yPosition += 5;
    
    // Volleyball
    addText('VOLLEYBALL:', 14, true, '#FF6B35');
    addText('• volley1 / volley567', 12);
    addText('• volley2 / volley678', 12);
    addText('• volley3 / volley789', 12);
    addText('• volleyspv1 / volleyspv567', 12);
    addText('• volleyspv2 / volleyspv678', 12);
    addText('• volleyspv3 / volleyspv789', 12);
    yPosition += 5;
    
    // Super User
    addText('SUPER USER:', 14, true, '#FF6B35');
    addText('• sdc1 / sdc567', 12);
    addText('• sdc2 / sdc678', 12);
    addText('• sdc3 / sdc789', 12);

    // 5. Contoh Penggunaan Multi-User
    addNewPage();
    addText('5. CONTOH PENGGUNAAN MULTI-USER', 18, true, '#0066CC');
    yPosition += 10;
    addText('Contoh: Jika badminton putra, putri, dan ganda campuran bermain bersamaan, 3 admin dapat login secara bersamaan dan mengupdate skor masing-masing.', 12);
    addText('Sistem mendukung multiple admin login untuk kompetisi yang berbeda atau round yang berbeda dalam kompetisi yang sama.', 12);
    addText('Pastikan setiap admin hanya mengelola kompetisi yang menjadi tanggung jawabnya.', 12);

    // 6. Troubleshooting
    addNewPage();
    addText('6. TROUBLESHOOTING', 18, true, '#0066CC');
    yPosition += 10;
    addText('Jika setelah login layar menjadi gelap:', 12, true);
    addText('• Refresh halaman (F5 atau Ctrl+R)', 12);
    addText('• Pastikan koneksi internet stabil', 12);
    addText('• Coba logout dan login kembali', 12);
    addText('• Hubungi tim IT jika masalah berlanjut', 12);

    // 7. Jenis Kompetisi
    addNewPage();
    addText('7. JENIS KOMPETISI', 18, true, '#0066CC');
    yPosition += 10;
    addText('Sistem mendukung 2 jenis kompetisi:', 12, true);
    yPosition += 5;
    addText('1. HEAD TO HEAD (Basketball, Badminton, Volleyball, Futsal, Esports):', 12, true);
    addText('• Pertandingan antara 2 tim/fakultas', 12);
    addText('• Skor berupa angka (contoh: 21-19)', 12);
    addText('• Pemenang ditentukan dari skor tertinggi', 12);
    yPosition += 5;
    addText('2. TABEL KLASEMEN (Band, Dance):', 12, true);
    addText('• Semua tim tampil dan dinilai', 12);
    addText('• Skor berupa nilai dari juri', 12);
    addText('• Ranking berdasarkan skor tertinggi', 12);

    // 8. Menambah Pertandingan
    addNewPage();
    addText('8. MENAMBAH PERTANDINGAN', 18, true, '#0066CC');
    yPosition += 10;
    addText('Hanya SUP yang dapat menambah pertandingan:', 12, true);
    addText('1. Klik tombol "Add Match" (biru)', 12);
    addText('2. Isi informasi pertandingan:', 12);
    addText('   • Competition: Pilih kompetisi', 12);
    addText('   • Round: Final, 3rd Place, Qualifiers, dll', 12);
    addText('   • Date: Tanggal pertandingan', 12);
    addText('   • Time: Waktu pertandingan', 12);
    addText('   • Location: Lokasi pertandingan', 12);
    addText('   • Notes: Catatan tambahan', 12);
    addText('   • Faculty 1 vs Faculty 2: Untuk kompetisi head to head', 12);
    addText('   • Tidak perlu input tim untuk dance/band', 12);
    addText('3. Pertandingan otomatis terdaftar sebagai "Upcoming"', 12);
    addText('4. Dapat dilihat di bagian Matches', 12);

    // 9. Mengelola Status Pertandingan
    addNewPage();
    addText('9. MENGELOLA STATUS PERTANDINGAN', 18, true, '#0066CC');
    yPosition += 10;
    addText('Urutan tampilan di halaman utama:', 12, true);
    addText('1. LIVE (sedang berlangsung) - paling atas', 12);
    addText('2. UPCOMING (akan datang)', 12);
    addText('3. COMPLETED (selesai) - paling bawah', 12);
    addText('', 12);
    addText('Di halaman /matches hanya diurutkan berdasarkan tanggal.', 12);
    addText('', 12);
    addText('Mengubah status pertandingan:', 12, true);
    addText('• SUP, SPV, STF dapat mengubah status di admin panel', 12);
    addText('• Klik ikon edit dan "Update Match"', 12);
    addText('• Perubahan langsung terlihat di tampilan user', 12);
    addText('• Sistem update data setiap beberapa detik', 12);

    // 10. Update Skor
    addNewPage();
    addText('10. UPDATE SKOR', 18, true, '#0066CC');
    yPosition += 10;
    addText('Cara update skor:', 12, true);
    addText('1. Gunakan tombol panah atas/bawah di field skor', 12);
    addText('2. Tidak perlu klik "Save Changes" atau "Update"', 12);
    addText('3. Skor otomatis tersimpan', 12);
    addText('4. Perubahan langsung terlihat di tampilan user', 12);
    addText('', 12);
    addText('Untuk kompetisi tabel (band/dance):', 12, true);
    addText('• Klik "View Scores" atau ikon edit', 12);
    addText('• Input skor untuk setiap tim', 12);
    addText('• Sistem akan menampilkan top 3 setelah skor diinput', 12);

    // 11. Menyelesaikan Pertandingan
    addNewPage();
    addText('11. MENYELESAIKAN PERTANDINGAN', 18, true, '#0066CC');
    yPosition += 10;
    addText('Setelah pertandingan selesai:', 12, true);
    addText('1. Ubah status menjadi "Completed"', 12);
    addText('2. Pastikan skor sudah benar', 12);
    addText('3. Untuk kompetisi tabel, pastikan semua skor sudah diinput', 12);
    addText('4. Pertandingan akan pindah ke bagian bawah', 12);

    // 12. Sistem Penilaian Band/Dance
    addNewPage();
    addText('12. SISTEM PENILAIAN BAND/DANCE', 18, true, '#0066CC');
    yPosition += 10;
    addText('Jika kompetisi tabel selesai tapi belum ada skor:', 12, true);
    addText('• Website menampilkan "Judges Still Judging..."', 12);
    addText('• Setelah skor diinput, website menampilkan top 3', 12);
    addText('• Sistem otomatis menghitung pemenang berdasarkan skor tertinggi', 12);

    // 13. Perhitungan Medali
    addNewPage();
    addText('13. PERHITUNGAN MEDALI', 18, true, '#0066CC');
    yPosition += 10;
    addText('Sistem otomatis menghitung medali:', 12, true);
    addText('• Pemenang round "Final" = EMAS', 12);
    addText('• Kalah round "Final" = PERAK', 12);
    addText('• Pemenang round "3rd Place" = PERUNGGU', 12);
    addText('• Kalah round "Lower Final" = PERUNGGU', 12);
    addText('', 12);
    addText('Untuk kompetisi tabel:', 12, true);
    addText('• Posisi 1 = EMAS', 12);
    addText('• Posisi 2 = PERAK', 12);
    addText('• Posisi 3 = PERUNGGU', 12);

    // 14. Sinkronisasi Medali
    addNewPage();
    addText('14. SINKRONISASI MEDALI', 18, true, '#0066CC');
    yPosition += 10;
    addText('Untuk menghitung medali:', 12, true);
    addText('1. Klik tombol "Sync Medals" (biru)', 12);
    addText('2. Tunggu proses selesai (mungkin memakan waktu)', 12);
    addText('3. Tunggu sampai muncul toaster "Success"', 12);
    addText('4. Medal tally akan terupdate', 12);
    addText('', 12);
    addText('Best Practice:', 12, true);
    addText('• Sync medali hanya setelah Final atau 3rd Place selesai', 12);
    addText('• Jangan sync medali terlalu sering', 12);

    // 15. Menghapus Pertandingan
    addNewPage();
    addText('15. MENGHAPUS PERTANDINGAN', 18, true, '#0066CC');
    yPosition += 10;
    addText('Hanya SPV dan SUP yang dapat menghapus pertandingan:', 12, true);
    addText('1. Klik ikon tempat sampah merah', 12);
    addText('2. Konfirmasi penghapusan', 12);
    addText('3. Pertandingan akan dihapus dari sistem', 12);
    addText('', 12);
    addText('PERHATIAN: Penghapusan tidak dapat dibatalkan!', 12, true, '#FF0000');

    // 16. Reset Medali
    addNewPage();
    addText('16. RESET MEDALI', 18, true, '#0066CC');
    yPosition += 10;
    addText('Hanya SUP yang dapat reset medali:', 12, true);
    addText('1. Klik tombol merah "Reset Medals"', 12);
    addText('2. Konfirmasi reset', 12);
    addText('3. Semua medal tally akan menjadi 0', 12);
    addText('', 12);
    addText('KAPAN RESET MEDALI:', 12, true);
    addText('• Hanya saat memulai turnamen baru', 12);
    addText('• JANGAN reset di tengah turnamen', 12);
    addText('', 12);
    addText('PERHATIAN: Reset medali tidak dapat dibatalkan!', 12, true, '#FF0000');

    // 17. Input Skor Kompetisi Tabel
    addNewPage();
    addText('17. INPUT SKOR KOMPETISI TABEL', 18, true, '#0066CC');
    yPosition += 10;
    addText('Untuk kompetisi band/dance:', 12, true);
    addText('1. Klik "View Scores" atau ikon edit', 12);
    addText('2. Input skor untuk setiap tim/fakultas', 12);
    addText('3. Sistem otomatis menghitung ranking', 12);
    addText('4. Top 3 akan ditampilkan di website', 12);

    // 18. Sorting Data
    addNewPage();
    addText('18. SORTING DATA', 18, true, '#0066CC');
    yPosition += 10;
    addText('Admin dapat mengurutkan data berdasarkan:', 12, true);
    addText('• Tanggal (ascending/descending)', 12);
    addText('• Nama kompetisi (A-Z atau Z-A)', 12);
    addText('', 12);
    addText('Gunakan dropdown sorting di admin panel untuk mengatur tampilan data.', 12);

    // 19. Export Data
    addNewPage();
    addText('19. EXPORT DATA', 18, true, '#0066CC');
    yPosition += 10;
    addText('Hanya SUP yang dapat export data:', 12, true);
    addText('1. Klik tombol "Export Data" (hijau)', 12);
    addText('2. Pilih format:', 12);
    addText('   • JSON: Data lengkap dalam format JSON', 12);
    addText('   • CSV: Data pertandingan dalam format CSV', 12);
    addText('   • Excel: Data dalam format Excel', 12);
    addText('3. File akan otomatis terdownload', 12);

    // 20. Pembatasan Sistem
    addNewPage();
    addText('20. PEMBATASAN SISTEM', 18, true, '#0066CC');
    yPosition += 10;
    addText('Beberapa hal yang TIDAK DAPAT diubah melalui sistem:', 12, true);
    addText('', 12);
    addText('1. TAMBAH ADMIN USER:', 12, true);
    addText('   • Perlu ditambahkan melalui database', 12);
    addText('   • Hubungi developer/tim IT', 12);
    addText('', 12);
    addText('2. TAMBAH TIM/FAKULTAS:', 12, true);
    addText('   • Perlu ditambahkan melalui database', 12);
    addText('   • Perlu tambahan logic coding', 12);
    addText('   • Perlu update UI frontend', 12);
    addText('   • Hubungi developer/tim IT', 12);
    addText('', 12);
    addText('3. TAMBAH CABOR (CABANG OLAHRAGA):', 12, true);
    addText('   • Perlu ditambahkan melalui database', 12);
    addText('   • Perlu tambahan logic coding', 12);
    addText('   • Perlu update UI frontend', 12);
    addText('   • Hubungi developer/tim IT', 12);
    addText('', 12);
    addText('Untuk perubahan di atas, hubungi tim IT atau developer.', 12, true, '#FF0000');

    // Footer
    addNewPage();
    doc.setFillColor(0, 102, 204);
    doc.rect(0, pageHeight - 30, pageWidth, 30, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.text('PORSINARA - BINUS University Malang', pageWidth / 2, pageHeight - 15, { align: 'center' });
    doc.text(`Dokumen dibuat pada: ${new Date().toLocaleDateString('id-ID')}`, pageWidth / 2, pageHeight - 5, { align: 'center' });

    // Download the PDF
    doc.save(`Panduan-Admin-PORSINARA-${new Date().toISOString().split('T')[0]}.pdf`);
    
    addToast({
      type: 'success',
      title: 'PDF Berhasil Dibuat',
      message: 'Panduan admin telah berhasil dibuat dan didownload!',
      duration: 4000
    });
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
                      <button
                        onClick={() => {
                          generatePDFModule();
                          setShowExportDropdown(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                      >
                        <FileText className="w-4 h-4" />
                        <span>Download PDF Module</span>
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