// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract PurchaseNFT is ERC721, Ownable {
    uint256 public tokenCounter;

    constructor() ERC721("Local Purchase NFT", "LPN") {
        tokenCounter = 0;
    }

    function mintNFT(address user) public onlyOwner {
        _safeMint(user, tokenCounter);
        tokenCounter++;
    }
}