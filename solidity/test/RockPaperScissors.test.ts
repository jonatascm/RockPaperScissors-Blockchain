/* eslint-disable no-unused-vars */
import {
  RockPaperScissors,
  RockPaperScissors__factory,
  TestToken,
  TestToken__factory,
} from "../typechain";

import { ethers } from "hardhat";
import chai from "chai";
import { solidity } from "ethereum-waffle";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

chai.use(solidity);
const { expect } = chai;

enum PlayType {
  rock,
  paper,
  scissors,
}

enum MatchResult {
  win,
  loss,
  draw,
}

describe("RockPaperScissors", function () {
  let rockPaperScissors: RockPaperScissors;
  let testToken: TestToken;
  let owner: SignerWithAddress;
  let addr1: SignerWithAddress;
  let addr2: SignerWithAddress;
  const rockNumber: number = PlayType.rock;
  const paperNumber: number = PlayType.paper;
  const scissorsNumber: number = PlayType.scissors;

  this.beforeEach(async () => {
    const testTokenFactory = (await ethers.getContractFactory(
      "TestToken"
    )) as TestToken__factory;
    const totalSupply = (10 ** 18).toString();
    testToken = await testTokenFactory.deploy(
      ethers.utils.parseEther(totalSupply)
    );
    await testToken.deployed();
    const tokenAddress = testToken.address;

    const rockPaperScissorsFactory = (await ethers.getContractFactory(
      "RockPaperScissors"
    )) as RockPaperScissors__factory;
    rockPaperScissors = await rockPaperScissorsFactory.deploy(tokenAddress, 20);

    [owner, addr1, addr2] = await ethers.getSigners();

    await testToken.transfer(addr1.address, 1000);
    await testToken.transfer(addr2.address, 1000);
  });

  describe("Deployment", () => {
    it("Should addr1 and addr2 have fixed amount", async () => {
      expect(await testToken.balanceOf(addr1.address)).to.equal(1000);
      expect(await testToken.balanceOf(addr2.address)).to.equal(1000);
    });
  });

  describe("Game Logic", () => {
    it("Should win all of this cases", async () => {
      let result = await rockPaperScissors.gameLogic(
        rockNumber,
        scissorsNumber
      );
      expect(result).to.equal(MatchResult.win);

      result = await rockPaperScissors.gameLogic(paperNumber, rockNumber);
      expect(result).to.equal(MatchResult.win);

      result = await rockPaperScissors.gameLogic(scissorsNumber, paperNumber);
      expect(result).to.equal(MatchResult.win);
    });

    it("Should loss all of this cases", async () => {
      let result = await rockPaperScissors.gameLogic(rockNumber, paperNumber);
      expect(result).to.equal(MatchResult.loss);

      result = await rockPaperScissors.gameLogic(paperNumber, scissorsNumber);
      expect(result).to.equal(MatchResult.loss);

      result = await rockPaperScissors.gameLogic(scissorsNumber, rockNumber);
      expect(result).to.equal(MatchResult.loss);
    });

    it("Should draw all of this cases", async () => {
      let result = await rockPaperScissors.gameLogic(rockNumber, rockNumber);
      expect(result).to.equal(MatchResult.draw);

      result = await rockPaperScissors.gameLogic(paperNumber, paperNumber);
      expect(result).to.equal(MatchResult.draw);

      result = await rockPaperScissors.gameLogic(
        scissorsNumber,
        scissorsNumber
      );
      expect(result).to.equal(MatchResult.draw);
    });

    it("Should faild if inserted invalid value", async () => {
      const invalidNumber = 5;
      await expect(
        rockPaperScissors.gameLogic(rockNumber, invalidNumber)
      ).to.be.revertedWith("function was called with incorrect parameters");
    });
  });

  describe("Betting", () => {
    it("Should bet 50 token in rock and players should be 1", async () => {
      await testToken.connect(addr1).approve(rockPaperScissors.address, 50);

      const initalBalance = await testToken.balanceOf(addr1.address);
      await rockPaperScissors.connect(addr1).bet(50, rockNumber);
      const finalBalance = await testToken.balanceOf(addr1.address);
      const players = await rockPaperScissors.getPlayers();
      expect(players.length).to.equal(1);
      expect(finalBalance.toNumber()).to.equal(initalBalance.toNumber() - 50);
    });

    it("Should increase simultaneos bets", async () => {
      const initialBets = await rockPaperScissors.currentSimultaneousBets();
      await testToken.connect(addr1).approve(rockPaperScissors.address, 50);
      await rockPaperScissors.connect(addr1).bet(50, rockNumber);
      const finalBets = await rockPaperScissors.currentSimultaneousBets();

      expect(finalBets.toNumber()).to.equal(initialBets.toNumber() + 1);
    });

    it("Should fail if you try to make 2 bets", async () => {
      await testToken.connect(addr1).approve(rockPaperScissors.address, 100);
      await rockPaperScissors.connect(addr1).bet(50, rockNumber);

      await expect(
        rockPaperScissors.connect(addr1).bet(50, rockNumber)
      ).to.be.revertedWith(
        "You need to wait your bet finish before betting again"
      );
    });

    it("Should fail if amount is zero", async () => {
      await testToken.connect(addr1).approve(rockPaperScissors.address, 100);
      await expect(
        rockPaperScissors.connect(addr1).bet(0, rockNumber)
      ).to.be.revertedWith("You need to bet at least some tokens");
    });

    it("Should fail if the user not enable the allowance", async () => {
      await expect(
        rockPaperScissors.connect(addr1).bet(10, rockNumber)
      ).to.be.revertedWith("Check the token allowance");
    });
  });

  describe("Battle", () => {
    it("Should win the battle", async () => {
      await testToken.connect(addr1).approve(rockPaperScissors.address, 50);
      await rockPaperScissors.connect(addr1).bet(50, rockNumber);
      const battleAmount = await rockPaperScissors.getBattleAmount(
        addr1.address
      );

      await testToken
        .connect(addr2)
        .approve(rockPaperScissors.address, battleAmount);

      const initalBalance = await testToken.balanceOf(addr2.address);
      await rockPaperScissors.connect(addr2).battle(addr1.address, paperNumber);

      const finalPlayers = await rockPaperScissors.getPlayers();
      expect(finalPlayers.length).to.equal(0);

      const finalBalance = await testToken.balanceOf(addr2.address);
      expect(finalBalance.toNumber()).greaterThan(initalBalance.toNumber());
    });

    it("Should loss the battle", async () => {
      await testToken.connect(addr1).approve(rockPaperScissors.address, 50);
      await rockPaperScissors.connect(addr1).bet(50, rockNumber);
      const battleAmount = await rockPaperScissors.getBattleAmount(
        addr1.address
      );

      await testToken
        .connect(addr2)
        .approve(rockPaperScissors.address, battleAmount);

      const initalBalance = await testToken.balanceOf(addr2.address);
      await rockPaperScissors
        .connect(addr2)
        .battle(addr1.address, scissorsNumber);

      const finalBalance = await testToken.balanceOf(addr2.address);
      expect(finalBalance.toNumber()).lessThan(initalBalance.toNumber());
    });

    it("Should pay fee and draw the battle", async () => {
      const fee = await rockPaperScissors.getGameFee(1000);
      await testToken.connect(addr1).approve(rockPaperScissors.address, 1000);
      await rockPaperScissors.connect(addr1).bet(1000, paperNumber);
      const battleAmount = await rockPaperScissors.getBattleAmount(
        addr1.address
      );

      await testToken
        .connect(addr2)
        .approve(rockPaperScissors.address, battleAmount);

      const initalBalance = await testToken.balanceOf(addr2.address);
      await rockPaperScissors.connect(addr2).battle(addr1.address, paperNumber);
      const finalBalance = await testToken.balanceOf(addr2.address);
      const acumulatedFee = await rockPaperScissors.acumulatedFee();

      expect(finalBalance.toNumber()).lessThan(initalBalance.toNumber());
      expect(acumulatedFee.toNumber()).to.equal(fee.toNumber());
    });

    it("Should fail if there isn't any opponent", async () => {
      await expect(
        rockPaperScissors.connect(addr1).battle(addr2.address, rockNumber)
      ).to.be.revertedWith("Invalid opponent");
    });

    it("Should fail if the user not enable the allowance", async () => {
      await testToken.connect(addr1).approve(rockPaperScissors.address, 50);
      await rockPaperScissors.connect(addr1).bet(50, rockNumber);

      await expect(
        rockPaperScissors.connect(addr2).battle(addr1.address, rockNumber)
      ).to.be.revertedWith("Check the token allowance");
    });
  });

  describe("Widthdraw Fee", () => {
    it("Should withdraw amount of fee", async () => {
      await testToken.connect(addr1).approve(rockPaperScissors.address, 1000);
      await rockPaperScissors.connect(addr1).bet(1000, rockNumber);
      const battleAmount = await rockPaperScissors.getBattleAmount(
        addr1.address
      );
      await testToken
        .connect(addr2)
        .approve(rockPaperScissors.address, battleAmount);
      await rockPaperScissors.connect(addr2).battle(addr1.address, paperNumber);

      const acumulatedFee = await rockPaperScissors.acumulatedFee();
      const initalBalance = await testToken.balanceOf(owner.address);
      await rockPaperScissors.withdrawFee();
      const finalBalance = await testToken.balanceOf(owner.address);

      expect(finalBalance).to.equal(initalBalance.add(acumulatedFee));
      expect(await rockPaperScissors.acumulatedFee()).to.equal(0);
    });
  });
});
