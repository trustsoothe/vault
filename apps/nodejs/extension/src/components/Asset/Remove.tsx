import type { SerializedAsset } from "@poktscan/keyring";
import React, { useCallback, useMemo, useState } from "react";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import CircularLoading from "../common/CircularLoading";
import { useAppDispatch } from "../../hooks/redux";
import { removeAsset as removeAssetThunk } from "../../redux/slices/vault";

interface RemoveAssetProps {
  asset: SerializedAsset;
  onClose: () => void;
}

const RemoveAsset: React.FC<RemoveAssetProps> = ({ asset, onClose }) => {
  const dispatch = useAppDispatch();

  const [status, setStatus] = useState<
    "normal" | "loading" | "removed" | "error"
  >("normal");

  const removeAsset = useCallback(() => {
    if (asset) {
      setStatus("loading");
      dispatch(removeAssetThunk(asset.id))
        .unwrap()
        .then(() => {
          setStatus("removed");
        })
        .catch(() => setStatus("error"));
    }
  }, [asset, dispatch]);

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
          <Typography>The asset was removed successfully.</Typography>
          <Button sx={{ textTransform: "none" }} onClick={onClose}>
            Go to Asset List
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
          <Typography>There was an error removing the asset.</Typography>
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
              onClick={removeAsset}
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
          <span style={{ fontWeight: 600 }}>"{asset.name}"</span> asset?
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
            onClick={removeAsset}
            fullWidth
          >
            Yes
          </Button>
        </Stack>
      </Stack>
    );
  }, [status, removeAsset, asset, onClose]);
};

export default RemoveAsset;
