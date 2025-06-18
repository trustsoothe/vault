import orderBy from "lodash/orderBy";
import React, {useState} from "react";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import Button from "@mui/material/Button";
import { useNavigate } from "react-router-dom";
import Typography from "@mui/material/Typography";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import { useAppDispatch, useAppSelector } from "../../hooks/redux";
import SelectedIcon from "../../assets/img/check_icon.svg";
import { NETWORKS_PAGE } from "../../../constants/routes";
import BaseDialog from "../../components/BaseDialog";
import { NetworkOption } from "./NetworkSelect";
import {
    networksCanBeSelectedSelector,
    selectableNetworksSelector,
    selectedChainSelector,
    selectedProtocolSelector,
    showTestNetworkSelector,
} from "../../../redux/selectors/network";
import {
    changeSelectedNetwork,
    toggleShowTestNetworks,
    NetworkNotice as NetworkTagType, Network,
} from "../../../redux/slices/app";
import { themeColors } from "../../theme";
import NetworkNoticeTag from "./NetworkNoticeTag";
import {enqueueSnackbar} from "../../../utils/ui";
import {closeSnackbar} from "notistack";

interface NetworkSelectModalProps {
  open: boolean;
  onClose: () => void;
}

export default function NetworkSelectModal({
  open,
  onClose,
}: NetworkSelectModalProps) {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [currentSnackbarKey, setCurrentSnackbarKey] = useState(null);
  const selectedProtocol = useAppSelector(selectedProtocolSelector);
  const selectedChain = useAppSelector(selectedChainSelector);
  const showTestNetworks = useAppSelector(showTestNetworkSelector);

  const onClickAddNetwork = () => {
    onClose();
    navigate(`${NETWORKS_PAGE}?adding=true`);
  };

  const onChangeShowTestNetworks = () => {
    dispatch(toggleShowTestNetworks());
  };

  const handleChangeNetwork = (option: NetworkOption) => {
    dispatch(
      changeSelectedNetwork({
        network: option.protocol,
        chainId: option.chainId,
      })
    );
    onClose();
  };

  const showNetworkTagSnackbar = (tag: NetworkTagType) => {
    if (currentSnackbarKey) {
      closeSnackbar(currentSnackbarKey); // Close the current snackbar
    }

    const newKey = enqueueSnackbar({
      key: tag.name,
      variant: "info",
      message: {
        title: tag.descriptionTitle,
        content: tag.descriptionContent,
      }
    });

    setCurrentSnackbarKey(newKey);
  }

  const optionsToShow: Network[] = useAppSelector(selectableNetworksSelector);

  return (
    <BaseDialog open={open} onClose={onClose} title={"Select Network"}>
      <DialogContent
        sx={{
          rowGap: 0.2,
          display: "flex",
          flexDirection: "column",
          paddingX: "8px!important",
          paddingY: "16px!important",
          backgroundColor: themeColors.white,
        }}
      >
        {optionsToShow.map((option) => {
          const isSelected =
            selectedProtocol === option.protocol &&
            selectedChain === option.chainId;

          const labelMaxLength = option.notices?.length > 0 ? 150 : 180;

          return (
            <Button
              key={option.protocol + option.chainId}
              fullWidth
              sx={{
                height: 45,
                padding: 1.5,
                fontWeight: "400",
                borderRadius: "8px",
                color: themeColors.black,
                backgroundColor: isSelected
                  ? themeColors.bgLightGray
                  : themeColors.white,
                justifyContent: "space-between",
              }}
              onClick={() => {
                if (!isSelected) {
                  handleChangeNetwork(option);
                } else {
                  onClose();
                }
              }}
            >
              <Stack direction={"row"} alignItems={"center"} spacing={1.2}>
                <img
                  width={15}
                  height={15}
                  src={option.iconUrl}
                  alt={`${option.protocol}-${option.chainId}-img`}
                />
                <Stack direction="row" justifyContent="space-between" spacing={4} alignItems="center">
                  <Stack
                    alignItems="flex-start"
                  >
                    <Typography
                      variant="subtitle2"
                      sx={{
                        maxWidth: `${labelMaxLength}px`,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {option.label}
                    </Typography>
                    <Typography
                      variant={"body2"}
                      sx={{
                        color: themeColors.textSecondary,
                      }}
                      >
                      {option.wip?.descriptionTitle ?? ''}
                    </Typography>
                  </Stack>
                </Stack>
              </Stack>
              <Stack direction={"row"} alignItems={"center"} justifyContent={'flex-end'} spacing={1.2}>
                {
                  (option.notices || []).map((notice) => (
                    <NetworkNoticeTag
                      key={notice.name}
                      notice={notice}
                      onClick={showNetworkTagSnackbar}
                    />
                  ))
                }
                <div style={{
                  minWidth: 10,
                }}>
                  {isSelected && <SelectedIcon />}
                </div>
              </Stack>
            </Button>
          );
        })}
      </DialogContent>
      <DialogActions
        sx={{
          width: 1,
          rowGap: 2,
          height: 122,
          padding: 2.4,
          display: "flex",
          flexDirection: "column",
          boxSizing: "border-box",
          backgroundColor: themeColors.bgLightGray,
          borderTop: `1px solid ${themeColors.borderLightGray}`,
        }}
      >
        <Stack
          width={1}
          spacing={2}
          direction={"row"}
          alignItems={"center"}
          justifyContent={"space-between"}
        >
          <Typography variant={"subtitle2"}>Show Test Networks</Typography>
          <Switch
            size={"small"}
            onClick={onChangeShowTestNetworks}
            checked={showTestNetworks}
          />
        </Stack>
        <Button fullWidth variant={"contained"} onClick={onClickAddNetwork}>
          Add Network
        </Button>
      </DialogActions>
    </BaseDialog>
  );
}
