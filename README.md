### Frontend installation

## NODE.JS

- Node 16.x || 18.x

## USING YARN (Recommend)

- yarn install
- yarn dev

## USING NPM

- npm i OR npm i --legacy-peer-deps
- npm run dev

## Then frontend running on port 3034

### Backend installation

- setup mongodb in your laptop
  confirm mongodb runnning in your laptop
- go to src/app/constant/server.js
  set SERVER_URL to "http://localhost:5000"
- go to backend folder
  yarn install or npm i
  run 'node server.js'

## Then backend running on port 5000

### Smart contract deploy (Optional: if you are going to deploy all smart contracts in your end)

## Hardhat usage

- copy contracts folder to hardhat/contracts folder.
- go to hardhat.config.js
  set
  solidity: { version: "0.8.20", settings: { optimizer: { enabled: true, runs: 200 } } }
  networks: {
  base_sepolia: {
  url: 'https://sepolia.base.org',
  chainId: 84532,
  accounts: ['here your wallet private key(0x prefixed)'],
  }
  }
- deploying
  deploy Memetoken.sol
  deploy StandardToken.sol
  deploy Module.sol
  deploy ModuleManager.sol
  deploy ModuleFactory.sol (params for this: ["0x46A15B0b27311cedF172AB29E4f4766fbE7F4364"(INonfungiblePositionManager Address of uniswap V3 on base sepolia testnet ), StandardToken deployed address(this is COMP token), ModuleManager deployed Address, Memetoken dpeloyed address, Module deployed address])
- giving access
  go to deployed ModuleManager address
  call addAdminModuleFactory as param with ModuleFactory deployed address

### Usage.

- Module Creation
  This platform is used to create module and token.
  Users can create Module using "Create Meme Coin & Module" button
  To create module, users need to have COMP token(platform token).
  While creationg, new module token and COMP token will be paired on uniswapV3 pool.
- Module usage
  Once module created, users can use that module by double clicking on that module card.
  Each module has 10 free times for new users can use.
  Once a user reached that limit then users can use that module according to the staked amount.
  For example, user that staked 100COMP token or module token (100COMP amount) then they can use that module once per day.
  Users can see the module informations and github pages once they enter that module.
- Staking/UnStaking.
  Users can stake/unstake using COMP token or module token to a module.
- Buying
  Each module has Buy button to buy that module token and on the dashboard we had "buy COMP" button for users to buy COMP token.
