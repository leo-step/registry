import { prisma } from "./db.server";
import { ethers } from "ethers";
import { NodeEntry, NodeStatus, NodeType } from "@prisma/client";
import { NodeRegistry__factory } from "@palette-labs/registry-contracts";
import {cellToBoundary, latLngToCell} from "h3-js";

const batchSize = process.env.BATCH_SIZE ? Number(process.env.BATCH_SIZE) : 2000;
const requestDelay = process.env.REQUEST_DELAY ? Number(process.env.REQUEST_DELAY) : 0;

export const CHAIN_ID = Number(process.env.CHAIN_ID);
if (!CHAIN_ID) {
  throw new Error("No chain ID specified");
}

export type ChainConfig = {
  chainId: number;
  chainName: string;
  version: string;
  contractAddress: string;
  etherscanURL: string;
  subdomain: string;
  contractStartBlock: number;
  rpcProvider: string;
};


export const EAS_CHAIN_CONFIGS: ChainConfig[] = [
  {
    chainId: 84532,
    chainName: "base-sepolia",
    subdomain: "base-sepolia.",
    version: "1.2.0",
    contractAddress: "0x56e3B524302Ec60Ec7850aF492D079367E03e5fb",
    contractStartBlock: 5789193,
    etherscanURL: "https://sepolia.basescan.org/",
    rpcProvider: `https://sepolia.base.org`,
  },
]

export const activeChainConfig = EAS_CHAIN_CONFIGS.find(
  (config) => config.chainId === CHAIN_ID
);

if (!activeChainConfig || !activeChainConfig.contractAddress) {
  throw new Error("No chain config found for chain ID");
}

export const provider = new ethers.JsonRpcProvider(
  activeChainConfig.rpcProvider,
  activeChainConfig.chainId
);


export const contractAddress = activeChainConfig.contractAddress;
export const CONTRACT_START_BLOCK = activeChainConfig.contractStartBlock;

// Timeout Promise
function timeout(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const nodeRegistry = NodeRegistry__factory.connect(activeChainConfig.contractAddress, provider);

function translateToNodeType(value: number): NodeType | undefined {
  const mapping: { [key: number]: NodeType } = {
      0: NodeType.PSN,
      1: NodeType.BSN,
      2: NodeType.GP
  };

  return mapping[value];
}

// Function to translate raw numeric values to NodeStatus enum strings
function translateToNodeStatus(value: number): keyof typeof NodeStatus | undefined {
  const mapping: { [key: number]: keyof typeof NodeStatus } = {
      0: 'INITIATED',
      1: 'VERIFIED',
      2: 'INVALID'
  };

  return mapping[value];
}


/* Leo and Stephen Contribution: 
 We are just adding boilerplate code in order to arbitrarily put some locations within our database, we have yet to parse the actual databases in order to do so 
*/

const locations = [['CS building', 40.3499433, -74.65227, "http://localhost:3002/"], 
                ['plainsboro township', 40.354250, -74.606386, "http://localhost:3003/"], 
                ['lawrenceville', 40.298865, -74.736349, "http://localhost:3001/"], 
                ['colo', 40.349619,-74.6540515, "http://localhost:3004/"], 
                ['new brunswick', 40.490150, -74.443452, "http://localhost:3005/"]];

let index = 0;

// converts the h3Index to a polygonString 
function makePolygonString(h3Index: string) {
  const points = cellToBoundary(h3Index); 

  var polygonStringParts: string[] = []
  for (let i = 0; i < points.length; i++) {
    const lat = points[i][0], long = points[i][1];
    const pointString = lat + " " + long;
    polygonStringParts.push(pointString)
  }

  const lat = points[0][0], long = points[0][1]; // need first point to complete polygon
  const pointString = lat + " " + long;
  polygonStringParts.push(pointString)
  const polygonString: string = "POLYGON((" + polygonStringParts.join(",") + "))"
  return polygonString
}

async function fetchAndParseRegisteredEvents(startBlock: number, endBlock: number): Promise<NodeEntry[]> {
  console.log(`Querying from ${startBlock} to ${endBlock}`); // Log the block range for confirmation

  const filter = nodeRegistry.filters.Registered();
  const events = await nodeRegistry.queryFilter(filter, startBlock, endBlock);

  if (events.length === 0) {
      console.log(`No events found in the specified range. ${startBlock}, ${endBlock}`);
      return [];
  }
  
  return events.map(event => {
      const { uid, name, callbackUrl, location, industryCode, owner, nodeType, status } = event.args[2];

      // TEST CODE: Conversation of location[index 0] to the h3index 
      const testLocation = locations[index];
      const testName: string = (testLocation[0] as string)
      const newCallbackUrl: string = (testLocation[3] as string);
      const h3Index = latLngToCell((testLocation[1] as number), (testLocation[2] as number), 7); // h3Index is the hexagon index 

      index += 1 // hacky way of indexing a global index 


      // TODO: right now, we only use the first hexagon to define the polygon for a PSN
      const polygonString: string = makePolygonString(h3Index) 

      return { // should be name instead of test location here
          uid, name: testName, callbackUrl: newCallbackUrl, location, industryCode, owner,
          nodeType: translateToNodeType(Number(nodeType)) || 'PSN', 
          status: translateToNodeStatus(Number(status)) || 'INITIATED', // TODO: improve logic.
          polygonString: polygonString
      };
  });
}


export async function getAndUpdateAllRelevantLogs() {
  const serviceStatPropertyName = "latestNodeEntryBlockNum";
  const { fromBlock } = await getStartData(serviceStatPropertyName);
  let currentBlock = fromBlock + 1;
  const latestBlock = await provider.getBlockNumber();

  while (currentBlock <= latestBlock) {
    const toBlock = Math.min(currentBlock + batchSize - 1, latestBlock);

    const nodeEntries = await fetchAndParseRegisteredEvents(currentBlock, toBlock);

    for (const node of nodeEntries) {
      await processRegisteredNode(node);
      await timeout(requestDelay);
    }

    await updateServiceStatToLastBlock(false, serviceStatPropertyName, toBlock);
    currentBlock += batchSize;
    await timeout(requestDelay);
  }

  console.log("Finished updating all relevant logs.");
}


/* connecting to docker container commands:

docker container exec -it registry-postgres bash
psql -U admin -d registry
\d "NodeEntry"



                        Table "public.NodeEntry"
      Column    |         Type         | Collation | Nullable | Default 
  --------------+----------------------+-----------+----------+---------
  uid          | text                 |           | not null | 
  name         | text                 |           | not null | 
  callbackUrl  | text                 |           | not null | 
  location     | text[]               |           |          | 
  industryCode | text                 |           | not null | 
  owner        | text                 |           | not null | 
  nodeType     | "NodeType"           |           | not null | 
  status       | "NodeStatus"         |           | not null | 
  coords       | geometry(Point,4326) |           | not null |
*/


// Example processing function for 'Registered' logs
async function processRegisteredNode(node: NodeEntry) {

    const createNodeEntry = async (data: any) => {
      const { uid, name, callbackUrl, location, industryCode, owner, nodeType, status, polygonString } = data;
      
      // TODO: using executeRawUnsafe which could have SQL injection, needs safer workaround for Prisma
      const result = await prisma.$executeRawUnsafe(
        'INSERT INTO "NodeEntry" ("uid", "name", "callbackUrl", "location", "industryCode", "owner", "nodeType", "status", "coords") ' +
        `VALUES ($1, $2, $3, $4, $5, $6, $7::"NodeType", $8::"NodeStatus", ST_PolygonFromText('${polygonString}', 4326));`,
        uid, name, callbackUrl, location, industryCode, owner, nodeType, status
      );
      
      return result;
    };

    try {
      const result = await createNodeEntry(node);
      console.log('Node entry created:', result);
    } catch (error) {
      console.error('Error creating node entry:', error);
    }
}

export async function updateServiceStatToLastBlock(
  shouldCreate: boolean,
  serviceStatPropertyName: string,
  lastBlock: number
) {

  const existing = await prisma.serviceStat.findFirst({
    where: { name: serviceStatPropertyName },
  });

  if (!existing || shouldCreate) {
    await prisma.serviceStat.create({
      data: { name: serviceStatPropertyName, value: lastBlock.toString() },
    });
  } else {
    if (lastBlock !== 0) {
      await prisma.serviceStat.update({
        where: { name: serviceStatPropertyName },
        data: { value: lastBlock.toString() },
      });
    }
  }
}

async function getStartData(serviceStatPropertyName: string) {
    const latestBlockNumServiceStat = await prisma.serviceStat.findFirst({
      where: { name: serviceStatPropertyName },
    });
  
    let fromBlock: number = CONTRACT_START_BLOCK;
  
    if (latestBlockNumServiceStat?.value) {
      fromBlock = Number(latestBlockNumServiceStat.value);
    }
  
    if (fromBlock === 0) {
      fromBlock = CONTRACT_START_BLOCK;
    }
  
    return { latestBlockNumServiceStat, fromBlock };
  }
