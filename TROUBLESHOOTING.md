# SHM (Sertifikat Hak Milik) Blockchain System

## Quick Start

To set up and run the SHM blockchain system:

```bash
# Run the setup script (starts network and gateway)
./setup.sh
```

Or manually:

```bash
# Start the Hyperledger Fabric network
cd network
./network.sh up createChannel -c mychannel -ca
./network.sh deployCC -ccn shm -ccp ../chaincode

# Start the gateway API
cd ../gateway
npm start
```

## Troubleshooting "ProposalResponsePayloads do not match" Error

If you encounter the error `"ProposalResponsePayloads do not match"`, this indicates that different peers are producing different results for the same transaction proposal during endorsement.

### Solution:

1. **Check if the network is running properly**:
   ```bash
   cd gateway
   node check-files.js
   ```

2. **Restart the network** if needed:
   ```bash
   cd network
   ./network.sh down
   ./network.sh up createChannel -c mychannel -ca
   ./network.sh deployCC -ccn shm -ccp ../chaincode
   ```

3. **Use the fixed chaincode**:
   The chaincode has been updated to use deterministic timestamps from the transaction context instead of `new Date()`, which ensures consistent results across peers.

4. **Verify the API is working**:
   ```bash
   curl http://localhost:31914/api/health
   ```

## System Components

- **Chaincode**: Smart contract for SHM management
- **Network**: Hyperledger Fabric blockchain network
- **Gateway**: API for interacting with the blockchain

## API Endpoints

- `GET /api/health` - Check system health
- `GET /api/blockchain/info` - Get blockchain information
- `GET /api/shm` - Get all SHM records
- `GET /api/shm/:id` - Get specific SHM record
- `POST /api/shm` - Create new SHM record
- `PUT /api/shm/balik-nama` - Transfer SHM ownership
- `PUT /api/shm/batal` - Cancel SHM

## For More Information

See the detailed troubleshooting guide in `gateway/TROUBLESHOOTING.md`