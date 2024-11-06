import { useEffect, useState } from 'react';
import { readContract } from '@wagmi/core';
import { erc20Abi } from 'viem';
import { useChainId, useAccount } from 'wagmi';
import { config } from 'src/config';

import { contract } from '../../../constant/contract';

export const useCompInfo = () => {
  const chainId = useChainId();
  const { address } = useAccount();
  const [stats, setStats] = useState({
    tokenBalance: 0,
    allowance: 0,
  });
  const fetchCompInfo = async () => {
    try {
      if (address) {
        const tokenAddress = contract[chainId].compToken;
        const factoryAddress = contract[chainId].moduleFactory;
        const data = await readContract(config, {
          address: tokenAddress,
          abi: erc20Abi,
          functionName: 'balanceOf',
          args: [address],
        });
        const data1 = await readContract(config, {
          address: tokenAddress,
          abi: erc20Abi,
          functionName: 'allowance',
          args: [address, factoryAddress],
        });
        const tokenBalance = Number((Number(data) / 10 ** 18).toFixed(2));
        const allowance = Number((Number(data1) / 10 ** 18).toFixed(2));
        setStats({ tokenBalance, allowance });
      } else {
        setStats({ tokenBalance: 0, allowance: 0 });
      }
    } catch (e) {
      setStats({ tokenBalance: 0, allowance: 0 });
    }
  };
  useEffect(() => {
    fetchCompInfo();
    // eslint-disable-next-line
  }, [chainId, address]);
  return stats;
};
