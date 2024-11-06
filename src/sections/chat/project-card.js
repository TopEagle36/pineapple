import { useCallback, useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
// @mui
import { alpha } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import IconButton from '@mui/material/IconButton';
import ListItemText from '@mui/material/ListItemText';
// _mock
import { _socials } from 'src/_mock';
// assets
// components
import Image from 'src/components/image';
import Iconify from 'src/components/iconify';
import { useRouter } from 'src/routes/hooks';

import { usePopover } from 'src/components/custom-popover';
import { contract } from '../../constant/contract';
import { fShortenLink } from '../../utils/format-address';
import UserAction from '../module/user-action';
import AdminAction from '../module/admin-action';

// ----------------------------------------------------------------------

export default function ProjectCard({ module, setUpdater }) {
  const { address } = useAccount();
  const [isAdmin, setIsAdmin] = useState(false);

  // const theme = useTheme();
  const router = useRouter();
  const {
    moduleAddress,
    tokenName,
    token,
    tokenSymbol,
    totalRaised,
    totalSupply,
    moduleDetails,
    holders,
    compHolders,
    emission,
    creator,
  } = module;
  useEffect(() => {
    if (address && address === creator) {
      setIsAdmin(true);
    } else {
      setIsAdmin(false);
    }
  }, [address, module]);
  // // console.log("tokenName", tokenName)
  const logoURL = moduleDetails.toString().split('$#$')[0];
  const facebook = moduleDetails.toString().split('$#$')[1];
  const linkedin = moduleDetails.toString().split('$#$')[2];
  const instagram = moduleDetails.toString().split('$#$')[3];
  const twitter = moduleDetails.toString().split('$#$')[4];
  let site = '';
  let github = '';
  if (moduleDetails.toString().split('$#$').length > 5) {
    site = moduleDetails.toString().split('$#$')[5];
    github = moduleDetails.toString().split('$#$')[6];
  }

  const emissionByPercent = Number(emission) / 10 ** 4;
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

  const useModule = async () => {
    router.push(`${moduleAddress}/detail`);
  };

  const renderSocials = (
    <Stack
      direction="row"
      alignItems="center"
      justifyContent="center"
      sx={{ mb: 2.5, top: 8, right: 8, zIndex: 9, position: 'absolute' }}
    >
      {socials?.map((social) => (
        <IconButton
          key={social.name}
          sx={{
            color: social.color,
            '&:hover': {
              bgcolor: alpha(social.color, 0.08),
            },
            borderRadius: 5,
            bgcolor: 'warning.lighter',
          }}
          onClick={() => window.open(social.path)}
        >
          <Iconify icon={social.icon} />
        </IconButton>
      ))}
    </Stack>
    // </Stack>
  );

  const renderEmission = (
    <Stack
      direction="row"
      alignItems="center"
      sx={{
        top: 8,
        left: 8,
        zIndex: 9,
        borderRadius: 1,
        bgcolor: 'grey.800',
        position: 'absolute',
        p: '2px 6px 2px 4px',
        color: 'common.white',
        typography: 'subtitle2',
      }}
    >
      <Box component="span" sx={{ mr: 0.25 }}>
        {emissionByPercent} % daily
      </Box>
    </Stack>
  );

  const renderImages = (
    <Stack
      spacing={0.5}
      direction="row"
      sx={{
        p: (theme) => theme.spacing(1, 1, 0, 1),
      }}
    >
      <Stack flexGrow={1} sx={{ position: 'relative' }}>
        {renderEmission}
        {renderSocials}
        <Image
          alt={logoURL}
          src={logoURL}
          sx={{ borderRadius: 1, height: 164, width: 1 }}
          overlay={alpha('#00AAEC', 0.1)}
        />
      </Stack>
      {/* <Stack spacing={0.5}>
        <Image alt={images[1]} src={images[1]} ratio="1/1" sx={{ borderRadius: 1, width: 80 }} />
        <Image alt={images[2]} src={images[2]} ratio="1/1" sx={{ borderRadius: 1, width: 80 }} />
      </Stack> */}
    </Stack>
  );

  const renderTexts = (
    <ListItemText
      sx={{
        p: (theme) => theme.spacing(2.5, 2.5, 2, 2.5),
        cursor: 'pointer',
      }}
      onClick={() => window.open(contract.default.scanURL + token)}
      primary={`${tokenName} (${tokenSymbol})`}
      // secondary={
      //   // <Link component={RouterLink} color="inherit">
      //   //   {name}
      //   // </Link>
      // }
      primaryTypographyProps={{
        typography: 'caption',
        color: 'text.disabled',
      }}
      secondaryTypographyProps={{
        mt: 1,
        noWrap: true,
        component: 'span',
        color: 'text.primary',
        typography: 'subtitle1',
      }}
    />
  );

  const renderInfo = (
    <Stack
      spacing={1.5}
      sx={{
        position: 'relative',
        p: (theme) => theme.spacing(0, 2.5, 2.5, 2.5),
      }}
    >
      {/* <IconButton onClick={popover.onOpen} sx={{ position: 'absolute', bottom: 20, right: 8 }}>
        <Iconify icon="eva:more-vertical-fill" />
      </IconButton> */}

      {[
        {
          label: fShortenLink(site),
          icon: (
            <Iconify
              icon="material-symbols:captive-portal"
              sx={{ color: 'error.main', cursor: 'pointer' }}
            />
          ),
          key: 1,
        },
        {
          label: fShortenLink(github),
          icon: (
            <Iconify
              icon="material-symbols:deployed-code-outline-sharp"
              sx={{ color: 'info.main', cursor: 'pointer' }}
            />
          ),
          key: 2,
        },
        {
          label: `${holders.length} ${tokenSymbol} Stakers`,
          icon: <Iconify icon="solar:users-group-rounded-bold" sx={{ color: 'primary.main' }} />,
          key: 3,
        },
        {
          label: `${compHolders.length} COMP Stakers`,
          icon: <Iconify icon="solar:users-group-rounded-bold" sx={{ color: 'primary.main' }} />,
          key: 4,
        },
      ].map((item) => (
        <Stack
          key={item.key}
          spacing={1}
          direction="row"
          alignItems="center"
          sx={{ typography: 'body2' }}
        >
          {item.icon}
          {item.label}
        </Stack>
      ))}
    </Stack>
  );

  return (
    <>
      <Card
        sx={{
          transition: 'transform 0.9s ease',
          '&:hover': {
            border: 1,
            borderColor: 'primary.main',
            boxShadow: 9, // Move the card up when hovered
          },
          cursor: 'pointer',
        }}
        onDoubleClick={useModule}
      >
        {renderImages}

        {renderTexts}

        {renderInfo}
        {isAdmin ? (
          <AdminAction
            module={{ ...module, logoURL, socials, site, github, emissionByPercent }}
            setUpdater={setUpdater}
          ></AdminAction>
        ) : (
          <UserAction module={module} setUpdater={setUpdater}></UserAction>
        )}
      </Card>
    </>
  );
}
