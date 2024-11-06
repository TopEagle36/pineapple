'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAccount } from 'wagmi';

// @mui
import { alpha, useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
// routes
import { RouterLink } from 'src/routes/components';
// components
import Iconify from 'src/components/iconify';
import EmptyContent from 'src/components/empty-content';
import { useSettingsContext } from 'src/components/settings';
import { fShortenString } from 'src/utils/format-address';
import { contract } from 'src/constant/contract';

//
import { ModuleSkeleton } from './module-skeleton';

import { useVisitStats, useModuleStats } from './helper/useStats';

// ----------------------------------------------------------------------

const TABS = [
  {
    value: 'site',
    icon: <Iconify icon="solar:phone-bold" width={24} />,
    label: 'Site',
  },
  {
    value: 'github',
    icon: <Iconify icon="solar:heart-bold" width={24} />,
    label: 'Github',
  },
];

// ----------------------------------------------------------------------

export default function ModuleDetailView({ moduleAddress }) {
  const theme = useTheme();
  const settings = useSettingsContext();

  const [updater, setUpdater] = useState('1');

  const stats = useModuleStats(updater, moduleAddress);
  const visitStats = useVisitStats(stats, moduleAddress);

  const { address } = useAccount();
  const [isAdmin, setIsAdmin] = useState(false);

  const [currentTab, setCurrentTab] = useState('site');

  const handleChangeTab = useCallback((event, newValue) => {
    setCurrentTab(newValue);
  }, []);

  useEffect(() => {
    if (address && address === stats.moduleInfo.creator) {
      setIsAdmin(true);
    } else {
      setIsAdmin(false);
    }
  }, [address, stats]);

  const visitModule = () => {
    window.open(contract.default.scanURL + moduleAddress);
  };
  const visitToken = () => {
    window.open(contract.default.scanURL + stats.moduleInfo.ca);
  };

  const renderSkeleton = <ModuleSkeleton />;

  const renderError = (
    <EmptyContent
      filled
      title={`${visitStats.message}`}
      action={
        <Button
          component={RouterLink}
          href="/dashboard"
          startIcon={<Iconify icon="eva:arrow-ios-back-fill" width={16} />}
          sx={{ mt: 3 }}
        >
          Back to List
        </Button>
      }
      sx={{ py: 10 }}
    />
  );
  const renderModule = (
    <>
      <Stack
        spacing={2}
        sx={{ width: 1, marginTop: '-15px' }}
        direction="row"
        justifyContent="space-between"
      >
        <Tabs value={currentTab} onChange={handleChangeTab}>
          {TABS.map((tab) => (
            <Tab
              key={tab.value}
              value={tab.value}
              label={tab.value === 'site' ? stats.moduleInfo.tokenName : 'Github'}
            />
          ))}
        </Tabs>
        <Box flexGrow={1} />
        <Box
          sx={{ marginTop: '10px', cursor: 'pointer', '&:hover': { color: 'yellow' } }}
          onClick={visitModule}
        >
          Module Address: {fShortenString(moduleAddress)}
        </Box>
        <Box
          sx={{ marginTop: '10px', cursor: 'pointer', '&:hover': { color: 'yellow' } }}
          onClick={visitToken}
        >
          Token Address: {fShortenString(stats.moduleInfo.ca)}
        </Box>
        <Box
          sx={{ marginTop: '10px', cursor: 'pointer', '&:hover': { color: 'yellow' } }}
          onClick={visitToken}
        >
          Token Symbol: {fShortenString(stats.moduleInfo.symbol)}
        </Box>
      </Stack>
      {currentTab === 'site' ? (
        <Box
          key="site"
          sx={{
            p: 2,
            borderRadius: 1,
            bgcolor: 'background.neutral',
            height: '87vh',
          }}
        >
          <iframe
            src={stats.moduleInfo.site}
            title={stats.moduleInfo.symbol}
            width="100%"
            height="100%"
          />
        </Box>
      ) : (
        <Box
          key="github"
          sx={{
            p: 2,
            borderRadius: 1,
            bgcolor: 'background.neutral',
            height: '87vh',
          }}
        >
          <Typography variant="title2">Full Name</Typography>
          <Typography variant="body2">{stats.githubData.full_name}</Typography>
          <Typography variant="title2">Description</Typography>
          <Typography variant="body2">{stats.githubData.description}</Typography>
          <Typography variant="title2">Download URL</Typography>
          <Typography variant="body2">{stats.githubData.downloads_url}</Typography>
        </Box>
      )}
    </>
  );
  return (
    <Container maxWidth="false">
      {/* <CartIcon totalItems={checkout.totalItems} /> */}

      {stats.loading && renderSkeleton}

      {visitStats.type === 'error' || stats.error ? renderError : renderModule}
    </Container>
  );
}
