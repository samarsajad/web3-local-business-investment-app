// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract PurchaseNFT is ERC721, Ownable {
    uint256 public tokenCounter;
    mapping(address => bool) public minters;

    constructor() ERC721("Local Purchase NFT", "LPN") {
        tokenCounter = 0;
        minters[msg.sender] = true;
    }

    function addMinter(address _minter) public onlyOwner {
        minters[_minter] = true;
    }

    function removeMinter(address _minter) public onlyOwner {
        minters[_minter] = false;
    }

    function mintNFT(address user) public {
        require(minters[msg.sender], "Only minters can call mintNFT");
        _safeMint(user, tokenCounter);
        tokenCounter++;
    }
}