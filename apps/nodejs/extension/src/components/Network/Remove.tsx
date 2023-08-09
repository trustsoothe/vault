import type { SerializedNetwork } from "@poktscan/keyring";
import type { RootState } from "../../redux/store";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { connect } from "react-redux";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import { enqueueSnackbar } from "notistack";
import Typography from "@mui/material/Typography";
import CircularLoading from "../common/CircularLoading";
import { useAppDispatch } from "../../hooks/redux";
import { removeNetwork as removeNetworkThunk } from "../../redux/slices/vault";
import OperationFailed from "../common/OperationFailed";
import { NETWORKS_PAGE } from "../../constants/routes";

interface RemoveNetworkProps {
  networks: SerializedNetwork[];
}

const RemoveNetwork: React.FC<RemoveNetworkProps> = ({ networks }) => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [network, setNetwork] = useState<SerializedNetwork>(null);
  const dispatch = useAppDispatch();
  const [status, setStatus] = useState<"normal" | "loading" | "error">(
    "normal"
  );

  const onCancel = useCallback(() => {
    if (location.key !== "default") {
      navigate(-1);
    } else {
      navigate(NETWORKS_PAGE);
    }
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
            style: { width: 225, minWidth: "225px!important" },
            message: `Network removed successfully.`,
            variant: "success",
            autoHideDuration: 3000,
          });
          navigate(NETWORKS_PAGE);
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
      <Stack
        flexGrow={1}
        alignItems={"center"}
        justifyContent={"center"}
        spacing={"15px"}
      >
        <Typography fontSize={16} textAlign={"center"}>
          Are you sure you want to remove the{" "}
          <span style={{ fontWeight: 600 }}>"{network?.name}"</span> network?
        </Typography>
        <Stack direction={"row"} width={250} spacing={"15px"}>
          <Button
            variant={"outlined"}
            sx={{ textTransform: "none", height: 30, fontWeight: 500 }}
            fullWidth
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button
            variant={"contained"}
            sx={{ textTransform: "none", height: 30, fontWeight: 600 }}
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
