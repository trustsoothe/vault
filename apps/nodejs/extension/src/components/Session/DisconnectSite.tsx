import type { Session } from "@poktscan/keyring";
import React, { useCallback, useMemo, useState } from "react";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import CircularLoading from "../common/CircularLoading";
import AppToBackground from "../../controllers/communication/AppToBackground";
import OperationFailed from "../common/OperationFailed";

interface DisconnectSiteProps {
  session: Session;
  onClose: () => void;
}

const DisconnectSite: React.FC<DisconnectSiteProps> = ({
  session,
  onClose,
}) => {
  const [status, setStatus] = useState<
    "normal" | "loading" | "removed" | "error"
  >("normal");

  const disconnect = useCallback(() => {
    setStatus("loading");
    AppToBackground.revokeSession(session.id).then((result) =>
      setStatus(result.error ? "error" : "removed")
    );
  }, [session]);

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
          <Typography>The website was successfully disconnected.</Typography>
          <Button sx={{ textTransform: "none" }} onClick={onClose}>
            Go to Account List
          </Button>
        </Stack>
      );
    }

    if (status === "error") {
      return (
        <OperationFailed
          text={"There was an error disconnecting the website."}
          onCancel={onClose}
          onRetry={disconnect}
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
          Are you sure you want to disconnect
          <span style={{ fontWeight: 600 }}>
            "{session.origin?.value}"
          </span>{" "}
          website?
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
            onClick={disconnect}
            fullWidth
          >
            Yes
          </Button>
        </Stack>
      </Stack>
    );
  }, [status, disconnect, session, onClose]);
};

export default DisconnectSite;
