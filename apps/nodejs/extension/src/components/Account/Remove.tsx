import React, { useCallback, useMemo, useState } from "react";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import CircularLoading from "../common/CircularLoading";

interface RemoveAccountProps {
  account: string;
  onClose: () => void;
}

const RemoveAccount: React.FC<RemoveAccountProps> = ({ account, onClose }) => {
  const [status, setStatus] = useState<
    "normal" | "loading" | "removed" | "error"
  >("normal");

  const removeAccount = useCallback(() => {
    setStatus("loading");
    setTimeout(() => setStatus("removed"), 1000);
  }, []);

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
          <Typography>The account was removed successfully.</Typography>
          <Button sx={{ textTransform: "none" }} onClick={onClose}>
            Go to Account List
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
          <Typography>There was an error removing the account.</Typography>
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
              onClick={removeAccount}
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
          <span style={{ fontWeight: 600 }}>"{account}"</span> account?
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
            onClick={removeAccount}
            fullWidth
          >
            Yes
          </Button>
        </Stack>
      </Stack>
    );
  }, [status, removeAccount, account, onClose]);
};

export default RemoveAccount;
