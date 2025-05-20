import type { SerializedAccountReference } from "@soothe/vault";
import { saveAs } from "file-saver";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { Controller, useForm } from "react-hook-form";
import { closeSnackbar, SnackbarKey } from "notistack";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import React, { useEffect, useRef, useState } from "react";
import AppToBackground from "../../controllers/communication/AppToBackground";
import { enqueueErrorSnackbar, wrongPasswordSnackbar } from "../../utils/ui";
import { getPortableWalletContent } from "../../utils/networkOperations";
import { labelByProtocolMap } from "../../constants/protocols";
import DialogButtons from "../components/DialogButtons";
import PasswordInput from "../components/PasswordInput";
import AccountInfo from "../components/AccountInfo";
import BaseDialog from "../components/BaseDialog";
import CopyButton from "../components/CopyButton";
import Summary from "../components/Summary";
import { themeColors } from "../theme";
import IconButton from "@mui/material/IconButton";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";

interface ViewPublicKeyModalProps {
  account?: SerializedAccountReference;
  onClose: () => void;
}

export default function ViewPublicKeyModal({
  account,
  onClose,
}: ViewPublicKeyModalProps) {
  const errorSnackbarKey = useRef<SnackbarKey>();

  const lastRevealedPublicKeyAccountRef =
    useRef<SerializedAccountReference>(null);
  const [publicKey, setPublicKey] = useState<string>(null);

  const closeSnackbars = () => {
    if (errorSnackbarKey.current) {
      closeSnackbar(errorSnackbarKey.current);
      errorSnackbarKey.current = null;
    }
  };

  useEffect(() => {
    let timeout: NodeJS.Timeout;

    if (account) {
      setPublicKey(account.publicKey);
    }

    if (!account) {
      timeout = setTimeout(() => {
        lastRevealedPublicKeyAccountRef.current = undefined;
        setPublicKey(null);
      }, 150);
    }

    closeSnackbars();

    return () => {
      closeSnackbars();
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, [account]);

  return (
    <BaseDialog open={!!account} onClose={onClose} title={"View Public Key"}>
      <DialogContent sx={{ padding: "24px!important" }}>
        <Summary
          rows={[
            {
              type: "row",
              label: "Account",
              value: (
                <AccountInfo
                  address={
                    (account || lastRevealedPublicKeyAccountRef.current)
                      ?.address || ""
                  }
                  name={
                    (account || lastRevealedPublicKeyAccountRef.current)?.name
                  }
                />
              ),
            },
            {
              type: "row",
              label: "Protocol",
              value:
                labelByProtocolMap[
                  (account || lastRevealedPublicKeyAccountRef.current)?.protocol
                ],
            },
          ]}
        />
        <Stack
          spacing={1.2}
          marginTop={1.6}
          borderRadius={"8px"}
          padding={"8px 14px"}
          bgcolor={themeColors.bgLightGray}
        >
          <Stack direction={"row"} spacing={0.7}>
            <Typography variant={"subtitle2"} sx={{ wordBreak: "break-all" }}>
              {publicKey}
            </Typography>
          </Stack>

          <Stack direction={"row"} spacing={1.2} alignItems={"center"}>
            <CopyButton label={"Copy"} textToCopy={publicKey} />
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ padding: 0, height: 56 }}>
        <DialogButtons
          primaryButtonProps={{
            children: "Done",
            onClick: onClose,
          }}
        />
      </DialogActions>
    </BaseDialog>
  );
}
