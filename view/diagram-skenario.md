# Diagram Skenario SHM Blockchain

## Skenario: Buat SHM untuk Romi → Balik Nama ke Suci

### 1. **Tahap Awal - Pembuatan SHM**

```
┌─────────────────────────────────────────────────────────────────┐
│                    STEP 1: BUAT SHM ROMI                       │
└─────────────────────────────────────────────────────────────────┘

Frontend (Browser)          API Gateway              Blockchain Network
      │                         │                           │
      │ POST /api/shm          │                           │
      │ {                      │                           │
      │   nomor_sertifikat:    │                           │
      │   "SHM-ROMI-001",      │                           │
      │   pemilik: {           │                           │
      │     nama: "Romi",      │                           │
      │     nik: "1234567890"  │                           │
      │   },                   │                           │
      │   properti: {          │                           │
      │     luas_tanah: 500    │                           │
      │   }                    │                           │
      │ }                      │                           │
      │──────────────────────→ │                           │
      │                        │ submitTransaction()       │
      │                        │ createSHM()              │
      │                        │─────────────────────────→ │
      │                        │                          │ ┌─────────────┐
      │                        │                          │ │   BLOCK 1   │
      │                        │                          │ │             │
      │                        │                          │ │ TX: CREATE  │
      │                        │                          │ │ Owner: Romi │
      │                        │                          │ │ Hash: abc123│
      │                        │                          │ └─────────────┘
      │                        │ ← Transaction Success    │
      │ ← 200 OK              │                           │
      │   "SHM berhasil dibuat"│                           │
```

### 2. **Tahap Kedua - Balik Nama**

```
┌─────────────────────────────────────────────────────────────────┐
│                 STEP 2: BALIK NAMA KE SUCI                     │
└─────────────────────────────────────────────────────────────────┘

Frontend (Browser)          API Gateway              Blockchain Network
      │                         │                           │
      │ PUT /api/shm/balik-nama│                           │
      │ {                      │                           │
      │   nomor_sertifikat:    │                           │
      │   "SHM-ROMI-001",      │                           │
      │   nama_pemilik_baru:   │                           │
      │   "Suci",              │                           │
      │   nik_pemilik_baru:    │                           │
      │   "0987654321"         │                           │
      │ }                      │                           │
      │──────────────────────→ │                           │
      │                        │ submitTransaction()       │
      │                        │ balikNama()              │
      │                        │─────────────────────────→ │
      │                        │                          │ ┌─────────────┐
      │                        │                          │ │   BLOCK 2   │
      │                        │                          │ │             │
      │                        │                          │ │ TX: TRANSFER│
      │                        │                          │ │ From: Romi  │
      │                        │                          │ │ To: Suci    │
      │                        │                          │ │ Hash: def456│
      │                        │                          │ │ Prev: abc123│
      │                        │                          │ └─────────────┘
      │                        │ ← Transaction Success    │
      │ ← 200 OK              │                           │
      │   "Balik nama berhasil"│                           │
```

### 3. **Blockchain Hash Chain**

```
┌─────────────────────────────────────────────────────────────────┐
│                    BLOCKCHAIN HASH CHAIN                        │
└─────────────────────────────────────────────────────────────────┘

Genesis Block          Block 1 (CREATE)         Block 2 (TRANSFER)
┌─────────────┐       ┌─────────────────┐       ┌─────────────────┐
│             │       │ SHM-ROMI-001    │       │ SHM-ROMI-001    │
│ Genesis     │──────→│ Owner: Romi     │──────→│ Owner: Suci     │
│ Hash: 0000  │       │ Action: CREATE  │       │ Action: TRANSFER│
│             │       │ Hash: abc123... │       │ Hash: def456... │
└─────────────┘       │ Prev: 0000...   │       │ Prev: abc123... │
                      │ Time: 10:00     │       │ Time: 10:05     │
                      └─────────────────┘       └─────────────────┘
```

### 4. **Data Structure Evolution**

```
┌─────────────────────────────────────────────────────────────────┐
│                    DATA EVOLUTION                               │
└─────────────────────────────────────────────────────────────────┘

SEBELUM (Block 1):
{
  "nomor_sertifikat": "SHM-ROMI-001",
  "pemilik": {
    "nama": "Romi",
    "nik": "1234567890"
  },
  "status_sertifikat": "AKTIF",
  "riwayat_transaksi": [
    {
      "jenis": "Penerbitan Awal",
      "tanggal": "2025-07-05T10:00:00Z",
      "keterangan": "Diterbitkan untuk Romi"
    }
  ]
}

SESUDAH (Block 2):
{
  "nomor_sertifikat": "SHM-ROMI-001",
  "pemilik": {
    "nama": "Suci",           ← BERUBAH
    "nik": "0987654321"       ← BERUBAH
  },
  "status_sertifikat": "AKTIF",
  "riwayat_transaksi": [
    {
      "jenis": "Penerbitan Awal",
      "tanggal": "2025-07-05T10:00:00Z",
      "keterangan": "Diterbitkan untuk Romi"
    },
    {
      "jenis": "Balik Nama",   ← DITAMBAH
      "tanggal": "2025-07-05T10:05:00Z",
      "keterangan": "Kepemilikan beralih dari Romi ke Suci"
    }
  ]
}
```

### 5. **Frontend UI Flow**

```
┌─────────────────────────────────────────────────────────────────┐
│                      FRONTEND FLOW                             │
└─────────────────────────────────────────────────────────────────┘

Step 1: Buat SHM
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Form Input    │    │   Submit Data   │    │   Success Alert │
│                 │    │                 │    │                 │
│ Nomor: SHM-001  │───→│ POST /api/shm   │───→│ "SHM berhasil   │
│ Nama: Romi      │    │                 │    │  dibuat!"       │
│ NIK: 1234567890 │    │                 │    │                 │
│ Luas: 500 m²    │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘

Step 2: Balik Nama
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Form Transfer │    │  Submit Transfer│    │   Success Alert │
│                 │    │                 │    │                 │
│ Nomor: SHM-001  │───→│ PUT /api/shm/   │───→│ "Balik nama     │
│ Nama Baru: Suci │    │ balik-nama      │    │  berhasil!"     │
│ NIK Baru: 098.. │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘

Step 3: View History
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Click Detail  │    │   Load History  │    │   Show Modal    │
│                 │    │                 │    │                 │
│ SHM Card Click  │───→│ GET /api/shm/   │───→│ • Penerbitan    │
│                 │    │ {id}/history    │    │ • Balik Nama    │
│                 │    │                 │    │ • Hash Info     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 6. **Verification & Security**

```
┌─────────────────────────────────────────────────────────────────┐
│                    BLOCKCHAIN VERIFICATION                      │
└─────────────────────────────────────────────────────────────────┘

Hash Verification:
Block 1 Hash = SHA256(Genesis_Hash + Romi_Data + Timestamp)
Block 2 Hash = SHA256(Block1_Hash + Transfer_Data + Timestamp)

Chain Integrity:
✅ Block 1: Hash valid, Previous hash matches Genesis
✅ Block 2: Hash valid, Previous hash matches Block 1
✅ Chain Status: VALID

Immutability:
❌ Jika ada perubahan data di Block 1:
   - Hash Block 1 berubah
   - Block 2 previous hash tidak cocok
   - Chain Status: BROKEN
   - Tampering detected!
```

### 7. **API Endpoints Used**

```
┌─────────────────────────────────────────────────────────────────┐
│                      API ENDPOINTS                             │
└─────────────────────────────────────────────────────────────────┘

1. POST /api/shm
   → Membuat SHM baru untuk Romi

2. PUT /api/shm/balik-nama
   → Transfer kepemilikan dari Romi ke Suci

3. GET /api/shm
   → Menampilkan daftar SHM (termasuk yang sudah di-transfer)

4. GET /api/shm/{id}
   → Detail SHM spesifik

5. GET /api/shm/{id}/history
   → Riwayat transaksi SHM

6. GET /api/shm/{id}/hash
   → Hash blockchain untuk SHM

7. GET /api/blockchain/verify-chain
   → Verifikasi integritas hash chain
```

## Kesimpulan Skenario

1. **SHM dibuat** atas nama Romi → Tercatat di Block 1
2. **Balik nama** ke Suci → Tercatat di Block 2  
3. **Hash chain** menghubungkan kedua transaksi
4. **Riwayat lengkap** tersimpan dan tidak bisa diubah
5. **Verifikasi** dapat dilakukan kapan saja
6. **Frontend** menampilkan semua informasi secara real-time