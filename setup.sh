#!/bin/bash

# Script to set up the Hyperledger Fabric network for SHM application

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Setting up Hyperledger Fabric network for SHM application...${NC}"

# Check if we're in the right directory
if [ ! -d "./gateway" ] || [ ! -d "./network" ] || [ ! -d "./chaincode" ]; then
  echo -e "${RED}Error: Please run this script from the root directory of the SHM project${NC}"
  exit 1
fi

# Check if network is already running
if [ -d "./network/organizations/peerOrganizations" ]; then
  echo -e "${YELLOW}Network appears to be already set up. Checking if it's running...${NC}"
  
  # Try to check if docker containers are running
  if command -v docker &> /dev/null; then
    CONTAINERS=$(docker ps | grep fabric-peer)
    if [ ! -z "$CONTAINERS" ]; then
      echo -e "${GREEN}Fabric network is running.${NC}"
    else
      echo -e "${YELLOW}Fabric containers not found. Starting network...${NC}"
      cd network
      ./network.sh up createChannel -c mychannel -ca
      cd ..
    fi
  else
    echo -e "${YELLOW}Docker not found. Cannot check if network is running.${NC}"
  fi
else
  echo -e "${YELLOW}Setting up new network...${NC}"
  cd network
  ./network.sh up createChannel -c mychannel -ca
  cd ..
fi

# Deploy chaincode
echo -e "${YELLOW}Deploying SHM chaincode...${NC}"
cd network
./network.sh deployCC -ccn shm -ccp ../chaincode
cd ..

echo -e "${GREEN}Network setup complete!${NC}"
echo -e "${YELLOW}Starting gateway application...${NC}"

# Start the gateway application
cd gateway
npm start

exit 0