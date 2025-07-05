# SHM Blockchain Frontend Application

## Overview
Frontend web application untuk sistem Sertifikat Hak Milik (SHM) berbasis blockchain menggunakan Hyperledger Fabric.

## Features
- **Dashboard Blockchain**: Informasi real-time tentang status blockchain
- **Daftar SHM**: Menampilkan semua sertifikat dengan fitur pencarian
- **Buat SHM**: Form untuk membuat sertifikat baru
- **Balik Nama**: Transfer kepemilikan sertifikat
- **Blockchain Verification**: Verifikasi integritas hash chain
- **Detail SHM**: Modal dengan informasi lengkap dan riwayat transaksi

## File Structure
```
view/
├── index.html          # Main HTML file
├── style.css           # CSS styling
├── script.js           # JavaScript logic
└── README.md           # Documentation
```

## API Integration
Frontend ini terintegrasi dengan API Gateway yang berjalan di `localhost:31914`:

### Endpoints yang digunakan:
- `GET /api/blockchain/info` - Informasi blockchain
- `GET /api/shm` - Daftar semua SHM
- `GET /api/shm/:id` - Detail SHM spesifik
- `GET /api/shm/:id/hash` - Hash blockchain SHM
- `GET /api/shm/:id/history` - Riwayat transaksi SHM
- `POST /api/shm` - Buat SHM baru
- `PUT /api/shm/balik-nama` - Transfer kepemilikan
- `GET /api/blockchain/verify-chain` - Verifikasi hash chain

## How to Run

### 1. Start Blockchain Network
```bash
cd ../network
./network.sh up createChannel -ca -s couchdb
./network.sh deployCC -ccn shm -ccp ../chaincode/ -ccl javascript
```

### 2. Start API Gateway
```bash
cd ../gateway
npm install
npm start
```

### 3. Open Frontend
```bash
cd view
# Buka index.html di browser atau gunakan live server
python3 -m http.server 8080
# Akses: http://localhost:8080
```

## Features Detail

### 1. Blockchain Dashboard
- Real-time connection status
- Network information (Channel, Chaincode, MSP)
- Block height dan transaction count
- Current block hash

### 2. SHM Management
- **Create**: Form lengkap untuk membuat sertifikat baru
- **List**: Grid view dengan informasi ringkas
- **Detail**: Modal dengan informasi lengkap + blockchain hash
- **Transfer**: Form balik nama dengan validasi

### 3. Blockchain Features
- **Hash Verification**: Menampilkan hash unik setiap SHM
- **Transaction History**: Riwayat semua transaksi SHM
- **Chain Verification**: Simulasi deteksi tampering pada blockchain

### 4. UI/UX Features
- **Responsive Design**: Bootstrap 5 untuk mobile-friendly
- **Real-time Updates**: Auto-refresh data setelah transaksi
- **Loading States**: Spinner dan feedback visual
- **Error Handling**: Alert untuk error dan success messages
- **Modal Dialogs**: Detail view tanpa page reload

## Technology Stack
- **HTML5**: Semantic markup
- **CSS3**: Custom styling + Bootstrap 5
- **JavaScript ES6+**: Modern JS dengan async/await
- **Bootstrap 5**: Responsive framework
- **Font Awesome**: Icons
- **Fetch API**: HTTP requests ke backend

## Configuration
Edit `script.js` untuk mengubah API base URL:
```javascript
const API_BASE_URL = 'http://localhost:31914/api';
```

## Browser Compatibility
- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## Development Notes
- Menggunakan vanilla JavaScript (no framework dependencies)
- Responsive design untuk desktop dan mobile
- Error handling untuk semua API calls
- Loading states untuk better UX
- Modular code structure untuk maintainability