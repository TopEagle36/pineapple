import { useEffect, useState, useCallback } from 'react';
import { useAccount, useCall, useChainId } from 'wagmi';
import { readContract } from '@wagmi/core';

import { config } from 'src/config';

import { contract } from '../../../constant/contract';
import moduleManagerAbi from '../../../constant/moduleManager.json';

export const useCommonStats = (update) => {
  const chainId = useChainId();

  const [stats, setStats] = useState([]);

  const fetchModuleAll = useCallback(async () => {
    try {
      const data = await readContract(config, {
        address: contract.default.moduleMananger,
        abi: moduleManagerAbi,
        functionName: 'getTotalNumberOfModules',
      });
      if (Number(data) > 0) {
        const modules = await readContract(config, {
          address: contract.default.moduleMananger,
          abi: moduleManagerAbi,
          functionName: 'getCumulativeModuleInfo',
          args: [0, Number(data)],
        });
        setStats(modules);
        console.log('modules', modules);
      }
    } catch (e) {
      console.log('E', e);
    }
  }, [update]);
  useEffect(() => {
    fetchModuleAll();
    // eslint-disable-next-line
  }, [update, chainId]);

  return stats;
};

export const useMyStakeStats = (update) => {
  const chainId = useChainId();

  const { address } = useAccount();
  const [stats, setStats] = useState([]);

  const fetchModuleForMyStake = useCallback(async () => {
    if (!address) {
      setStats([]);
    } else {
      try {
        const data = await readContract(config, {
          address: contract.default.moduleMananger,
          abi: moduleManagerAbi,
          functionName: 'getTotalNumberOfContributedModules',
          args: [address],
        });
        if (Number(data) > 0) {
          const modules = await readContract(config, {
            address: contract.default.moduleMananger,
            abi: moduleManagerAbi,
            functionName: 'getUserContributedModuleInfo',
            args: [address, 0, Number(data)],
          });
          console.log('contributed moduels=', modules);
          setStats(modules);
        }
      } catch (e) {
        console.log('E', e);
      }
    }
  }, [address]);
  useEffect(() => {
    fetchModuleForMyStake();
    // eslint-disable-next-line
  }, [update, address]);

  return stats;
};
