import * as Yup from 'yup';
import { forwardRef, useState } from 'react';
import { erc20Abi } from 'viem';
// @mui
import Slide from '@mui/material/Slide';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import { Box, Divider, Typography } from '@mui/material';
import LoadingButton from '@mui/lab/LoadingButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import { writeContract, waitForTransactionReceipt } from '@wagmi/core';
import DialogContent from '@mui/material/DialogContent';
import Backdrop from '@mui/material/Backdrop';
import CircularProgress from '@mui/material/CircularProgress';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useChainId, useAccount } from 'wagmi';
import { useSnackbar } from 'src/components/snackbar';
import FormProvider, { RHFTextField } from 'src/components/hook-form';

// hooks
import { useBoolean } from 'src/hooks/use-boolean';

import { useRouter } from 'src/routes/hooks';

import { config } from 'src/config';

import { contract } from '../../constant/contract';
import moduleFactoryAbi from '../../constant/moduleFactory.json';
import { useCompInfo } from './helper/useStats';

export default function CreateForm({ setUpdater }) {
  const chainId = useChainId();
  const router = useRouter();
  const { address } = useAccount();
  const compStats = useCompInfo();
  const [v3poolAddress, setV3poolAddress] = useState('');
  const [moduleAddress, setModuleAddress] = useState('');

  const { enqueueSnackbar } = useSnackbar();
  const NewUserSchema = Yup.object().shape({
    name: Yup.string().required('Token name is required'),
    symbol: Yup.string().required('Symbol is required'),
    emission: Yup.number().min(0, 'Emission must not be below 0').required('Emission is required'),
    site: Yup.string().url('Must be a valid URL').required('Site should exist'),
    github: Yup.string().url('Must be a valid URL').required('Code should exist'),
    avatarUrl: Yup.string().url('Must be a valid URL').nullable(),
    compAmt: Yup.number().required('Please input Comp amount you want to make pool'),
    facebook: Yup.string(),
    linkedin: Yup.string(),
    instagram: Yup.string(),
    twitter: Yup.string(),
  });
  const defaultValues = {
    name: '',
    symbol: '',
    emission: 0.01,
    site: '',
    github: '',
    avatarUrl: '',
    compAmt: 1,
    facebook: '',
    linkedin: '',
    instagram: '',
    twitter: '',
  };
  const dialog = useBoolean();
  const poolDialog = useBoolean();
  const methods = useForm({
    resolver: yupResolver(NewUserSchema),
    defaultValues,
  });

  const {
    reset,
    watch,
    control,
    setValue,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const gotoPool = () => {
    window.open(`https://app.uniswap.org/#/pool/${v3poolAddress}`);
    poolDialog.onFalse();
  };
  const onSubmit = handleSubmit(async (data) => {
    try {
      if (address || chainId) {
        try {
          // For adding admin Module Factory

          // let moduleFactoryAddress = contract[chainId].moduleFactory;
          // let moduleManangerAddress = contract['default'].moduleMananger;
          // let para = [moduleFactoryAddress];
          // const result1 = await writeContract(config, {
          //   abi: moduleManagerAbi,
          //   address: moduleManangerAddress,
          //   functionName: 'addAdminModuleFactory',
          //   args: para,
          // });
          // const response = await waitForTransactionReceipt(config, { hash: result1 });
          // console.log('response', response);

          // For updating ModuleTemplate in Module Factory

          // let moduleFactoryAddress = contract[chainId].moduleFactory;
          // let para = [contract['default'].module];
          // const result1 = await writeContract(config, {
          //   abi: moduleFactoryAbi,
          //   address: moduleFactoryAddress,
          //   functionName: 'setModuleTemplate',
          //   args: para,
          // });
          // const response = await waitForTransactionReceipt(config, { hash: result1 });
          // console.log('response', response);
          if (compStats.tokenBalance > data.compAmt) {
            const tokenAddress = '0x0000000000000000000000000000000000000000';
            const moduleFactoryAddress = contract[chainId].moduleFactory;
            const para = [
              tokenAddress,
              data.emission * 10 ** 4,
              data.compAmt * 10 ** 18,
              `${data.avatarUrl}$#$${data.facebook}$#$${data.linkedin}$#$${data.instagram}$#$${data.twitter}$#$${data.site}$#$${data.github}`,
              [data.name, data.symbol],
            ];
            if (compStats.allowance < data.compAmt) {
              const compAddress = contract[chainId].compToken;
              // const amtToApprove = data.compAmt - compStats.allowance;
              console.log('data.compAmt', data.compAmt);
              const result1 = await writeContract(config, {
                abi: erc20Abi,
                address: compAddress,
                functionName: 'approve',
                args: [moduleFactoryAddress, data.compAmt * 10 ** 18],
              });
              const response1 = await waitForTransactionReceipt(config, { hash: result1 });
              if (response1 != null) {
                if (response1 && response1.status && response1.status === 'success') {
                  enqueueSnackbar('COMP approved successfully!', { variant: 'success' });
                  // router.push(`/dashboard/${moduleAddress}/detail`);
                } else {
                  enqueueSnackbar('Issue with approve!', { variant: 'error' });
                  return;
                }
              }
            }
            const result = await writeContract(config, {
              abi: moduleFactoryAbi,
              address: moduleFactoryAddress,
              functionName: 'createComPump',
              args: para,
              value: 0,
            });
            const response = await waitForTransactionReceipt(config, { hash: result });
            console.log('response', response);
            if (response != null) {
              if (response && response.status && response.status === 'success') {
                enqueueSnackbar('Module created successfully!', { variant: 'success' });
                const v3PairAddress = response.logs[13].address;
                const moduleAddrTmp = response.logs[5].address;
                setV3poolAddress(v3PairAddress);
                setModuleAddress(moduleAddrTmp);
                dialog.onFalse();
                setUpdater(new Date());
                poolDialog.onTrue();
              }
            }
          } else {
            enqueueSnackbar(`You don't have enoguth COMP token in your wallet!`, {
              variant: 'info',
            });
          }

          // console.info('DATA', data);
        } catch (error) {
          console.error(error);
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
  });
  const Transition = forwardRef((props, ref) => <Slide direction="up" ref={ref} {...props} />);
  return (
    <>
      <Button variant="contained" color="primary" onClick={dialog.onTrue}>
        Create Meme Coin & Module
      </Button>
      <Dialog open={dialog.value} onClose={dialog.onFalse}>
        {isSubmitting && (
          <Backdrop open sx={{ zIndex: (theme) => theme.zIndex.modal + 1 }}>
            <CircularProgress color="primary" />
          </Backdrop>
        )}
        <FormProvider methods={methods} onSubmit={onSubmit}>
          <DialogTitle p={3}>Create New Meme</DialogTitle>

          <DialogContent>
            <Box
              rowGap={3}
              columnGap={2}
              display="grid"
              gridTemplateColumns={{
                xs: 'repeat(1, 1fr)',
                sm: 'repeat(2, 1fr)',
              }}
              pt={2}
            >
              <RHFTextField name="name" label="Token Name*" />
              <RHFTextField name="symbol" label="Symbol*" />
              <RHFTextField name="emission" label="Emission(% Per day)*" />
              <RHFTextField name="avatarUrl" label="Image Url" />
              <RHFTextField name="site" label="Site Link*" />
              <RHFTextField name="github" label="Git Link*" />
            </Box>
            <Box mt={3}>
              <Typography>You have {compStats.tokenBalance} COMP in your wallet</Typography>
            </Box>
            <Box
              rowGap={3}
              columnGap={2}
              display="grid"
              gridTemplateColumns={{
                xs: 'repeat(1, 1fr)',
              }}
              pt={2}
            >
              <RHFTextField name="compAmt" label="Comp Amount*" />
            </Box>
            <Box mt={3}>
              <Divider>Socials</Divider>
            </Box>

            <Box
              rowGap={3}
              columnGap={2}
              display="grid"
              gridTemplateColumns={{
                xs: 'repeat(1, 1fr)',
                sm: 'repeat(2, 1fr)',
              }}
              pt={2}
            >
              <RHFTextField name="facebook" label="Facebook" />
              <RHFTextField name="linkedin" label="Linkedin" />
              <RHFTextField name="instagram" label="Instagram" />
              <RHFTextField name="twitter" label="Twitter/X" />
            </Box>
          </DialogContent>

          <DialogActions>
            <Button onClick={dialog.onFalse} variant="outlined" color="inherit">
              Cancel
            </Button>
            <LoadingButton type="submit" variant="contained" color="primary" loading={isSubmitting}>
              Create
            </LoadingButton>
          </DialogActions>
        </FormProvider>
      </Dialog>
      <Dialog
        keepMounted
        open={poolDialog.value}
        TransitionComponent={Transition}
        onClose={poolDialog.onFalse}
      >
        <DialogTitle>Visit your pool created on uniswapV3?</DialogTitle>

        <DialogContent sx={{ color: 'text.secondary' }}>
          <div>
            -Please Save your module Address(
            <a style={{ color: 'yellow' }} href={contract.default.scanURL + moduleAddress}>
              {moduleAddress}
            </a>
            ). You should transfer COMP token to your module to give Rewards for COMP staking.
            <br />
            -You have created pool paired with your token and COMP on uniswap V3. You can add more
            liquidity there.
          </div>
        </DialogContent>

        <DialogActions>
          <Button variant="outlined" onClick={poolDialog.onFalse}>
            Cancel
          </Button>
          <Button variant="contained" onClick={gotoPool} autoFocus>
            Visit
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
