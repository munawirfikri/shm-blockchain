const API_BASE_URL = 'http://localhost:31914/api';

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    loadBlockchainInfo();
    loadSHMList();
    setupEventListeners();
});

function setupEventListeners() {
    // Create SHM form
    document.getElementById('create-shm-form').addEventListener('submit', handleCreateSHM);
    
    // Transfer SHM form
    document.getElementById('transfer-shm-form').addEventListener('submit', handleTransferSHM);
}

// Load blockchain information
async function loadBlockchainInfo() {
    try {
        const response = await fetch(`${API_BASE_URL}/blockchain/info`);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        
        if (!result.error) {
            displayBlockchainInfo(result.data);
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        console.error('Blockchain info error:', error);
        document.getElementById('blockchain-info').innerHTML = `
            <div class="alert alert-danger">
                <i class="fas fa-exclamation-triangle"></i> 
                <strong>Connection Error:</strong> ${error.message}<br>
                <small>Make sure API Gateway is running on port 31914</small>
            </div>
        `;
        updateConnectionStatus(false);
    }
}

function displayBlockchainInfo(data) {
    const { network, blockchain } = data;
    document.getElementById('blockchain-info').innerHTML = `
        <div class="row">
            <div class="col-md-6">
                <h6><i class="fas fa-network-wired"></i> Network Info</h6>
                <p><strong>Channel:</strong> ${network.channelName}</p>
                <p><strong>Chaincode:</strong> ${network.chaincodeName}</p>
                <p><strong>MSP ID:</strong> ${network.mspId}</p>
            </div>
            <div class="col-md-6">
                <h6><i class="fas fa-cubes"></i> Blockchain Status</h6>
                <p><strong>Block Height:</strong> ${blockchain.blockHeight}</p>
                <p><strong>Transactions:</strong> ${blockchain.transactionCount}</p>
                <p><strong>Current Hash:</strong> <code>${blockchain.currentBlockHash}...</code></p>
            </div>
        </div>
    `;
    updateConnectionStatus(true);
}

function updateConnectionStatus(connected) {
    const statusElement = document.getElementById('blockchain-status');
    if (connected) {
        statusElement.innerHTML = '<i class="fas fa-circle text-success"></i> Connected';
    } else {
        statusElement.innerHTML = '<i class="fas fa-circle text-danger"></i> Disconnected';
    }
}

// Load SHM list
async function loadSHMList() {
    try {
        const response = await fetch(`${API_BASE_URL}/shm`);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log('SHM API Response:', result);
        
        if (!result.error) {
            displaySHMList(result.data);
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        console.error('SHM list error:', error);
        document.getElementById('shm-list').innerHTML = `
            <div class="alert alert-danger">
                <i class="fas fa-exclamation-triangle"></i> 
                <strong>API Error:</strong> ${error.message}<br>
                <small>Check if blockchain network and API Gateway are running</small>
            </div>
        `;
    }
}

function displaySHMList(data) {
    const container = document.getElementById('shm-list');
    
    console.log('Displaying SHM data:', data);
    
    if (!data || data.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-certificate"></i>
                <h5>Belum ada data SHM</h5>
                <p>Silakan buat sertifikat baru di tab "Buat SHM"</p>
            </div>
        `;
        return;
    }

    const shmCards = data.map(shm => `
        <div class="col-md-6 col-lg-4 mb-3">
            <div class="card shm-card" onclick="showSHMDetail('${shm.nomor_sertifikat || 'N/A'}')">
                <div class="card-body">
                    <h6 class="card-title">
                        <i class="fas fa-certificate"></i> ${shm.nomor_sertifikat || 'N/A'}
                    </h6>
                    <p class="card-text">
                        <strong>Pemilik:</strong> ${shm.pemilik?.nama || 'N/A'}<br>
                        <strong>Luas:</strong> ${shm.properti?.luas_tanah || 'N/A'} m²<br>
                        <strong>Status:</strong> 
                        <span class="badge ${(shm.status_sertifikat || 'AKTIF') === 'AKTIF' ? 'bg-success' : 'bg-secondary'} status-badge">
                            ${shm.status_sertifikat || 'AKTIF'}
                        </span>
                    </p>
                    <small class="text-muted">
                        <i class="fas fa-calendar"></i> ${formatDate(shm.tanggal_penerbitan)}
                    </small>
                </div>
            </div>
        </div>
    `).join('');

    container.innerHTML = `
        <div class="row">
            ${shmCards}
        </div>
    `;
}

// Show SHM detail in modal
async function showSHMDetail(nomorSertifikat) {
    try {
        const [shmResponse, hashResponse, historyResponse] = await Promise.all([
            fetch(`${API_BASE_URL}/shm/${nomorSertifikat}`),
            fetch(`${API_BASE_URL}/shm/${nomorSertifikat}/hash`),
            fetch(`${API_BASE_URL}/shm/${nomorSertifikat}/history`)
        ]);

        const shmResult = await shmResponse.json();
        const hashResult = await hashResponse.json();
        const historyResult = await historyResponse.json();

        if (!shmResult.error) {
            displaySHMModal(shmResult.data, hashResult.data, historyResult.data);
        }
    } catch (error) {
        console.error('Error loading SHM detail:', error);
    }
}

function displaySHMModal(shm, hash, history) {
    const modalBody = document.getElementById('shm-modal-body');
    
    modalBody.innerHTML = `
        <div class="row">
            <div class="col-md-8">
                <h6><i class="fas fa-info-circle"></i> Informasi Sertifikat</h6>
                <table class="table table-sm">
                    <tr><td><strong>Nomor Sertifikat:</strong></td><td>${shm.nomor_sertifikat}</td></tr>
                    <tr><td><strong>Nama Pemilik:</strong></td><td>${shm.pemilik?.nama}</td></tr>
                    <tr><td><strong>NIK:</strong></td><td>${shm.pemilik?.nik}</td></tr>
                    <tr><td><strong>Luas Tanah:</strong></td><td>${shm.properti?.luas_tanah} m²</td></tr>
                    <tr><td><strong>Alamat:</strong></td><td>${shm.properti?.lokasi?.alamat}</td></tr>
                    <tr><td><strong>Penerbit:</strong></td><td>${shm.penerbit}</td></tr>
                    <tr><td><strong>Tanggal Terbit:</strong></td><td>${formatDate(shm.tanggal_penerbitan)}</td></tr>
                    <tr><td><strong>Status:</strong></td><td>
                        <span class="badge ${shm.status_sertifikat === 'AKTIF' ? 'bg-success' : 'bg-secondary'}">
                            ${shm.status_sertifikat}
                        </span>
                    </td></tr>
                </table>
            </div>
            <div class="col-md-4">
                <h6><i class="fas fa-fingerprint"></i> Blockchain Hash</h6>
                <div class="hash-display">
                    <small>${hash ? hash.currentHash : 'Loading...'}</small>
                </div>
            </div>
        </div>
        
        ${shm.riwayat_transaksi && shm.riwayat_transaksi.length > 0 ? `
        <hr>
        <h6><i class="fas fa-history"></i> Riwayat Transaksi</h6>
        <div class="history-container">
            ${shm.riwayat_transaksi.map(item => `
                <div class="history-item">
                    <div class="d-flex justify-content-between">
                        <strong>${item.jenis}</strong>
                        <span class="timestamp">${formatDate(item.tanggal)}</span>
                    </div>
                    <p class="mb-1">${item.keterangan}</p>
                    <div class="hash-display mt-2">
                        <small>TX: ${item.id_transaksi}</small>
                    </div>
                </div>
            `).join('')}
        </div>
        ` : ''}
    `;
    
    new bootstrap.Modal(document.getElementById('shmModal')).show();
}

// Handle create SHM form submission
async function handleCreateSHM(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const formEntries = Object.fromEntries(formData.entries());
    
    // Structure data according to API format
    const shmData = {
        nomor_sertifikat: formEntries.nomorSertifikat,
        penerbit: formEntries.penerbit || 'Kantor Pertanahan Jakarta',
        pemilik: {
            nama: formEntries.namaPemilik,
            nik: formEntries.nikPemilik
        },
        properti: {
            nomor_objek_pajak: formEntries.nomorObjekPajak || '31.74.020.002.002-0000.0',
            luas_tanah: parseInt(formEntries.luasTanah),
            lokasi: {
                alamat: formEntries.alamatTanah,
                desa_kelurahan: formEntries.kelurahan || 'N/A',
                kecamatan: formEntries.kecamatan || 'N/A',
                kota_kabupaten: formEntries.kota || 'Jakarta',
                provinsi: formEntries.provinsi || 'DKI Jakarta'
            },
            referensi_surat_ukur: formEntries.suratUkur || 'SU-2025-AUTO'
        },
        status_sertifikat: formEntries.status?.toUpperCase() || 'AKTIF',
        tanggal_penerbitan: new Date(formEntries.tanggal_penerbitan).toISOString()
    };
    
    try {
        const response = await fetch(`${API_BASE_URL}/shm`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(shmData)
        });
        
        const result = await response.json();
        
        if (!result.error) {
            showAlert('success', 'SHM berhasil dibuat!');
            event.target.reset();
            loadSHMList();
            loadBlockchainInfo();
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        showAlert('danger', `Error: ${error.message}`);
    }
}

// Handle transfer SHM form submission
async function handleTransferSHM(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const transferData = Object.fromEntries(formData.entries());
    
    try {
        const response = await fetch(`${API_BASE_URL}/shm/balik-nama`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(transferData)
        });
        
        const result = await response.json();
        
        if (!result.error) {
            showAlert('success', 'Balik nama berhasil!');
            event.target.reset();
            loadSHMList();
            loadBlockchainInfo();
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        showAlert('danger', `Error: ${error.message}`);
    }
}

// Verify blockchain chain
async function verifyChain() {
    try {
        const response = await fetch(`${API_BASE_URL}/blockchain/verify-chain`);
        const result = await response.json();
        
        displayChainVerification(result);
    } catch (error) {
        document.getElementById('chain-verification').innerHTML = `
            <div class="alert alert-danger">
                Error verifying chain: ${error.message}
            </div>
        `;
    }
}

function displayChainVerification(result) {
    const container = document.getElementById('chain-verification');
    
    if (result.data && result.data.blocks) {
        const blocks = result.data.blocks.map(block => `
            <div class="chain-block ${block.isValid ? 'valid' : 'invalid'}">
                <h6>Block ${block.blockNumber} ${block.isValid ? '✅' : '❌'}</h6>
                <p><strong>Hash:</strong> <code>${block.currentHash.substring(0, 32)}...</code></p>
                <p><strong>Previous:</strong> <code>${block.previousHash.substring(0, 32)}...</code></p>
                <small class="text-muted">${formatDate(block.timestamp)}</small>
            </div>
        `).join('');
        
        container.innerHTML = `
            <div class="alert ${result.data.chainStatus === 'VALID' ? 'alert-success' : 'alert-warning'}">
                <strong>Chain Status:</strong> ${result.data.chainStatus}
            </div>
            ${blocks}
        `;
    } else {
        container.innerHTML = `
            <div class="alert alert-info">
                ${result.message}
            </div>
        `;
    }
}

// Utility functions
function formatDate(dateString) {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID');
}

function showAlert(type, message) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.querySelector('.container').insertBefore(alertDiv, document.querySelector('.container').firstChild);
    
    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}