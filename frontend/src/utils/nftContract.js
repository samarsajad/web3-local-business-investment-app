import { ethers } from "ethers";
import NFT from "../abis/PurchaseNFT.json";

const CONTRACT_ADDRESS = process.env.REACT_APP_NFT_ADDRESS;

export const getNFTContract = async () => {
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();

  return new ethers.Contract(CONTRACT_ADDRESS, NFT.abi, signer);
};