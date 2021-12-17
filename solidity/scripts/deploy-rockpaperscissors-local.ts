import { ethers } from "hardhat";

async function main() {
  const TestToken = await ethers.getContractFactory("TestToken");
  const testToken = await TestToken.deploy("1000000000000000000");
  await testToken.deployed();
  console.log("TestToken deployed to:", testToken.address);
  const RockPaperScissors = await ethers.getContractFactory(
    "RockPaperScissors"
  );
  const rockPaperScissors = await RockPaperScissors.deploy(
    testToken.address,
    20
  );
  await rockPaperScissors.deployed();

  console.log("RockPaperScissors deployed to:", rockPaperScissors.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
