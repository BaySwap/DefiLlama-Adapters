const { sumTokens2 } = require('../helper/unwrapLPs')
const { covalentGetTokens } = require('../helper/http')
const { isWhitelistedToken } = require('../helper/streamingHelper')
const { getUniqueAddresses } = require('../helper/utils')

const blacklistedTokens = [
  '0x57ab1e02fee23774580c119740129eac7081e9d3', // sUSD legacy
  '0x89d24a6b4ccb1b6faa2625fe562bdd9a23260359',
  '0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2',
  '0x57ab1e02fee23774580c119740129eac7081e9d3',
]

async function getTokens(api, owners, isVesting) {
  let tokens = (await Promise.all(owners.map(i => covalentGetTokens(i, api.chain)))).flat().filter(i => !blacklistedTokens.includes(i))
  tokens = getUniqueAddresses(tokens)
  const symbols = await api.multiCall({ abi: 'erc20:symbol', calls: tokens })
  return tokens.filter((v, i) => isWhitelistedToken(symbols[i], v, isVesting))
}

async function tvl(_, block, _1, { api }) {
  const { owners } = config[api.chain]
  const tokens = await getTokens(api, owners, false)
  return sumTokens2({ api, owners, tokens, blacklistedTokens, })
}

async function vesting(_, block, _1, { api }) {
  const { owners } = config[api.chain]
  const tokens = await getTokens(api, owners, true)
  return sumTokens2({ api, owners, tokens, blacklistedTokens, })
}

module.exports = {
  hallmarks: [
    [Math.floor(new Date('2022-10-03') / 1e3), 'Vesting tokens are not included in tvl'],
  ],
  start: 1573582731,
  timetravel: false,
};

const config = {
  ethereum: {
    owners: [
      "0xA4fc358455Febe425536fd1878bE67FfDBDEC59a", // v1.0.0
      "0xCD18eAa163733Da39c232722cBC4E8940b1D8888", // v1.1.0
    ]
  },
  arbitrum: { owners: ['0xaDB944B478818d95659067E70D2e5Fc43Fa3eDe9'], },
  avax: { owners: ['0x73f503fad13203C87889c3D5c567550b2d41D7a4'], },
  bsc: { owners: ['0x05BC7f5fb7F248d44d38703e5C921A8c16825161'], },
  optimism: { owners: ['0x6C5927c0679e6d857E87367bb635decbcB20F31c'], },
  polygon: { owners: ['0xAC18EAB6592F5fF6F9aCf5E0DCE0Df8E49124C06'], },
}

Object.keys(config).forEach(chain => {
  module.exports[chain] = { tvl, vesting }
})