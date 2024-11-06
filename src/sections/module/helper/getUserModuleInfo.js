import { useEffect, useState, useCallback } from 'react';
import { readContract } from '@wagmi/core';
import { erc20Abi } from 'viem';

import { config } from 'src/config';
import { contract } from 'src/constant/contract';
import { getFixedNumer } from 'src/utils/format-bigint-tofixed';
import moduleAbi from '../../../constant/module.json';

export const fetchModuleInfo = async (moduleAddress, tokenAddress, address) => {
  try {
    if (address) {
      const data1 = await readContract(config, {
        address: moduleAddress,
        abi: moduleAbi,
        functionName: 'getUserStaked',
        args: [address],
      });

      const tokenRewardsAccTmp = await readContract(config, {
        address: moduleAddress,
        abi: moduleAbi,
        functionName: 'earned',
        args: [address, tokenAddress],
      });
      const compRewardsAccTmp = await readContract(config, {
        address: moduleAddress,
        abi: moduleAbi,
        functionName: 'earned',
        args: [address, contract.default.compToken],
      });

      const data3 = await readContract(config, {
        address: tokenAddress,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [address],
      });
      const compBalTmp = await readContract(config, {
        address: contract.default.compToken,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [address],
      });

      const userStaked = getFixedNumer(data1[0], 18, 2);
      const compStaked = getFixedNumer(data1[1], 18, 2);
      const tokenRewardsAcc = getFixedNumer(tokenRewardsAccTmp, 18, 2);
      const compRewardAcc = getFixedNumer(compRewardsAccTmp, 18, 2);
      const tokenBalance = getFixedNumer(data3, 18, 2);
      const compBalance = getFixedNumer(compBalTmp, 18, 2);
      return { userStaked, compStaked, tokenRewardsAcc, compRewardAcc, tokenBalance, compBalance };
    }
  } catch (e) {
    console.log('fetchmodule info failure', e);
    return {
      userStaked: 0,
      compStaked: 0,
      tokenRewardsAcc: 0,
      compRewardAcc: 0,
      tokenBalance: 0,
      compBalance: 0,
    };
  }
};
