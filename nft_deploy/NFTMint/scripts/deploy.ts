import { KeyPair, mnemonicToPrivateKey, mnemonicToWalletKey } from "ton-crypto";
import {
  beginCell,
  Cell,
  OpenedContract,
  TonClient,
  WalletContractV3R2,
  WalletContractV4,
  StateInit,
  internal,
  SendMode,
  contractAddress,
  Address
} from "ton";
import { getHttpEndpoint } from "@orbs-network/ton-access";
import PinataClient from "@pinata/sdk";

const toncenterBaseEndpoint: string = "https://testnet.toncenter.com"

const PINATA_API_KEY =  "d11a1d80064eee2c8549"
const PINATA_API_SECRET =  "ea5de5db8fb29f05340c68b914af8cfd1dd98165c0b2a1623c67665be960733c"
const MNEMONIC = `
battle alter verify stuff mention sock snack harvest 
left digital donate elegant wrist office priority name 
expand panic flock seed weapon describe hidden again
`.trim().split(/\s+/);

const TONCENTER_API_KEY = "aa4a1d5c3003e4ca123ad6c4891c3a3dacf2860b8b2a50f612a99807013d248a"

const NFT_METADATA = {
  'name':"BIGRu",
  'description':'The cutest girl in da block',
  "image":"https://instagram.fbeg2-1.fna.fbcdn.net/v/t51.29350-15/443264627_770337321833677_9182716737269294678_n.jpg?stp=dst-jpg_e35&efg=eyJ2ZW5jb2RlX3RhZyI6ImltYWdlX3VybGdlbi4xNDQweDE4MDAuc2RyLmYyOTM1MC5kZWZhdWx0X2ltYWdlIn0&_nc_ht=instagram.fbeg2-1.fna.fbcdn.net&_nc_cat=101&_nc_ohc=A-QT8Ibl-DMQ7kNvgGiZv5G&_nc_gid=21342356266b466e8b167c2243bc3f1f&edm=AP4sbd4BAAAA&ccb=7-5&ig_cache_key=MzM2NzYwNTg3MDU4MzMyNDk2NQ%3D%3D.3-ccb7-5&oh=00_AYDDgo2mphlTtAfgnpPFjVdBDXVxALwAZYAyxnanpRvb9w&oe=67197726&_nc_sid=7a9f4b"
}
function bufferToChunks(buff: Buffer, chunkSize: number) {
  const chunks: Buffer[] = [];
  while (buff.byteLength > 0) {
    chunks.push(buff.subarray(0, chunkSize));
    buff = buff.subarray(chunkSize);
  }
  return chunks;
}
function makeSnakeCell(data: Buffer): Cell {
  const chunks = bufferToChunks(data, 127);

  if (chunks.length === 0) {
    return beginCell().endCell();
  }

  if (chunks.length === 1) {
    return beginCell().storeBuffer(chunks[0]).endCell();
  }

  let curCell = beginCell();

  for (let i = chunks.length - 1; i >= 0; i--) {
    const chunk = chunks[i];

    curCell.storeBuffer(chunk);

    if (i - 1 >= 0) {
      const nextCell = beginCell();
      nextCell.storeRef(curCell);
      curCell = nextCell;
    }
  }

  return curCell.endCell();
}

export type collectionData = {
  ownerAddress: Address;
  royaltyPercent: number;
  royaltyAddress: Address;
  nextItemIndex: number;
  collectionContentUrl: string;
  commonContentUrl: string;
}

export function encodeOffChainContent(content: string) {
  let data = Buffer.from(content);
  const offChainPrefix = Buffer.from([0x01]);
  data = Buffer.concat([offChainPrefix, data]);
  return makeSnakeCell(data);
}
async function uploadNFToIPFS(){
  var data = new PinataClient({
    pinataApiKey:PINATA_API_KEY,
    pinataSecretApiKey:PINATA_API_SECRET
  })

  var resp = await data.pinJSONToIPFS(NFT_METADATA)

  return resp.IpfsHash
}

export type WalletDict={
  contract:OpenedContract<WalletContractV3R2>;
  keyPair: KeyPair;
}

export class NftCollection {
  private collectionData: collectionData;

  constructor(collectionData: collectionData) {
    this.collectionData = collectionData;
  }

  private createCodeCell(): Cell {
    const NftCollectionCodeBoc =
      "te6cckECFAEAAh8AART/APSkE/S88sgLAQIBYgkCAgEgBAMAJbyC32omh9IGmf6mpqGC3oahgsQCASAIBQIBIAcGAC209H2omh9IGmf6mpqGAovgngCOAD4AsAAvtdr9qJofSBpn+pqahg2IOhph+mH/SAYQAEO4tdMe1E0PpA0z/U1NQwECRfBNDUMdQw0HHIywcBzxbMyYAgLNDwoCASAMCwA9Ra8ARwIfAFd4AYyMsFWM8WUAT6AhPLaxLMzMlx+wCAIBIA4NABs+QB0yMsCEsoHy//J0IAAtAHIyz/4KM8WyXAgyMsBE/QA9ADLAMmAE59EGOASK3wAOhpgYC42Eit8H0gGADpj+mf9qJofSBpn+pqahhBCDSenKgpQF1HFBuvgoDoQQhUZYBWuEAIZGWCqALnixJ9AQpltQnlj+WfgOeLZMAgfYBwGyi544L5cMiS4ADxgRLgAXGBEuAB8YEYGYHgAkExIREAA8jhXU1DAQNEEwyFAFzxYTyz/MzMzJ7VTgXwSED/LwACwyNAH6QDBBRMhQBc8WE8s/zMzMye1UAKY1cAPUMI43gED0lm+lII4pBqQggQD6vpPywY/egQGTIaBTJbvy9AL6ANQwIlRLMPAGI7qTAqQC3gSSbCHis+YwMlBEQxPIUAXPFhPLP8zMzMntVABgNQLTP1MTu/LhklMTugH6ANQwKBA0WfAGjhIBpENDyFAFzxYTyz/MzMzJ7VSSXwXiN0CayQ==";
    return Cell.fromBase64(NftCollectionCodeBoc);
  }
  private createDataCell(): Cell {
          const data = this.collectionData;
          const dataCell = beginCell();
        
          dataCell.storeAddress(data.ownerAddress);
          dataCell.storeUint(data.nextItemIndex, 64);
          const contentCell = beginCell();

      const collectionContent = encodeOffChainContent(data.collectionContentUrl);

      const commonContent = beginCell();
      commonContent.storeBuffer(Buffer.from(data.commonContentUrl));

      contentCell.storeRef(collectionContent);
      contentCell.storeRef(commonContent.asCell());
      dataCell.storeRef(contentCell);
      const NftItemCodeCell = Cell.fromBase64(
        "te6cckECDQEAAdAAART/APSkE/S88sgLAQIBYgMCAAmhH5/gBQICzgcEAgEgBgUAHQDyMs/WM8WAc8WzMntVIAA7O1E0NM/+kAg10nCAJp/AfpA1DAQJBAj4DBwWW1tgAgEgCQgAET6RDBwuvLhTYALXDIhxwCSXwPg0NMDAXGwkl8D4PpA+kAx+gAxcdch+gAx+gAw8AIEs44UMGwiNFIyxwXy4ZUB+kDUMBAj8APgBtMf0z+CEF/MPRRSMLqOhzIQN14yQBPgMDQ0NTWCEC/LJqISuuMCXwSED/LwgCwoAcnCCEIt3FzUFyMv/UATPFhAkgEBwgBDIywVQB88WUAX6AhXLahLLH8s/Im6zlFjPFwGRMuIByQH7AAH2UTXHBfLhkfpAIfAB+kDSADH6AIIK+vCAG6EhlFMVoKHeItcLAcMAIJIGoZE24iDC//LhkiGOPoIQBRONkchQCc8WUAvPFnEkSRRURqBwgBDIywVQB88WUAX6AhXLahLLH8s/Im6zlFjPFwGRMuIByQH7ABBHlBAqN1viDACCAo41JvABghDVMnbbEDdEAG1xcIAQyMsFUAfPFlAF+gIVy2oSyx/LPyJus5RYzxcBkTLiAckB+wCTMDI04lUC8ANqhGIu"
      );
      dataCell.storeRef(NftItemCodeCell);
      const royaltyBase = 1000;
const royaltyFactor = Math.floor(data.royaltyPercent * royaltyBase);
const royaltyCell = beginCell();
royaltyCell.storeUint(royaltyFactor, 16);
royaltyCell.storeUint(royaltyBase, 16);
royaltyCell.storeAddress(data.royaltyAddress);
dataCell.storeRef(royaltyCell);

return dataCell.endCell();
    }
    public get stateInit(): StateInit {
      const code = this.createCodeCell();
      const data = this.createDataCell();
    
      return { code, data };
    }
    public get address(): Address {
      return contractAddress(0, this.stateInit);
    }
    public async deploy(wallet: WalletDict) {
      const seqno = await wallet.contract.getSeqno();
      await wallet.contract.sendTransfer({
        seqno,
        secretKey: wallet.keyPair.secretKey,
        messages: [
          internal({
            value: "0.05",
            to: this.address,
            init: this.stateInit,
          }),
        ],
        sendMode: SendMode.PAY_GAS_SEPARATELY + SendMode.IGNORE_ERRORS,
      });
      return seqno;
    }
    public async topUpBalance(
      wallet: WalletDict,
      nftAmount: number
    ): Promise<number> {
      const feeAmount = 0.026 // approximate value of fees for 1 transaction in our case 
      const seqno = await wallet.contract.getSeqno();
      const amount = nftAmount * feeAmount;
  
      await wallet.contract.sendTransfer({
        seqno,
        secretKey: wallet.keyPair.secretKey,
        messages: [
          internal({
            value: amount.toString(),
            to: this.address.toString({ bounceable: false }),
            body: new Cell(),
          }),
        ],
        sendMode: SendMode.PAY_GAS_SEPARATELY + SendMode.IGNORE_ERRORS,
      });
  
      return seqno;
    }
}

export async function run(){

  const client = new TonClient({ endpoint:toncenterBaseEndpoint+"/api/v2/jsonRPC",
    apiKey:TONCENTER_API_KEY
   });

  const wallet_req = await mnemonicToWalletKey(MNEMONIC)
  const walletd = WalletContractV3R2.create({
    publicKey: wallet_req.publicKey,
    workchain:0
  })

  const walletContract = client.open(walletd)
  const walletSender = walletContract.sender(wallet_req.secretKey)
  var hash = await uploadNFToIPFS()

  var wallet = {
    contract:walletContract,
    keyPair:wallet_req
  }
  console.log("Start deploy of nft collection...");
  const collectionData = {
    ownerAddress: wallet.contract.address,
    royaltyPercent: 0.05, // 0.05 = 5%
    royaltyAddress: wallet.contract.address,
    nextItemIndex: 0,
    collectionContentUrl: `ipfs://${hash}`,
    commonContentUrl: `ipfs://${hash}`,
  };
  const collection = new NftCollection(collectionData);
  let seqno = await collection.deploy(wallet);
  console.log(`Collection deployed: ${collection.address}`);
  

  

}