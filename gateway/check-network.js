import { execSync } from 'child_process';

console.log('🔍 Checking Fabric network status...');

try {
    // Check if Docker containers are running
    const containers = execSync('docker ps --format "table {{.Names}}\\t{{.Status}}"', { encoding: 'utf8' });
    console.log('\n📦 Docker containers:');
    console.log(containers);
    
    // Check if peer is accessible
    const peerCheck = execSync('docker exec peer0.org1.example.com peer version', { encoding: 'utf8' });
    console.log('\n✅ Peer is accessible');
    
    // Check channel
    const channelCheck = execSync('docker exec peer0.org1.example.com peer channel list', { encoding: 'utf8' });
    console.log('\n📋 Channels:');
    console.log(channelCheck);
    
} catch (error) {
    console.error('❌ Network check failed:', error.message);
    console.log('\n🔧 Try running: cd network && ./network.sh up createChannel -ca');
}