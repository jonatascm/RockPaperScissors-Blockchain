# Rock Paper Scissors

# Link to get WEENUS tokens

https://github.com/bokkypoobah/WeenusTokenFaucet

Run this commands to test:

```shell
npx hardhat clean
npx hardhat compile
npx hardhat test
```

# Run locally

```shell
npx hardhat node
```

```shell
hardhat run --network localhost scripts/deploy.ts
```

# Deploy

Copy .env.example to .env and update the variables:

```shell
hardhat run --network ropsten scripts/deploy.ts
```

Then, copy the deployment address and paste it in to replace `DEPLOYED_CONTRACT_ADDRESS` in this command:

```shell
npx hardhat verify --network ropsten DEPLOYED_CONTRACT_ADDRESS "ContractName"
```
