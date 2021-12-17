//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "hardhat/console.sol";

contract RockPaperScissors is Ownable {
    using SafeMath for uint256;
    enum PlayType {
        rock,
        paper,
        scissors
    }

    enum MatchResult {
        win,
        loss,
        draw
    }

    struct Bet {
        uint256 amount;
        PlayType play;
    }

    mapping(address => Bet) private playersBetting;
    address[] public players;
    uint256 public maxSimultaneousBets;
    MatchResult[3][3] public matchResult;
    IERC20 public token;
    uint256 public acumulatedFee = 0;

    event BetEvent(address from, uint256 amount, PlayType play);
    event PlayAgainstEvent(
        address player,
        address opponent,
        MatchResult result
    );
    event WidthdrawFee(address owner, uint256 amount);

    constructor(address _token, uint256 _maxBets) {
        token = IERC20(_token);
        maxSimultaneousBets = _maxBets;
        createGameLogic();
    }

    function createGameLogic() internal {
        uint8 rockInt = uint8(PlayType.rock);
        uint8 paperInt = uint8(PlayType.paper);
        uint8 scissorsInt = uint8(PlayType.scissors);
        matchResult[rockInt][rockInt] = MatchResult.draw;
        matchResult[rockInt][paperInt] = MatchResult.loss;
        matchResult[rockInt][scissorsInt] = MatchResult.win;
        matchResult[paperInt][rockInt] = MatchResult.win;
        matchResult[paperInt][paperInt] = MatchResult.draw;
        matchResult[paperInt][scissorsInt] = MatchResult.loss;
        matchResult[scissorsInt][rockInt] = MatchResult.loss;
        matchResult[scissorsInt][paperInt] = MatchResult.win;
        matchResult[scissorsInt][scissorsInt] = MatchResult.draw;
    }

    function bet(uint256 _amount, PlayType _play) public {
        require(
            players.length < maxSimultaneousBets,
            "Maximum simultaneous bets exceeded"
        );
        require(
            playersBetting[msg.sender].amount == 0,
            "You need to wait your bet finish before betting again"
        );
        require(_amount > 0, "You need to bet at least some tokens");
        uint256 allowance = token.allowance(msg.sender, address(this));
        require(allowance >= _amount, "Check the token allowance");

        Bet memory playerBet = Bet(_amount, _play);
        token.transferFrom(msg.sender, address(this), _amount);
        playersBetting[msg.sender] = playerBet;
        players.push(msg.sender);
        emit BetEvent(msg.sender, _amount, _play);
    }

    function getGameFee(uint256 _amount) public pure returns (uint256) {
        return _amount.div(1000);
    }

    function add(uint256 a, uint256 b) internal pure returns (uint256) {
        uint256 c = a + b;
        require(c >= a, "SafeMath: addition overflow");

        return c;
    }

    function getBattleAmount(address _opponent) public view returns (uint256) {
        return playersBetting[_opponent].amount;
    }

    function battle(address _opponent, PlayType _play) public {
        Bet memory opponentBet = playersBetting[_opponent];
        uint256 _amount = opponentBet.amount;
        PlayType opponentPlay = opponentBet.play;
        require(_amount > 0, "Invalid opponent");

        uint256 allowance = token.allowance(msg.sender, address(this));
        require(allowance >= _amount, "Check the token allowance");
        token.transferFrom(msg.sender, address(this), _amount);

        MatchResult result = gameLogic(_play, opponentPlay);
        uint256 fee = getGameFee(_amount);
        acumulatedFee = acumulatedFee.add(fee);

        uint256 amountResult = _amount * 2 - fee;
        if (result == MatchResult.win) {
            token.transfer(msg.sender, amountResult);
        } else if (result == MatchResult.loss) {
            token.transfer(_opponent, amountResult);
        } else {
            token.transfer(msg.sender, amountResult / 2);
            token.transfer(_opponent, amountResult / 2);
        }
        _removeItemFromArray(_opponent);
        emit PlayAgainstEvent(msg.sender, _opponent, result);
    }

    function gameLogic(PlayType player, PlayType opponent)
        public
        view
        returns (MatchResult)
    {
        uint8 playerToInt = uint8(player);
        uint8 opponentToInt = uint8(opponent);
        return matchResult[playerToInt][opponentToInt];
    }

    function withdrawFee() public onlyOwner {
        token.transfer(owner(), acumulatedFee);
        emit WidthdrawFee(owner(), acumulatedFee);
        acumulatedFee = 0;
    }

    function _removeItemFromArray(address player) private {
        bool found = false;
        for (uint256 i = 0; i < players.length; i++) {
            if (players[i] == player) {
                found = true;
            }
            if (found && i < players.length - 1) {
                players[i] = players[i + 1];
            }
        }
        players.pop();
    }

    function getPlayers() public view returns (address[] memory) {
        return players;
    }
}
