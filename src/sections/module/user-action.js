import * as Yup from 'yup';
import { useState } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { writeContract, waitForTransactionReceipt } from '@wagmi/core';

import Dialog from '@mui/material/Dialog';
import LoadingButton from '@mui/lab/LoadingButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import Backdrop from '@mui/material/Backdrop';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';

import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { erc20Abi } from 'viem';
// hooks
import { useSnackbar } from 'src/components/snackbar';
import { useBoolean } from 'src/hooks/use-boolean';
import { config } from 'src/config';
import FormProvider, { RHFTextField, RHFRadioGroup } from 'src/components/hook-form';

import moduleAbi from '../../constant/module.json';
import { contract } from '../../constant/contract';

import { fetchModuleInfo } from './helper/getUserModuleInfo';

export default function UserAction({ module, setUpdater }) {
  const { enqueueSnackbar } = useSnackbar();
  const [stakeLoading, setStakeLoading] = useState(false);
  const [unStakeLoading, setUnStakeLoading] = useState(false);
  const chainId = useChainId();
  const { address } = useAccount();
  const [stakeUnstakeLoading, setStakeUnstakeLoading] = useState(false);
  const [userModuleInfo, setUserMouduleInfo] = useState({
    userStaked: 0,
    compStaked: 0,
    tokenRewardsAcc: 0,
    compRewardAcc: 0,
    tokenBalance: 0,
    compBalance: 0,
  });
  const NewUserSchema = Yup.object().shape({
    staking: Yup.number()
      .min(0.000000000000000001, 'staking must not be below 0')
      .required('staking is required'),
  });
  const defaultValues = {
    stakeToken: '1',
    staking: 0,
  };
  const dialog = useBoolean();
  const methods = useForm({
    resolver: yupResolver(NewUserSchema),
    defaultValues,
  });

  const {
    getValues,
    trigger,
    formState: { isSubmitting },
  } = methods;
  const handleStakeUnStake = async () => {
    try {
      setStakeUnstakeLoading(true);

      if (address) {
        const userModuleInfoTmp = await fetchModuleInfo(
          module.moduleAddress,
          module.token,
          address
        );
        setUserMouduleInfo(userModuleInfoTmp);
        dialog.onTrue();
        setStakeUnstakeLoading(false);
      } else {
        enqueueSnackbar('Please connect wallet!', {
          variant: 'info',
        });
        setStakeUnstakeLoading(false);
      }
    } catch (e) {
      setStakeUnstakeLoading(false);
      console.log('error', e);
    }
  };
  const approve = async (tokenAddr, amount) => {
    const para = [module.moduleAddress, amount];
    const result = await writeContract(config, {
      abi: erc20Abi,
      address: tokenAddr,
      functionName: 'approve',
      args: para,
    });
    const response = await waitForTransactionReceipt(config, { hash: result });
    if (response != null) {
      if (response && response.status && response.status === 'success') {
        enqueueSnackbar('Approved successfully!', { variant: 'success' });
        return true;
      }
    } else {
      return false;
    }
  };
  const handleStake = async () => {
    try {
      setStakeLoading(true);
      if (address) {
        const validation = await trigger();
        if (validation) {
          const forms = getValues();
          let tokenAddrToStake = module.token;
          if (forms.stakeToken === 1) {
            //staking module token
            if (forms.staking > userModuleInfo.tokenBalance) {
              enqueueSnackbar(`Don't have enough ${module.tokenSymbol} in your wallet!`, {
                variant: 'error',
              });
              return;
            }
          } else if (forms.stakeToken === 2) {
            tokenAddrToStake = contract.default.compToken;
            if (forms.staking > userModuleInfo.compBalance) {
              enqueueSnackbar(`Don't have enough COMP in your wallet!`, {
                variant: 'error',
              });
              return;
            }
          }
          const approveStatus = await approve(tokenAddrToStake, forms.staking * 10 ** 18);
          // if (approveStatus) {
          const para = [forms.staking * 10 ** 18, tokenAddrToStake];
          const result = await writeContract(config, {
            abi: moduleAbi,
            address: module.moduleAddress,
            functionName: 'stake',
            args: para,
          });
          const response = await waitForTransactionReceipt(config, { hash: result });
          if (response != null) {
            if (response && response.status && response.status === 'success') {
              enqueueSnackbar('Staked successfully!', { variant: 'success' });
              dialog.onFalse();
              setUpdater(new Date());
            }
          }
          // }
        }
      } else {
        enqueueSnackbar('Please connect wallet!', {
          variant: 'info',
        });
      }
      setStakeLoading(false);
    } catch (e) {
      setStakeLoading(false);
      if (e.message.includes('User rejected the request'))
        enqueueSnackbar(`User rejected the request!`, {
          variant: 'info',
        });
    }
  };
  const handleUnStake = async () => {
    try {
      setUnStakeLoading(true);
      if (address) {
        const validation = await trigger();
        if (validation) {
          const forms = getValues();
          let tokenAddrToStake = module.token;
          if (forms.stakeToken === 1) {
            //staking module token
            if (forms.staking > userModuleInfo.userStaked) {
              enqueueSnackbar(`Don't have enough ${module.tokenSymbol} staked in this module!`, {
                variant: 'error',
              });
              return;
            }
          } else if (forms.stakeToken === 2) {
            tokenAddrToStake = contract.default.compToken;
            if (forms.staking > userModuleInfo.compStaked) {
              enqueueSnackbar(`Don't have enough COMP staked in this module!`, {
                variant: 'error',
              });
              return;
            }
          }
          const para = [forms.staking * 10 ** 18, tokenAddrToStake];
          const result = await writeContract(config, {
            abi: moduleAbi,
            address: module.moduleAddress,
            functionName: 'unStake',
            args: para,
          });
          const response = await waitForTransactionReceipt(config, { hash: result });
          if (response != null) {
            if (response && response.status && response.status === 'success') {
              enqueueSnackbar('UnStaked successfully!', { variant: 'success' });
              dialog.onFalse();
              setUpdater(new Date());
            }
          }
        }
      } else {
        enqueueSnackbar('Please connect wallet!', {
          variant: 'info',
        });
      }
      setUnStakeLoading(false);
    } catch (e) {
      setUnStakeLoading(false);
      if (e.message.includes('User rejected the request'))
        enqueueSnackbar(`User rejected the request!`, {
          variant: 'info',
        });
    }
  };
  const redirectToBuy = () => {
    window.open(
      `https://app.uniswap.org/#/swap?inputCurrency=${contract.default.compToken}&outputCurrency=${module.token}&exactField=input&use=V3`
    );
  };
  const handleClaim = async () => {
    try {
      if (address) {
        const userInfo = await fetchModuleInfo(module.moduleAddress, module.token, address);
        if (userInfo.userRewards > 0) {
          const result = await writeContract(config, {
            abi: moduleAbi,
            address: module.moduleAddress,
            functionName: 'claimReward',
          });
          const response = await waitForTransactionReceipt(config, { hash: result });
          if (response != null) {
            if (response && response.status && response.status === 'success') {
              enqueueSnackbar('Claimed successfully!', { variant: 'success' });
              // setUpdater(new Date());
            }
          }
        } else {
          enqueueSnackbar("You don't have enough rewards to claim", {
            variant: 'info',
          });
        }
      } else {
        enqueueSnackbar('Please connect wallet!', {
          variant: 'info',
        });
      }
    } catch (e) {
      if (e.message.includes('User rejected the request'))
        enqueueSnackbar(`User rejected the request!`, {
          variant: 'info',
        });
    }
  };

  return (
    <Stack
      spacing={1.5}
      sx={{
        position: 'relative',
        p: (theme) => theme.spacing(0, 2.5, 2.5, 2.5),
      }}
    >
      <Stack direction="row" spacing={2}>
        <Button
          fullWidth
          // disabled={Number(userModuleInfo.userRewards) === 0}
          size="large"
          color="warning"
          variant="contained"
          // startIcon={<Iconify icon="solar:cart-plus-bold" width={24} />}
          onClick={redirectToBuy}
          // sx={{ whiteSpace: 'nowrap' }}
        >
          Buy {module.tokenSymbol}
        </Button>
        <LoadingButton
          loading={stakeUnstakeLoading}
          fullWidth
          size="large"
          variant="contained"
          onClick={handleStakeUnStake}
        >
          Stake/Unstake
        </LoadingButton>
        <Dialog open={dialog.value} onClose={dialog.onFalse}>
          {isSubmitting && (
            <Backdrop open sx={{ zIndex: (theme) => theme.zIndex.modal + 1 }}>
              <CircularProgress color="primary" />
            </Backdrop>
          )}
          <FormProvider methods={methods}>
            <DialogTitle p={3}>Stake/Unstake</DialogTitle>

            <DialogContent>
              <Stack direction="row">
                <Typography variant="body2" sx={{ flexGrow: 1 }}>
                  {module.tokenSymbol} Staked
                </Typography>

                <Typography variant="body2">{userModuleInfo.userStaked}</Typography>
              </Stack>
              <Stack direction="row">
                <Typography variant="body2" sx={{ flexGrow: 1 }}>
                  Accumulated {module.tokenSymbol} Rewards
                </Typography>

                <Typography variant="body2">{userModuleInfo.tokenRewardsAcc}</Typography>
              </Stack>
              <Stack direction="row">
                <Typography variant="body2" sx={{ flexGrow: 1 }}>
                  {module.tokenSymbol} Balance
                </Typography>

                <Typography variant="body2">{userModuleInfo.tokenBalance}</Typography>
              </Stack>
              <Divider sx={{ marginTop: '5px', marginBottom: '5px' }} />
              <Stack direction="row">
                <Typography variant="body2" sx={{ flexGrow: 1 }}>
                  COMP Staked
                </Typography>

                <Typography variant="body2">{userModuleInfo.compStaked}</Typography>
              </Stack>
              <Stack direction="row">
                <Typography variant="body2" sx={{ flexGrow: 1 }}>
                  Accumulated COMP Rewards
                </Typography>

                <Typography variant="body2">{userModuleInfo.compRewardAcc}</Typography>
              </Stack>
              <Stack direction="row">
                <Typography variant="body2" sx={{ flexGrow: 1 }}>
                  COMP Balance
                </Typography>

                <Typography variant="body2">{userModuleInfo.compBalance}</Typography>
              </Stack>

              <Box
                rowGap={3}
                columnGap={2}
                display="grid"
                gridTemplateColumns={{
                  xs: 'repeat(1, 1fr)',
                  sm: 'repeat(1, 1fr)',
                }}
                pt={3}
              >
                <RHFRadioGroup
                  row
                  name="stakeToken"
                  label="Token to Stake"
                  spacing={4}
                  options={[
                    { value: '1', label: module.tokenSymbol },
                    { value: '2', label: 'COMP' },
                  ]}
                />
                <RHFTextField
                  name="staking"
                  label="Staking/UnStaking amount"
                  sx={{ width: '400px' }}
                />
              </Box>
            </DialogContent>

            <DialogActions>
              <Button onClick={dialog.onFalse} variant="outlined" color="inherit">
                Cancel
              </Button>
              <LoadingButton
                // type="submit"
                variant="contained"
                color="primary"
                loading={stakeLoading}
                onClick={handleStake}
              >
                Stake
              </LoadingButton>
              <LoadingButton
                // type="submit"
                variant="contained"
                color="primary"
                loading={unStakeLoading}
                onClick={handleUnStake}
              >
                UnStake
              </LoadingButton>
            </DialogActions>
          </FormProvider>
        </Dialog>
      </Stack>
    </Stack>
  );
}
