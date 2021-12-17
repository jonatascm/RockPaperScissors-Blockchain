import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  const RockPaperScissors = await ethers.getContractFactory(
    "RockPaperScissors"
  );
  const rockPaperScissors = await RockPaperScissors.deploy(
    "0xaFF4481D10270F50f203E0763e2597776068CBc5",
    20
  );

  await rockPaperScissors.deployed();

  console.log("RockPaperScissors deployed to:", rockPaperScissors.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
