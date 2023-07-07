import type { SerializedNetwork } from "@poktscan/keyring";
import React, { useCallback, useMemo, useState } from "react";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import CircularLoading from "../common/CircularLoading";
import { useAppDispatch } from "../../hooks/redux";
import { removeNetwork as removeNetworkThunk } from "../../redux/slices/vault";

interface RemoveNetworkProps {
  network: SerializedNetwork;
  onClose: () => void;
}

const RemoveNetwork: React.FC<RemoveNetworkProps> = ({ network, onClose }) => {
  const dispatch = useAppDispatch();
  const [status, setStatus] = useState<
    "normal" | "loading" | "removed" | "error"
  >("normal");

  const removeNetwork = useCallback(() => {
    if (network) {
      setStatus("loading");
      dispatch(removeNetworkThunk(network.id))
        .unwrap()
        .then(() => {
          setStatus("removed");
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

    if (status === "removed") {
      return (
        <Stack
          flexGrow={1}
          alignItems={"center"}
          justifyContent={"center"}
          marginTop={"-40px"}
        >
          <Typography>The network was removed successfully.</Typography>
          <Button sx={{ textTransform: "none" }} onClick={onClose}>
            Go to Network List
          </Button>
        </Stack>
      );
    }

    if (status === "error") {
      return (
        <Stack
          flexGrow={1}
          alignItems={"center"}
          justifyContent={"center"}
          marginTop={"-40px"}
          spacing={"10px"}
        >
          <Typography>There was an error removing the network.</Typography>
          <Stack direction={"row"} width={250} spacing={"15px"}>
            <Button
              variant={"outlined"}
              sx={{ textTransform: "none", height: 30, fontWeight: 500 }}
              fullWidth
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              variant={"contained"}
              sx={{ textTransform: "none", height: 30, fontWeight: 600 }}
              fullWidth
              onClick={removeNetwork}
            >
              Retry
            </Button>
          </Stack>
        </Stack>
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
          <span style={{ fontWeight: 600 }}>"{network.name}"</span> network?
        </Typography>
        <Stack direction={"row"} width={250} spacing={"15px"}>
          <Button
            variant={"outlined"}
            sx={{ textTransform: "none", height: 30, fontWeight: 500 }}
            fullWidth
            onClick={onClose}
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
  }, [status, removeNetwork, network, onClose]);
};

export default RemoveNetwork;
