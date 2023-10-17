import type { SerializedNetwork } from "@poktscan/keyring";
import type { RootState } from "../../redux/store";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTheme } from "@mui/material";
import { connect } from "react-redux";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import CircularLoading from "../common/CircularLoading";
import { useAppDispatch } from "../../hooks/redux";
import { removeNetwork as removeNetworkThunk } from "../../redux/slices/vault";
import OperationFailed from "../common/OperationFailed";
import { NETWORKS_PAGE } from "../../constants/routes";
import { enqueueSnackbar } from "../../utils/ui";
import { NetworkItem } from "./List";

interface RemoveNetworkProps {
  networks: SerializedNetwork[];
}

const RemoveNetwork: React.FC<RemoveNetworkProps> = ({ networks }) => {
  const theme = useTheme();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [network, setNetwork] = useState<SerializedNetwork>(null);
  const dispatch = useAppDispatch();
  const [status, setStatus] = useState<"normal" | "loading" | "error">(
    "normal"
  );

  const onCancel = useCallback(() => {
    navigate(`${NETWORKS_PAGE}?tab=customs`);
  }, [navigate, location]);

  useEffect(() => {
    const id = searchParams.get("id");
    const networkFromStore = networks.find((item) => item.id === id);
    if (networkFromStore && network?.id !== id) {
      setNetwork(networkFromStore);
      return;
    }

    if (!networkFromStore) {
      onCancel();
    }
  }, [searchParams, networks]);

  const removeNetwork = useCallback(() => {
    if (network) {
      setStatus("loading");
      dispatch(removeNetworkThunk(network.id))
        .unwrap()
        .then(() => {
          enqueueSnackbar({
            message: `Network removed successfully.`,
            variant: "success",
          });
          navigate(`${NETWORKS_PAGE}?tab=customs`);
        })
        .catch(() => {
          setStatus("error");
        });
    }
  }, [network, dispatch]);

  return useMemo(() => {
    if (status === "loading") {
      return <CircularLoading />;
    }

    if (status === "error") {
      return (
        <OperationFailed
          text={"There was an error removing the network."}
          onCancel={onCancel}
          onRetry={removeNetwork}
        />
      );
    }

    return (
      <Stack flexGrow={1} marginTop={3.5} justifyContent={"space-between"}>
        <Stack flexGrow={1}>
          <Typography
            fontSize={18}
            width={1}
            marginBottom={"30px!important"}
            textAlign={"center"}
            fontWeight={700}
            lineHeight={"28px"}
            color={theme.customColors.primary999}
          >
            Are you sure you want to remove the following network?
          </Typography>
          {network && <NetworkItem network={network} />}
        </Stack>
        <Stack direction={"row"} width={1} spacing={2}>
          <Button
            variant={"outlined"}
            sx={{
              fontWeight: 700,
              color: theme.customColors.dark50,
              borderColor: theme.customColors.dark50,
              height: 36,
              borderWidth: 1.5,
              fontSize: 16,
            }}
            fullWidth
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button
            variant={"contained"}
            sx={{
              fontWeight: 700,
              height: 36,
              fontSize: 16,
            }}
            onClick={removeNetwork}
            fullWidth
          >
            Yes
          </Button>
        </Stack>
      </Stack>
    );
  }, [status, removeNetwork, network, onCancel]);
};

const mapStateToProps = (state: RootState) => ({
  networks: state.vault.entities.networks.list,
});

export default connect(mapStateToProps)(RemoveNetwork);
