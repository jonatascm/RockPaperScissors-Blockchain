# Rock Paper Scissors

Play rock, paper and scissors with this smart contract.
You'll need some WEENUS coins to bet in Kovan network.

Take a look on contract deployed in <a href="http://kovan.etherscan.io/address/0x42e4d5f1110Fb57e69a6140a3FB4eBe1EF756d92"> Kovan network </a>

## Link to get WEENUS tokens

<a href="https://github.com/bokkypoobah/WeenusTokenFaucet">Weenus Token Faucet</a>

Run this commands to test:

```shell
npm run compile
npm run test
```

## Run locally

```shell
npm run node
```

## Deploy

Copy .env.example to .env and update the variables:

Local:

```shell
npm run deploy-local
```

Kovan:

```shell
npm run deploy-kovan
```

## Check if contract was deployed

Then, copy the deployment address and paste it in to replace `DEPLOYED_CONTRACT_ADDRESS` in this command:

```shell
npx hardhat verify --network ropsten DEPLOYED_CONTRACT_ADDRESS "ContractName"
```
