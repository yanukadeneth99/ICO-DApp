//SPDX-License-Identifier:MIT
pragma solidity ^0.8.9;

interface IMemeNft {
    function tokenOfOwnerByIndex(address owner, uint256 index)
        external
        view
        returns (uint256 tokenId);

    function balanceOf(address owner) external view returns (uint256 balance);
}
