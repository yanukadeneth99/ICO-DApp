import { ethers } from "hardhat";
import { MEMENFTCOL_ADDRESS } from "../constants/index";

async function main() {
  const MemeICO = await ethers.getContractFactory("MemeICO");
  const memeico = await MemeICO.deploy(MEMENFTCOL_ADDRESS);

  await memeico.deployed();

  console.log("Meme ICO Deployed to :", memeico.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
