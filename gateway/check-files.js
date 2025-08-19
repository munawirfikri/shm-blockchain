#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define paths to check
const networkPath = path.resolve(__dirname, '../network');
const cryptoPath = path.resolve(networkPath, 'organizations/peerOrganizations/org1.example.com');
const tlsCertPath = path.resolve(cryptoPath, 'peers/peer0.org1.example.com/tls/ca.crt');

async function checkFiles() {
  console.log('Checking Hyperledger Fabric network files...');
  
  try {
    // Check if network directory exists
    await fs.access(networkPath);
    console.log(`✅ Network directory exists: ${networkPath}`);
    
    // Check if crypto materials directory exists
    await fs.access(cryptoPath);
    console.log(`✅ Crypto materials directory exists: ${cryptoPath}`);
    
    // Check if TLS certificate exists
    await fs.access(tlsCertPath);
    console.log(`✅ TLS certificate exists: ${tlsCertPath}`);
    
    console.log('All required files exist. Network setup appears correct.');
    return true;
  } catch (error) {
    console.error('❌ Network files check failed:');
    console.error(error.message);
    
    console.log('\nPlease ensure the Hyperledger Fabric network is set up correctly:');
    console.log('1. Make sure the network is running: cd ../network && ./network.sh up createChannel -c mychannel -ca');
    console.log('2. Make sure the chaincode is deployed: cd ../network && ./network.sh deployCC -ccn shm -ccp ../chaincode');
    console.log('3. Check that the crypto materials are generated in the correct location');
    
    return false;
  }
}

// Run the check
checkFiles().then(success => {
  process.exit(success ? 0 : 1);
});