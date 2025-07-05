# Sistem Sertifikat Hak Milik (SHM) Berbasis Blockchain

## Overview
Project ini mengimplementasikan sistem manajemen Sertifikat Hak Milik (SHM) menggunakan **Hyperledger Fabric** sebagai platform blockchain. Sistem ini memastikan transparansi, immutability, dan traceability dalam pengelolaan sertifikat tanah.

## Arsitektur Blockchain

### 1. **Komponen Hyperledger Fabric**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Gateway API   │    │   Peer Node     │    │   Orderer       │
│   (Express.js)  │◄──►│   (Org1MSP)     │◄──►│   (Consensus)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌─────────────────┐              │
         └─────────────►│   Chaincode     │◄─────────────┘
                        │   (Smart        │
                        │   Contract)     │
                        └─────────────────┘
```

### 2. **Lokasi Blockchain**
Blockchain berjalan pada **Hyperledger Fabric Network** yang terdiri dari:

- **Channel**: `mychannel` - Saluran komunikasi antar peer
- **Chaincode**: `shm` - Smart contract yang berisi business logic
- **Peer Node**: `peer0.org1.example.com:7051` - Node yang menyimpan ledger
- **Orderer**: `orderer.example.com:7050` - Node untuk consensus dan ordering transaksi

### 3. **Struktur Data Blockchain**

#### Block Structure:
```json
{
  "blockNumber": 5,
  "blockHash": "a1b2c3d4e5f6...",
  "previousHash": "e5f6g7h8i9j0...",
  "timestamp": "2024-01-01T10:00:00Z",
  "transactions": [
    {
      "txId": "abc123def456",
      "chaincode": "shm",
      "function": "createSHM",
      "args": ["SHM001", "{...}"]
    }
  ]
}
```

## Mekanisme Blockchain dalam SHM

### 1. **Proses Transaksi**
```
Client Request → Gateway API → Fabric SDK → Peer Node → Chaincode → Ledger
```

#### Step-by-step:
1. **Client** mengirim request ke Gateway API
2. **Gateway** memvalidasi request dan membuat proposal transaksi
3. **Peer Node** mengeksekusi chaincode dan menghasilkan read/write set
4. **Orderer** melakukan consensus dan membuat block baru
5. **Block** didistribusikan ke semua peer dan disimpan di ledger

### 2. **Immutability & Hash Chain**
Setiap block terhubung dengan block sebelumnya melalui **cryptographic hash**:

```
Genesis Block → Block 1 → Block 2 → Block 3 → ...
    ↓            ↓         ↓         ↓
  Hash_0 ──→ Hash_1 ──→ Hash_2 ──→ Hash_3
```

### 3. **Smart Contract Functions**
Chaincode SHM memiliki fungsi-fungsi:

- `createSHM()` - Membuat sertifikat baru
- `readSHM()` - Membaca data sertifikat
- `getAllSHM()` - Mengambil semua sertifikat
- `balikNama()` - Transfer kepemilikan
- `batalkanSHM()` - Pembatalan sertifikat

## Keamanan Blockchain

### 1. **Cryptographic Security**
- **SHA-256 Hashing** untuk integritas data
- **Digital Signatures** untuk autentikasi
- **TLS/SSL** untuk komunikasi aman

### 2. **Access Control**
- **MSP (Membership Service Provider)**: Org1MSP
- **Certificate-based Authentication**
- **Private Key Signing**

### 3. **Consensus Mechanism**
- **Raft Consensus** pada Orderer
- **Endorsement Policy** pada Peer
- **Validation** sebelum commit ke ledger

## API Endpoints Blockchain

### Informasi Blockchain
```bash
GET /api/blockchain/info
```
Response:
```json
{
  "network": {
    "channelName": "mychannel",
    "chaincodeName": "shm",
    "mspId": "Org1MSP"
  },
  "blockchain": {
    "currentBlockHash": "a1b2c3d4...",
    "previousBlockHash": "e5f6g7h8...",
    "blockHeight": 6,
    "transactionCount": 5
  }
}
```

### Hash SHM Spesifik
```bash
GET /api/shm/{id}/hash
```

### History Transaksi
```bash
GET /api/shm/{id}/history
```

## Keunggulan Blockchain untuk SHM

### 1. **Transparency**
- Semua transaksi tercatat dan dapat diaudit
- History kepemilikan dapat dilacak

### 2. **Immutability**
- Data tidak dapat diubah setelah di-commit
- Mencegah pemalsuan sertifikat

### 3. **Decentralization**
- Tidak ada single point of failure
- Data terdistribusi di multiple nodes

### 4. **Traceability**
- Setiap perubahan kepemilikan terekam
- Audit trail yang lengkap

## Konfigurasi Network

### File Konfigurasi:
- `network/` - Hyperledger Fabric network configuration
- `organizations/` - Certificate dan key management
- `gateway/` - API Gateway untuk akses blockchain

### Koneksi:
- **Peer**: localhost:7051
- **Orderer**: localhost:7050
- **Gateway API**: localhost:31914

## Cara Kerja Hash Chain

1. **Genesis Block** (Block 0):
   ```
   Hash: SHA256("genesis-block") = 0000000...
   ```

2. **Block 1**:
   ```
   Hash: SHA256(previousHash + transactions + timestamp)
   ```

3. **Verification**:
   ```
   Setiap block memverifikasi hash block sebelumnya
   Jika ada perubahan, hash chain akan broken
   ```

## Simulasi Hash Chain Broken

### Endpoint Verifikasi Chain
```bash
GET /api/blockchain/verify-chain
```

### Skenario Tampering:
1. **Normal Chain**: Semua hash valid dan terhubung
2. **Broken Chain**: Ada block yang diubah (tampered)

### Response Broken Chain:
```json
{
  "error": false,
  "message": "Hash chain is BROKEN - Tampering detected!",
  "data": {
    "chainStatus": "BROKEN",
    "totalBlocks": 5,
    "tamperedBlocks": 3,
    "blocks": [
      {
        "blockNumber": 1,
        "currentHash": "a1b2c3d4e5f6...",
        "previousHash": "0000000000000...",
        "isValid": true,
        "status": "✅ VALID"
      },
      {
        "blockNumber": 2,
        "currentHash": "f6g7h8i9j0k1...",
        "previousHash": "a1b2c3d4e5f6...",
        "isValid": false,
        "status": "❌ TAMPERED"
      }
    ]
  }
}
```

### Cara Kerja Deteksi:
1. **Hash Calculation**: Setiap block menghitung hash dari data + previousHash
2. **Chain Verification**: Membandingkan hash yang tersimpan vs hash yang dihitung
3. **Tampering Detection**: Jika hash tidak cocok = block telah diubah
4. **Cascade Effect**: Block yang tampered akan mempengaruhi semua block setelahnya

### Contoh Broken Chain:
```
Genesis → Block1 → Block2(TAMPERED) → Block3(INVALID) → Block4(INVALID)
   ✅        ✅         ❌              ❌              ❌
```

**Penjelasan:**
- Block2 diubah datanya (tampered)
- Hash Block2 menjadi tidak valid
- Block3 dan seterusnya menjadi invalid karena previousHash tidak cocok
- Sistem dapat mendeteksi titik awal tampering

## Kesimpulan

Blockchain dalam project SHM ini berfungsi sebagai **distributed ledger** yang menyimpan semua transaksi sertifikat tanah dengan jaminan:
- **Keamanan** melalui cryptographic hashing
- **Transparansi** melalui audit trail
- **Immutability** melalui hash chain
- **Decentralization** melalui multiple peer nodes

Sistem ini memastikan bahwa setiap sertifikat tanah memiliki jejak digital yang tidak dapat dipalsukan dan dapat diverifikasi oleh semua pihak yang berwenang.