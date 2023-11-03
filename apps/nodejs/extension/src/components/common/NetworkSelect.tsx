import type { ChainID } from "@poktscan/keyring/dist/lib/core/common/protocols/ChainID";
import type { RootState } from "../../redux/store";
import { connect } from "react-redux";
import Grow from "@mui/material/Grow";
import Stack from "@mui/material/Stack";
import { useTheme } from "@mui/material";
import Button from "@mui/material/Button";
import Popper from "@mui/material/Popper";
import Checkbox from "@mui/material/Checkbox";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import FormControlLabel from "@mui/material/FormControlLabel";
import React, { useCallback, useMemo, useState } from "react";
import { ClickAwayListener } from "@mui/base/ClickAwayListener";
import { SupportedProtocols } from "@poktscan/keyring";
import { useAppDispatch } from "../../hooks/redux";
import { changeSelectedNetwork } from "../../redux/slices/app";
import ExpandIcon from "../../assets/img/drop_down_icon.svg";
import CloseIcon from "../../assets/img/close_icon.svg";
import PocketIcon from "../../assets/img/networks/pocket.svg";
import EthereumIcon from "../../assets/img/networks/ethereum.svg";

interface NetworkSelectProps {
  selectedNetwork: RootState["app"]["selectedNetwork"];
  selectedChainByNetwork: RootState["app"]["selectedChainByNetwork"];
  toggleShowBackdrop: () => void;
}

type Option<T extends SupportedProtocols = SupportedProtocols> = {
  network: T;
  chainId: ChainID<T>;
  isTest?: true;
};

const options: Option[] = [
  {
    network: SupportedProtocols.Pocket,
    chainId: "mainnet",
  },
  {
    network: SupportedProtocols.Pocket,
    chainId: "testnet",
    isTest: true,
  },
  {
    network: SupportedProtocols.Ethereum,
    chainId: "1",
  },
  {
    network: SupportedProtocols.Ethereum,
    chainId: "5",
    isTest: true,
  },
  {
    network: SupportedProtocols.Ethereum,
    chainId: "11155111",
    isTest: true,
  },
];

const iconByNetwork = {
  [SupportedProtocols.Ethereum]: EthereumIcon,
  [SupportedProtocols.Pocket]: PocketIcon,
};

const getLabelByNetworkAndChain = (option: Option) => {
  if (option.network === SupportedProtocols.Pocket) {
    return `Pocket ${option.chainId === "mainnet" ? "Mainnet" : "Testnet"}`;
  }

  if (option.network === SupportedProtocols.Ethereum) {
    if (option.chainId === "1") {
      return "ETH Mainnet";
    }

    if (option.chainId === "11155111") {
      return "Sepolia";
    }

    if (option.chainId === "5") {
      return "Goerli";
    }
  }

  return `${option.network} ${option.chainId}`;
};

const NetworkSelect: React.FC<NetworkSelectProps> = ({
  selectedNetwork,
  selectedChainByNetwork,
  toggleShowBackdrop,
}) => {
  const theme = useTheme();
  const dispatch = useAppDispatch();

  const selectedOption: Option = useMemo(() => {
    return {
      network: selectedNetwork,
      chainId: selectedChainByNetwork[
        selectedNetwork
      ] as ChainID<SupportedProtocols>,
    };
  }, [selectedNetwork, selectedChainByNetwork]);
  const SelectedOptionIcon = iconByNetwork[selectedNetwork];

  const [showTestNetworks, setShowTestNetworks] = useState(false);

  const onChangeShowTestNetworks = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setShowTestNetworks(event.target.checked);
    },
    []
  );

  const [anchorEl, setAnchorEl] = useState<HTMLDivElement | null>(null);

  const onOpenSelector = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      setAnchorEl(event.currentTarget);
      toggleShowBackdrop();
    },
    [toggleShowBackdrop]
  );

  const onCloseSelector = useCallback(() => {
    setAnchorEl(null);
    toggleShowBackdrop();
  }, [toggleShowBackdrop]);

  const handleChangeNetwork = useCallback(
    (option: Option) => {
      dispatch(changeSelectedNetwork(option));
      onCloseSelector();
    },
    [onCloseSelector]
  );

  const optionsToShow = useMemo(() => {
    const selectedOptionFromArr = options.find(
      (option) =>
        option.chainId === selectedOption.chainId &&
        option.network === selectedOption.network
    );

    return [
      selectedOptionFromArr,
      ...options.filter((option) => {
        const isNotSelected =
          option.network !== selectedOption.network ||
          option.chainId !== selectedOption.chainId;

        return showTestNetworks
          ? isNotSelected
          : isNotSelected && !option.isTest;
      }),
    ];
  }, [showTestNetworks, selectedOption]);

  return (
    <>
      <Stack
        width={1}
        height={36}
        zIndex={anchorEl ? 3 : undefined}
        direction={"row"}
        boxSizing={"border-box"}
        paddingLeft={0.5}
        alignItems={"center"}
        sx={{
          cursor: "pointer",
          userSelect: "none",
          position: "relative",
          borderRadius: anchorEl ? "12px" : "18px",
          boxShadow: "0px 0px 6px 0px #1C2D4A26",
          backgroundColor: theme.customColors.white,
          borderBottom: `1.5px solid ${theme.customColors.dark25}`,

          ...(anchorEl && {
            cursor: "normal",
            boxShadow: undefined,
            borderBottom: undefined,
            borderBottomLeftRadius: "0px",
            borderBottomRightRadius: "0px",
            border: `1px solid ${theme.customColors.dark15}`,
          }),
        }}
        onClick={anchorEl ? undefined : onOpenSelector}
      >
        {!anchorEl && <SelectedOptionIcon />}
        <Typography
          flexGrow={1}
          fontSize={13}
          fontWeight={700}
          marginLeft={0.6}
          letterSpacing={"0.5px"}
        >
          {!anchorEl
            ? getLabelByNetworkAndChain(selectedOption)
            : "Select Network"}
        </Typography>
        {!anchorEl ? (
          <ExpandIcon />
        ) : (
          <IconButton onClick={onCloseSelector}>
            <CloseIcon />
          </IconButton>
        )}
      </Stack>
      <Popper
        open={!!anchorEl}
        anchorEl={anchorEl}
        sx={{ zIndex: anchorEl ? 2 : undefined }}
      >
        <ClickAwayListener onClickAway={onCloseSelector}>
          <Grow in={!!anchorEl}>
            <Stack
              sx={{
                boxSizing: "border-box",
                bgcolor: theme.customColors.white,
                boxShadow: "0px 0px 6px 0px #1C2D4A26",
                width: 180,
                maxHeight: 250,
                border: `1px solid ${theme.customColors.dark15}`,
                borderTop: `none!important`,
                borderBottomLeftRadius: "12px",
                borderBottomRightRadius: "12px",
              }}
            >
              <Stack
                maxHeight={130}
                marginY={1}
                boxSizing={"border-box"}
                width={"calc(100% - 5px)"}
                paddingLeft={0.5}
                overflow={"auto"}
              >
                {optionsToShow.map((option) => {
                  const { network, chainId } = option;
                  const Icon = iconByNetwork[network];
                  const isSelected =
                    selectedOption.network === network &&
                    selectedOption.chainId === chainId;

                  return (
                    <Stack
                      width={1}
                      minHeight={40}
                      height={40}
                      spacing={1}
                      paddingLeft={0.2}
                      boxSizing={"border-box"}
                      direction={"row"}
                      alignItems={"center"}
                      key={`${option.network}-${option.chainId}`}
                      onClick={
                        isSelected
                          ? onCloseSelector
                          : () => handleChangeNetwork(option)
                      }
                      bgcolor={
                        isSelected
                          ? `${theme.customColors.primary100}!important`
                          : theme.customColors.white
                      }
                      sx={{
                        cursor: "pointer",
                        "&:hover": {
                          backgroundColor: theme.customColors.dark5,
                        },
                      }}
                    >
                      <Icon />
                      <Typography
                        fontSize={12}
                        fontWeight={500}
                        letterSpacing={"0.5px"}
                      >
                        {getLabelByNetworkAndChain(option)}
                      </Typography>
                    </Stack>
                  );
                })}
              </Stack>
              <Stack
                width={1}
                height={100}
                spacing={1.5}
                paddingX={1.5}
                paddingTop={1.5}
                paddingBottom={2}
                boxSizing={"border-box"}
                borderTop={`1px solid ${theme.customColors.dark15}`}
              >
                <FormControlLabel
                  sx={{
                    height: 20,
                    marginLeft: "-2px",
                    marginTop: 1,
                    userSelect: "none",
                    "& .MuiButtonBase-root": {
                      padding: 0,
                      transform: "scale(0.85)",
                    },
                    "& svg": {
                      fontSize: "18px!important",
                    },
                    "& .MuiTypography-root": {
                      marginLeft: 0.7,
                      fontSize: "10px!important",
                    },
                  }}
                  control={
                    <Checkbox
                      onChange={onChangeShowTestNetworks}
                      checked={showTestNetworks}
                    />
                  }
                  label={"Show test networks"}
                />
                <Button
                  fullWidth
                  variant={"contained"}
                  sx={{
                    height: 30,
                    fontSize: 14,
                    fontWeight: 700,
                    borderRadius: "4px",
                    backgroundColor: theme.customColors.primary500,
                  }}
                >
                  Add Network
                </Button>
              </Stack>
            </Stack>
          </Grow>
        </ClickAwayListener>
      </Popper>
    </>
  );
};

const mapStateToProps = (state: RootState) => ({
  networks: state.vault.entities.networks.list,
  selectedNetwork: state.app.selectedNetwork,
  selectedChainByNetwork: state.app.selectedChainByNetwork,
});

export default connect(mapStateToProps)(NetworkSelect);
