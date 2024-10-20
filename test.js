const { TonClient, Address } = require('ton');
const { NFTCollection } = require('@ton-community/contract');

// Create a TonClient to connect to the TON network
const client = new TonClient({
  endpoint: 'https://testnet.toncenter.com/api/v2/jsonRPC', // Use a public TON RPC endpoint
});

// Replace with your NFT collection contract address
const nftCollectionAddress = Address.parse('EQAkneVt7fcXEOMsvwBKDLkoKbmQhoqYG-9TV4hABKx2_d6d')

async function getMintedNFTIndices() {
  try {
    // Initialize the NFT collection contract instance
    const nftCollection = NFTCollection.create(client, nftCollectionAddress);

    // Get the collection data to find the total number of NFTs minted
    const { totalSupply } = await nftCollection.getCollectionData();
    console.log(`Total minted NFTs: ${totalSupply}`);

    // Fetch the NFT indices
    let mintedIndices = [];
    for (let i = 0; i < totalSupply; i++) {
      const nftAddress = await nftCollection.getNFTAddressByIndex(i);
      mintedIndices.push(nftAddress.toString());
    }

    return mintedIndices;
  } catch (error) {
    console.error('Error fetching minted NFT indices:', error);
  }
}

// Execute the function
getMintedNFTIndices().then((indices) => {
  console.log('Minted NFT Indices:', indices);
});

