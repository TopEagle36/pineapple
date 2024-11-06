import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { useAccount, useChainId } from 'wagmi';
import { readContract } from '@wagmi/core';
import { erc20Abi } from 'viem';

import { config } from 'src/config';
import { contract } from 'src/constant/contract';

import moduleAbi from '../../../constant/module.json';
import IpoolAbi from '../../../constant/IUniswapV3Pool.json';
import { sendVisitInfo } from './visitionInfoBackend';

export const useVisitStats = (stats, moduleAddress) => {
  const { address } = useAccount();
  const [visitStats, setVisitStats] = useState({});
  const fetchVisitionInfo = useCallback(async () => {
    try {
      if (address) {
        const date = new Date();
        const epochTimeInSeconds = Math.floor(date.getTime() / 1000);
        const userTokenStaked = stats.userStaked;
        const userCompStaked = stats.compStaked;
        const compPrice = stats.compPrice;
        const stakeAmount = userCompStaked + userTokenStaked / compPrice;
        const dataToSend = {
          address,
          moduleAddress,
          stakeAmount,
          visitEpochTime: epochTimeInSeconds,
        };
        const visitAllowed = await sendVisitInfo(dataToSend);
        console.log('visitAllowed', visitAllowed);
        if (visitAllowed.status === true) {
          setVisitStats({ message: '', type: 'allowed' });
        } else if (visitAllowed.status === false) {
          if (visitAllowed.message?.includes('Error adding visit')) {
            setVisitStats({ message: 'Backend response error', type: 'error' });
          } else {
            setVisitStats({
              message: `You've reached daily usage limit ${visitAllowed.stakeAmount}/${visitAllowed.stakeAmount}. Please try day later or stake more!`,
              type: 'error',
            });
          }
        } else if (visitAllowed.message?.includes('Error occured while trying')) {
          setVisitStats({ message: visitAllowed.message, type: 'error' });
        }
      } else {
        setVisitStats({ message: 'Please connect wallet to use this module!', type: 'error' });
      }
    } catch (e) {
      console.log('e backend', e);
      setVisitStats({
        message: 'Error occured while trying to fetch your visit info!',
        type: 'error',
      });
    }
  }, [stats]);
  useEffect(() => {
    fetchVisitionInfo();
  }, [address, stats]);
  return visitStats;
};

export const useModuleStats = (update, moduleAddress) => {
  const chainId = useChainId();
  const { address } = useAccount();
  const [stats, setStats] = useState({
    loading: true,
    moduleInfo: {},
    userStaked: 0,
    tokenBalance: 0,
    compBalance: 0,
    compStaked: 0,
    compPrice: 0,
    githubData: { full_name: 'Github repository invalid or private!' },
    error: null,
  });

  const fetchModuleInfo = useCallback(async () => {
    try {
      const data = await readContract(config, {
        address: moduleAddress,
        abi: moduleAbi,
        functionName: 'getModuleInfo',
      });
      const moduleDetails = data[3];
      const logoURL = moduleDetails.toString().split('$#$')[0];
      const facebook = moduleDetails.toString().split('$#$')[1];
      const linkedin = moduleDetails.toString().split('$#$')[2];
      const instagram = moduleDetails.toString().split('$#$')[3];
      const twitter = moduleDetails.toString().split('$#$')[4];
      const site = moduleDetails.toString().split('$#$')[5];
      const github = moduleDetails.toString().split('$#$')[6];
      const emissionByPercent = Number(data[6]) / 10 ** 4;
      const socials = [];
      if (facebook) {
        socials.push({
          color: '#1877F2',
          icon: 'eva:facebook-fill',
          name: 'FaceBook',
          path: facebook,
          value: 'facebook',
        });
      }

      if (linkedin) {
        socials.push({
          color: '#007EBB',
          icon: 'eva:linkedin-fill',
          name: 'Linkedin',
          path: linkedin,
          value: 'linkedin',
        });
      }
      if (instagram) {
        socials.push({
          color: '#E02D69',
          icon: 'ant-design:instagram-filled',
          name: 'Instagram',
          path: instagram,
          value: 'instagram',
        });
      }
      if (twitter) {
        socials.push({
          color: '#00AAEC',
          icon: 'eva:twitter-fill',
          name: 'Twitter',
          path: twitter,
          value: 'twitter',
        });
      }
      setStats({
        loading: false,
        moduleInfo: {
          creator: data[7],
          ca: data[0],
          tokenName: data[1],
          symbol: data[2],
          stakers: data[4],
          compStakers: data[5],
          emission: emissionByPercent,
          logoURL,
          socials,
          site,
          github,
        },
        userStaked: 0,
        tokenBalance: 0,
        compBalance: 0,
        compStaked: 0,
        compPrice: 0,
        githubData: { full_name: 'Github repository invalid or private!' },
        error: null,
      });
      if (address) {
        const data1 = await readContract(config, {
          address: moduleAddress,
          abi: moduleAbi,
          functionName: 'getUserStaked',
          args: [address],
        });
        const data3 = await readContract(config, {
          address: data[0],
          abi: erc20Abi,
          functionName: 'balanceOf',
          args: [address],
        });
        const data4 = await readContract(config, {
          address: contract[chainId].compToken,
          abi: erc20Abi,
          functionName: 'balanceOf',
          args: [address],
        });
        const positionInfo = await readContract(config, {
          address: moduleAddress,
          abi: moduleAbi,
          functionName: 'getPositionInfo',
        });
        const slot0 = await readContract(config, {
          address: '0xebc24A5b6de95a8dCeDd91774eFA198b9Ff94b59',
          abi: IpoolAbi,
          functionName: 'slot0',
        });

        const sqrtPriceX96 = slot0[0];

        // Calculate current price of COMP from sqrtPriceX96
        let compPrice = 0;
        if (positionInfo[0].toLowerCase() === contract[chainId].compToken.toLowerCase()) {
          compPrice = (Number(sqrtPriceX96) / 2 ** 96) ** 2; //actually we should mul each other's token decimal  like const finalPrice*10**6  =10**18 (Number(sqrtPriceX96) / 2 ** 96) ** 2; to get eth final price in usd(usd has 6 decimal)
        } else {
          compPrice = 1 / (Number(sqrtPriceX96) / 2 ** 96) ** 2;
        }
        const gitrepos = github?.split('https://github.com/');
        let gitrepo = '';
        if (gitrepos?.length > 1) {
          gitrepo = gitrepos[1];
        }
        let githubData = { full_name: 'Github repository invalid or private!' };
        try {
          const githubData1 = await axios.get('https://api.github.com/repos/' + gitrepo);
          githubData = githubData1.data;
        } catch (e) {
          console.log('e', e);
        }
        setStats({
          loading: false,
          moduleInfo: {
            creator: data[8],
            ca: data[0],
            tokenName: data[1],
            symbol: data[2],
            totalStaked: data[6],
            stakers: data[4],
            emission: emissionByPercent,
            logoURL,
            socials,
            site,
            github,
          },
          userStaked: Number((Number(data1[0]) / 10 ** 18).toFixed(2)),
          tokenBalance: Number((Number(data3) / 10 ** 18).toFixed(2)),
          compStaked: Number((Number(data1[1]) / 10 ** 18).toFixed(2)),
          compBalance: Number((Number(data4) / 10 ** 18).toFixed(2)),
          compPrice,
          githubData,
          error: null,
        });
      }
    } catch (e) {
      setStats({ ...stats, loading: false, error: { message: 'Loading Module data failed!' } });
      console.log('E', e);
    }
  }, [update, address, moduleAddress, stats]);
  useEffect(() => {
    fetchModuleInfo();
    // eslint-disable-next-line
  }, [update, chainId, address]);

  return stats;
};
