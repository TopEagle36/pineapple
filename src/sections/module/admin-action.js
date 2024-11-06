import * as Yup from 'yup';
import { useEffect, useState } from 'react';
import { writeContract, waitForTransactionReceipt, readContract } from '@wagmi/core';
import { useAccount, useChainId } from 'wagmi';

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

import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';

// hooks
import { useSnackbar } from 'src/components/snackbar';
import { useBoolean } from 'src/hooks/use-boolean';
import FormProvider, { RHFTextField } from 'src/components/hook-form';
import { config } from 'src/config';

import moduleAbi from '../../constant/module.json';

export default function AdminAction({ module, setUpdater }) {
  const { address } = useAccount();
  const [distributeLoading, setDistributeLoading] = useState(false);
  const { enqueueSnackbar } = useSnackbar();
  const NewUserSchema = Yup.object().shape({
    emission: Yup.number().min(0, 'Emission must not be below 0').required('Emission is required'),
    logoURL: Yup.string().url('Must be a valid URL').nullable(),
    site: Yup.string().url('Must be a valid URL').required('Site URL required'),
    github: Yup.string().url('Must be a valid URL').required('Code link required'),
    facebook: Yup.string(),
    linkedin: Yup.string(),
    instagram: Yup.string(),
    twitter: Yup.string(),
  });
  const defaultValues = {
    emission: module.emissionByPercent,
    logoURL: module.logoURL,
    site: module.site,
    github: module.github,
    facebook: module.socials?.filter((social) => social.value === 'facebook')[0]?.path,
    linkedin: module.socials?.filter((social) => social.value === 'linkedin')[0]?.path,
    instagram: module.socials?.filter((social) => social.value === 'instagram')[0]?.path,
    twitter: module.socials?.filter((social) => social.value === 'twitter')[0]?.path,
  };
  const dialog = useBoolean();
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
  useEffect(() => {
    reset({
      emission: module.emissionByPercent, // Update the form with new emission value
      logoURL: module.logoURL,
      site: module.site,
      github: module.github,
      facebook: module.socials?.filter((social) => social.value === 'facebook')[0]?.path,
      linkedin: module.socials?.filter((social) => social.value === 'linkedin')[0]?.path,
      instagram: module.socials?.filter((social) => social.value === 'instagram')[0]?.path,
      twitter: module.socials?.filter((social) => social.value === 'twitter')[0]?.path,
    });
  }, [module, reset]);
  const onSubmit = handleSubmit(async (data) => {
    //to see if owner
    // const result = await readContract(config, {
    //   abi: moduleAbi,
    //   address: module.moduleAddress,
    //   functionName: 'owner',
    // });
    // console.log('result', result);

    try {
      if (address) {
        const moduleDetails = `${data.logoURL}$#$${data.facebook}$#$${data.linkedin}$#$${data.instagram}$#$${data.twitter}$#$${data.site}$#$${data.github}`;
        const emission = data.emission * 10 ** 4;
        const para = [emission, moduleDetails];
        const result = await writeContract(config, {
          abi: moduleAbi,
          address: module.moduleAddress,
          functionName: 'updateEmissionModuleDetails',
          args: para,
        });
        console.log('result', result);
        const response = await waitForTransactionReceipt(config, { hash: result });
        if (response != null) {
          if (response && response.status && response.status === 'success') {
            enqueueSnackbar('Updated successfully!', { variant: 'success' });
            dialog.onFalse();
            setUpdater(new Date());
          } else {
            enqueueSnackbar('Updated failed!', { variant: 'false' });
            dialog.onFalse();
            setUpdater(new Date());
          }
        }
      } else {
        enqueueSnackbar(`Please connect wallet`, {
          variant: 'info',
        });
      }
    } catch (e) {
      console.log('eee', e);
      if (e.message.includes('User rejected the request'))
        enqueueSnackbar(`User rejected the request!`, {
          variant: 'info',
        });
    }
  });
  const handleDistribute = async () => {
    try {
      setDistributeLoading(true);
      if (address) {
        if (module.holders.length > 0 || module.compHolders.length > 0) {
          const result = await writeContract(config, {
            abi: moduleAbi,
            address: module.moduleAddress,
            functionName: 'distributeRewards',
          });
          const response = await waitForTransactionReceipt(config, { hash: result });
          if (response != null) {
            if (response && response.status && response.status === 'success') {
              enqueueSnackbar('Distributed Successfully!', { variant: 'success' });
              setUpdater(new Date());
            }
          }
        } else {
          enqueueSnackbar(`Don't have stakers to give rewards`, {
            variant: 'info',
          });
        }
      } else {
        enqueueSnackbar(`Please connect wallet`, {
          variant: 'info',
        });
      }
      setDistributeLoading(false);
    } catch (e) {
      setDistributeLoading(false);
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
        <LoadingButton
          fullWidth
          disabled={Number(module?.totalStaked) === 0}
          size="large"
          color="warning"
          variant="contained"
          loading={distributeLoading}
          // startIcon={<Iconify icon="solar:cart-plus-bold" width={24} />}
          onClick={handleDistribute}
          // sx={{ whiteSpace: 'nowrap' }}
        >
          Distribute
        </LoadingButton>

        <Button fullWidth size="large" variant="contained" onClick={dialog.onTrue}>
          Edit Module Info
        </Button>
        <Dialog open={dialog.value} onClose={dialog.onFalse}>
          {isSubmitting && (
            <Backdrop open sx={{ zIndex: (theme) => theme.zIndex.modal + 1 }}>
              <CircularProgress color="primary" />
            </Backdrop>
          )}
          <FormProvider methods={methods} onSubmit={onSubmit}>
            <DialogTitle p={3}>Edit Module Info</DialogTitle>

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
                <RHFTextField name="emission" label="Emission" />
                <RHFTextField name="logoURL" label="Image Url" />
                <RHFTextField name="site" label="Site Link" />
                <RHFTextField name="github" label="Code Link" />
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
              <LoadingButton
                type="submit"
                variant="contained"
                color="primary"
                loading={isSubmitting}
              >
                Update
              </LoadingButton>
            </DialogActions>
          </FormProvider>
        </Dialog>
      </Stack>
    </Stack>
  );
}
