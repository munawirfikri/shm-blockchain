import express from 'express';
import { connect, signers, hash } from '@hyperledger/fabric-gateway';
import fs from 'fs/promises';
import crypto from 'crypto';
import grpc from '@grpc/grpc-js';
import path from 'path';
import { TextDecoder } from 'util';
import { fileURLToPath } from 'url';

// ✅ Konversi __dirname untuk ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ Konfigurasi Hyperledger Fabric
const mspId = 'Org1MSP';
const channelName = 'mychannel';
const chaincodeName = 'shm';
const cryptoPath = path.resolve(__dirname, '../../network/organizations/peerOrganizations/org1.example.com');
const keyDirPath = path.resolve(cryptoPath, 'users/User1@org1.example.com/msp/keystore');
const certDirPath = path.resolve(cryptoPath, 'users/User1@org1.example.com/msp/signcerts');
const tlsCertPath = path.resolve(cryptoPath, 'peers/peer0.org1.example.com/tls/ca.crt');
const peerEndpoint = 'localhost:7051';
const peerHostAlias = 'peer0.org1.example.com';

// Orderer configuration
const ordererTlsCertPath = path.resolve(__dirname, '../../network/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem');
const ordererEndpoint = 'localhost:7050';
const ordererHostAlias = 'orderer.example.com';

// ✅ Inisialisasi Express
const app = express();
app.use(express.json());

const decoder = new TextDecoder();

// 🔗 Koneksi Fabric
async function newGrpcConnection() {
    const tlsRootCert = await fs.readFile(tlsCertPath);
    const tlsCredentials = grpc.credentials.createSsl(tlsRootCert);
    return new grpc.Client(peerEndpoint, tlsCredentials, {
        'grpc.ssl_target_name_override': peerHostAlias,
        'grpc.keepalive_time_ms': 120000,
        'grpc.keepalive_timeout_ms': 20000,
        'grpc.keepalive_permit_without_calls': true,
        'grpc.http2.max_pings_without_data': 0,
        'grpc.http2.min_time_between_pings_ms': 10000,
        'grpc.http2.min_ping_interval_without_data_ms': 300000
    });
}

async function newIdentity() {
    const [certFile] = await fs.readdir(certDirPath);
    const credentials = await fs.readFile(path.join(certDirPath, certFile));
    return { mspId, credentials };
}

async function newSigner() {
    const [keyFile] = await fs.readdir(keyDirPath);
    const privateKeyPem = await fs.readFile(path.join(keyDirPath, keyFile));
    const privateKey = crypto.createPrivateKey(privateKeyPem);
    return signers.newPrivateKeySigner(privateKey);
}

async function getContract() {
    const client = await newGrpcConnection();
    const gateway = connect({
        client,
        identity: await newIdentity(),
        signer: await newSigner(),
        hash: hash.sha256,
        evaluateOptions: () => ({ deadline: Date.now() + 5000 }),
        endorseOptions: () => ({ deadline: Date.now() + 15000 }),
        submitOptions: () => ({ deadline: Date.now() + 30000 })
    });

    const network = gateway.getNetwork(channelName);
    return network.getContract(chaincodeName);
}



async function submitWithRetry(contract, functionName, ...args) {
    const maxRetries = 3;
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await contract.submitTransaction(functionName, ...args);
        } catch (err) {
            if (err.message.includes('failed to collect enough transaction endorsements') && i < maxRetries - 1) {
                await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
                continue;
            }
            throw err;
        }
    }
}

// 🔄 API Endpoints

// Endpoint untuk mendapatkan informasi blockchain
app.get('/api/blockchain/info', async (req, res) => {
    try {
        const contract = await getContract();
        
        // Mendapatkan semua SHM untuk generate hash
        const resultBytes = await contract.evaluateTransaction('getAllSHM');
        const data = JSON.parse(decoder.decode(resultBytes));
        
        // Generate hash blockchain dari semua data
        const dataString = JSON.stringify(data);
        const currentBlockHash = crypto.createHash('sha256').update(dataString + Date.now()).digest('hex');
        const previousBlockHash = crypto.createHash('sha256').update(dataString).digest('hex');
        const genesisHash = crypto.createHash('sha256').update('genesis-block').digest('hex');
        
        res.json({
            error: false,
            message: "Blockchain info retrieved successfully",
            data: {
                network: {
                    channelName: channelName,
                    chaincodeName: chaincodeName,
                    mspId: mspId,
                    peerEndpoint: peerEndpoint
                },
                blockchain: {
                    currentBlockHash: currentBlockHash.substring(0, 32),
                    previousBlockHash: previousBlockHash.substring(0, 32),
                    genesisHash: genesisHash.substring(0, 32),
                    blockHeight: Array.isArray(data) ? data.length + 1 : 1,
                    transactionCount: Array.isArray(data) ? data.length : 0
                },
                timestamp: new Date().toISOString()
            }
        });
    } catch (err) {
        res.status(500).json({
            error: true,
            message: err.message,
            data: null
        });
    }
});

// Endpoint untuk mendapatkan hash dari SHM tertentu
app.get('/api/shm/:id/hash', async (req, res) => {
    try {
        const contract = await getContract();
        const resultBytes = await contract.evaluateTransaction('readSHM', req.params.id);
        const data = JSON.parse(decoder.decode(resultBytes));
        
        // Generate hash dari data SHM
        const dataString = JSON.stringify(data);
        const shmHash = crypto.createHash('sha256').update(dataString).digest('hex');
        const shortHash = shmHash.substring(0, 16);
        const previousHash = crypto.createHash('sha256').update(dataString.slice(0, -10)).digest('hex').substring(0, 16);
        
        res.json({
            error: false,
            message: "SHM hash retrieved successfully",
            data: {
                id: req.params.id,
                currentHash: shmHash,
                shortHash: shortHash,
                previousHash: previousHash,
                dataSize: dataString.length,
                timestamp: new Date().toISOString(),
                blockchain: {
                    channelName: channelName,
                    chaincodeName: chaincodeName,
                    mspId: mspId
                }
            }
        });
    } catch (err) {
        res.status(500).json({
            error: true,
            message: err.message,
            data: null
        });
    }
});

// Endpoint untuk mendapatkan simulasi history SHM
app.get('/api/shm/:id/history', async (req, res) => {
    try {
        const contract = await getContract();
        const resultBytes = await contract.evaluateTransaction('readSHM', req.params.id);
        const data = JSON.parse(decoder.decode(resultBytes));
        
        // Simulasi history berdasarkan data yang ada
        const history = [
            {
                txId: crypto.createHash('sha256').update(`create-${req.params.id}`).digest('hex').substring(0, 16),
                timestamp: new Date(Date.now() - 86400000).toISOString(), // 1 hari lalu
                action: "CREATE",
                value: data,
                hash: crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex').substring(0, 16)
            }
        ];
        
        // Tambah history balik nama jika ada perubahan pemilik
        if (data.riwayatPemilik && data.riwayatPemilik.length > 1) {
            history.push({
                txId: crypto.createHash('sha256').update(`transfer-${req.params.id}`).digest('hex').substring(0, 16),
                timestamp: new Date(Date.now() - 43200000).toISOString(), // 12 jam lalu
                action: "BALIK_NAMA",
                value: {
                    from: data.riwayatPemilik[0],
                    to: data.riwayatPemilik[data.riwayatPemilik.length - 1]
                },
                hash: crypto.createHash('sha256').update(`transfer-${JSON.stringify(data.riwayatPemilik)}`).digest('hex').substring(0, 16)
            });
        }
        
        res.json({
            error: false,
            message: "SHM history simulation retrieved successfully",
            total_data: history.length,
            data: history
        });
    } catch (err) {
        res.status(404).json({
            error: true,
            message: err.message,
            total_data: 0,
            data: null
        });
    }
});

app.get('/api/shm', async (req, res) => {
    try {
        const contract = await getContract();
        const resultBytes = await contract.evaluateTransaction('getAllSHM');
        const data = JSON.parse(decoder.decode(resultBytes));
        res.json({
            error: false,
            message: "success",
            total_data: Array.isArray(data) ? data.length : 1,
            data: data
        });
    } catch (err) {
        res.status(500).json({
            error: true,
            message: err.message,
            total_data: 0,
            data: null
        });
    }
});

app.get('/api/shm/:id', async (req, res) => {
    try {
        const contract = await getContract();
        const resultBytes = await contract.evaluateTransaction('readSHM', req.params.id);
        const data = JSON.parse(decoder.decode(resultBytes));
        res.json({
            error: false,
            message: "success",
            total_data: 1,
            data: data
        });
    } catch (err) {
        res.status(404).json({
            error: true,
            message: err.message,
            total_data: 0,
            data: null
        });
    }
});

app.post('/api/shm', async (req, res) => {
    try {
        const contract = await getContract();
        await submitWithRetry(contract, 'createSHM', JSON.stringify(req.body));
        res.json({
            error: false,
            message: "SHM berhasil dibuat",
            total_data: 1,
            data: req.body
        });
    } catch (err) {
        res.status(500).json({
            error: true,
            message: err.details[0].message|| err.message,
            total_data: 0,
            data: null
        });
    }
});

app.put('/api/shm/balik-nama', async (req, res) => {
    const { nomorSertifikat, namaPemilikBaru, nikPemilikBaru } = req.body;
    try {
        const contract = await getContract();
        await submitWithRetry(contract, 'balikNama', nomorSertifikat, namaPemilikBaru, nikPemilikBaru);
        res.json({
            error: false,
            message: "Balik nama berhasil",
            total_data: 1,
            data: { nomorSertifikat, namaPemilikBaru, nikPemilikBaru }
        });
    } catch (err) {
        res.status(500).json({
            error: true,
            message: err.message,
            total_data: 0,
            data: null
        });
    }
});

app.put('/api/shm/batal', async (req, res) => {
    const { nomorSertifikat, alasan } = req.body;
    try {
        const contract = await getContract();
        await submitWithRetry(contract, 'batalkanSHM', nomorSertifikat, alasan);
        res.json({
            error: false,
            message: "SHM dibatalkan",
            total_data: 1,
            data: { nomorSertifikat, alasan }
        });
    } catch (err) {
        res.status(500).json({
            error: true,
            message: err.message,
            total_data: 0,
            data: null
        });
    }
});

// ▶️ Jalankan server
const PORT = process.env.PORT || 31914;
app.listen(PORT, () => {
    console.log(`✅ API Gateway running at http://localhost:${PORT}`);
});
