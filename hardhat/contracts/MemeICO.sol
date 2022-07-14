//SPDX-License-Identifier:MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./IMemeNft.sol";

contract MemeICO is ERC20, Ownable {
    IMemeNft imemenft;

    uint256 public constant tokensPerNFT = 10 * (10**18);
    uint256 public constant tokenPrice = 0.01 ether;
    uint256 public constant maxTotalSupply = 10000 * (10**18);

    mapping(uint256 => bool) public tokensIdsClaimed;

    constructor(address MemeContractAd) ERC20("MemeICO", "MICO") {
        imemenft = IMemeNft(MemeContractAd);
    }

    function mint(uint256 amount) public payable {
        uint256 _requiredAmount = tokenPrice * amount;
        require(msg.value >= _requiredAmount, "Insufficient funds!");
        uint256 amountWithDecimals = amount * 10**18;
        require(
            (totalSupply() + amountWithDecimals) <= maxTotalSupply,
            "Exceeds the max total tokens"
        );
        _mint(msg.sender, amountWithDecimals);
    }

    function claim() public {
        uint256 balance = imemenft.balanceOf(msg.sender);
        require(balance > 0, "You dont' own any NFTs");
        uint256 amount = 0;

        for (uint256 i = 0; i < balance; i++) {
            uint256 tokenId = imemenft.tokenOfOwnerByIndex(msg.sender, i);
            if (!tokensIdsClaimed[tokenId]) {
                amount++;
                tokensIdsClaimed[tokenId] = true;
            }
        }

        require(amount > 0, "You have already claimed tokens for the NFTs");
        _mint(msg.sender, amount * tokensPerNFT);
    }

    function withdraw() public onlyOwner {
        address _owner = owner();
        uint256 amount = address(this).balance;
        (bool sent, ) = _owner.call{value: amount}("");
        require(sent, "Failed to send Ether");
    }

    receive() external payable {}

    fallback() external payable {}
}
