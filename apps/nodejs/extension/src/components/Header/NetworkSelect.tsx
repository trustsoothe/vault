import Grow from "@mui/material/Grow";
import orderBy from "lodash/orderBy";
import Stack from "@mui/material/Stack";
import { useTheme } from "@mui/material";
import Button from "@mui/material/Button";
import Popper from "@mui/material/Popper";
import Checkbox from "@mui/material/Checkbox";
import { useNavigate } from "react-router-dom";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import FormControlLabel from "@mui/material/FormControlLabel";
import React, { useCallback, useMemo, useState } from "react";
import { ClickAwayListener } from "@mui/base/ClickAwayListener";
import { SupportedProtocols } from "@soothe/vault";
import { useAppDispatch, useAppSelector } from "../../hooks/redux";
import {
  changeSelectedNetwork,
  toggleShowTestNetworks,
} from "../../redux/slices/app";
import ExpandIcon from "../../assets/img/drop_down_icon.svg";
import CloseIcon from "../../assets/img/close_icon.svg";
import useShowAccountSelect from "../../hooks/useShowAccountSelect";
import { NETWORKS_PAGE } from "../../constants/routes";
import {
  selectedChainSelector,
  selectedProtocolSelector,
} from "../../redux/selectors/network";

interface NetworkSelectProps {
  toggleShowBackdrop: () => void;
}

type Option<T extends SupportedProtocols = SupportedProtocols> = {
  network: T;
  chainId: string;
  isTest?: true;
};

const NetworkSelect: React.FC<NetworkSelectProps> = ({
  toggleShowBackdrop,
}) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const isShowingAccountSelect = useShowAccountSelect();
  const selectedProtocol = useAppSelector(selectedProtocolSelector);
  const selectedChain = useAppSelector(selectedChainSelector);
  const networks = useAppSelector((state) => state.app.networks);
  const networksCanBeSelected = useAppSelector(
    (state) => state.app.networksCanBeSelected
  );

  const selectedOption: Option = useMemo(() => {
    return {
      network: selectedProtocol,
      chainId: selectedChain,
    };
  }, [selectedProtocol, selectedChain]);

  const selectedOptionIconUrl = networks.find(
    (network) =>
      network.protocol === selectedOption.network &&
      network.chainId === selectedOption.chainId
  )?.iconUrl;

  const showTestNetworks = useAppSelector(
    (state) => state.app.showTestNetworks
  );

  const onChangeShowTestNetworks = useCallback(() => {
    dispatch(toggleShowTestNetworks());
  }, []);

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

  const onClickAddNetwork = useCallback(() => {
    onCloseSelector();
    navigate(`${NETWORKS_PAGE}?adding=true`);
  }, [navigate, onCloseSelector]);

  const handleChangeNetwork = useCallback(
    (option: { protocol: SupportedProtocols; chainId: string }) => {
      dispatch(
        changeSelectedNetwork({
          network: option.protocol,
          chainId: option.chainId,
        })
      );
      onCloseSelector();
    },
    [onCloseSelector]
  );

  const optionsToShow = useMemo(() => {
    const networkFiltered = [];

    for (const network of networks) {
      if (
        network.isDefault ||
        networksCanBeSelected[network.protocol].includes(network.chainId)
      ) {
        if (showTestNetworks) {
          networkFiltered.push(network);
        } else if (!network.isTestnet) {
          networkFiltered.push(network);
        }
      }
    }

    return orderBy(
      networkFiltered.map((network) => ({
        ...network,
        rank: network.isTestnet ? 2 : 1,
      })),
      ["rank"],
      ["asc"]
    );
  }, [showTestNetworks, networksCanBeSelected, networks]);

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
        {!anchorEl && (
          <img
            src={selectedOptionIconUrl}
            alt={`${selectedOption.network}-${selectedOption.chainId}-img`}
            width={24}
            height={24}
          />
        )}
        <Typography
          flexGrow={1}
          fontSize={13}
          fontWeight={700}
          marginLeft={0.6}
          letterSpacing={"0.5px"}
        >
          {!anchorEl
            ? networks.find(
                (network) =>
                  network.protocol === selectedOption.network &&
                  network.chainId === selectedOption.chainId
              )?.label
            : "Select Network"}
        </Typography>
        {!anchorEl ? (
          <ExpandIcon
            style={{
              minWidth: 30,
              width: 30,
              height: 30,
            }}
          />
        ) : (
          <IconButton
            onClick={onCloseSelector}
            sx={{
              minWidth: 30,
              width: 30,
              height: 30,
            }}
          >
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
                width: isShowingAccountSelect ? 180 : 370,
                maxHeight: 430,
                border: `1px solid ${theme.customColors.dark15}`,
                borderTop: `none!important`,
                borderBottomLeftRadius: "12px",
                borderBottomRightRadius: "12px",
              }}
            >
              <Stack
                marginY={1}
                boxSizing={"border-box"}
                width={"calc(100% - 5px)"}
                paddingLeft={0.5}
                overflow={"auto"}
              >
                {optionsToShow.map((option) => {
                  const { protocol, chainId } = option;
                  const isSelected =
                    selectedOption.network === protocol &&
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
                      key={`${option.protocol}-${option.chainId}`}
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
                      <img
                        src={option.iconUrl}
                        alt={`${option.protocol}-${option.chainId}-img`}
                        width={24}
                        height={24}
                      />
                      <Typography
                        fontSize={12}
                        fontWeight={500}
                        letterSpacing={"0.5px"}
                      >
                        {option.label}
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
                  onClick={onClickAddNetwork}
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

export default NetworkSelect;
