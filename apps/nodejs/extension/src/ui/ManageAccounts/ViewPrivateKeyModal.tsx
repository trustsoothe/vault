import type { SerializedAccountReference } from "@poktscan/vault";
import { saveAs } from "file-saver";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { Controller, useForm } from "react-hook-form";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import React, { useEffect, useRef, useState } from "react";
import CircularProgress from "@mui/material/CircularProgress";
import AppToBackground from "../../controllers/communication/AppToBackground";
import { getPortableWalletContent } from "../../utils/networkOperations";
import { labelByProtocolMap } from "../../constants/protocols";
import DialogButtons from "../components/DialogButtons";
import PasswordInput from "../components/PasswordInput";
import AccountInfo from "../components/AccountInfo";
import BaseDialog from "../components/BaseDialog";
import CopyButton from "../components/CopyButton";
import Summary from "../components/Summary";
import { themeColors } from "../theme";

interface PrivateKeyFormValues {
  vaultPassword: string;
}

interface ViewPrivateKeyModalProps {
  account?: SerializedAccountReference;
  onClose: () => void;
}

export default function ViewPrivateKeyModal({
  account,
  onClose,
}: ViewPrivateKeyModalProps) {
  const [status, setStatus] = useState<
    "form" | "loading" | "error" | "view_private_key"
  >("form");

  const lastRevealedPkAccountRef = useRef<SerializedAccountReference>(null);
  const { watch, handleSubmit, reset, control } = useForm<PrivateKeyFormValues>(
    {
      defaultValues: {
        vaultPassword: "",
      },
    }
  );

  const [vaultPassword] = watch(["vaultPassword"]);
  const [wrongVaultPassphrase, setWrongVaultPassphrase] = useState(false);
  const [privateKey, setPrivateKey] = useState<string>(null);

  useEffect(() => {
    if (wrongVaultPassphrase) {
      setWrongVaultPassphrase(false);
    }
  }, [vaultPassword]);

  useEffect(() => {
    let timeout: NodeJS.Timeout;

    if (account) {
      reset({ vaultPassword: "" });
    } else {
      timeout = setTimeout(() => {
        reset({ vaultPassword: "" });
        setStatus("form");
        lastRevealedPkAccountRef.current = undefined;
        setWrongVaultPassphrase(false);
        setPrivateKey(null);
      }, 150);
    }

    return () => {
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, [account]);

  const loadPrivateKey = (data: PrivateKeyFormValues) => {
    const { vaultPassword } = data;
    setStatus("loading");

    AppToBackground.getAccountPrivateKey({
      account,
      vaultPassword,
    }).then((response) => {
      if (response.error) {
        setStatus("error");
      } else {
        const data = response.data;
        if (data.isVaultPasswordWrong) {
          setWrongVaultPassphrase(true);
          setStatus("form");
        } else if (data.privateKey) {
          setPrivateKey(data.privateKey);
          setStatus("view_private_key");
          lastRevealedPkAccountRef.current = account;
        }
      }
    });
  };

  const exportPortableWallet = () => {
    if (privateKey) {
      getPortableWalletContent(privateKey, vaultPassword, account.protocol)
        .then((json) => {
          const blob = new Blob([json], {
            type: "application/json",
          });
          saveAs(blob, "keyfile.json");
        })
        .catch((e) => {
          console.log(e);
        });
    }
  };

  let content: React.ReactNode;

  switch (status) {
    case "form":
      content = (
        <>
          <DialogContent sx={{ padding: "20px 24px!important" }}>
            <Typography fontSize={11} lineHeight={"16px"}>
              To reveal this account’s Private Key, please enter the vault’s
              password:
            </Typography>
            <Controller
              control={control}
              name={"vaultPassword"}
              render={({ field, fieldState: { error } }) => (
                <PasswordInput
                  required
                  autoFocus
                  {...field}
                  disabled={status !== "form"}
                  placeholder={"Vault Password"}
                  error={!!error || wrongVaultPassphrase}
                  helperText={
                    wrongVaultPassphrase ? "Wrong password" : error?.message
                  }
                  sx={{
                    marginTop: 1.2,
                    marginBottom: !!error || wrongVaultPassphrase ? 1 : 0,
                    "& .MuiFormHelperText-root": {
                      fontSize: 10,
                    },
                  }}
                />
              )}
            />
          </DialogContent>
          <DialogActions sx={{ height: 85, padding: 0 }}>
            <DialogButtons
              primaryButtonProps={{
                children: "Reveal",
                disabled: !vaultPassword || status !== "form",
                type: "submit",
              }}
              secondaryButtonProps={{ children: "Cancel", onClick: onClose }}
            />
          </DialogActions>
        </>
      );
      break;
    case "loading":
      content = (
        <DialogContent>
          <CircularProgress size={80} />
        </DialogContent>
      );
      break;
    case "error":
      break;
    case "view_private_key":
      content = (
        <>
          <DialogContent sx={{ padding: "24px!important" }}>
            <Summary
              rows={[
                {
                  type: "row",
                  label: "Account",
                  value: (
                    <AccountInfo
                      address={
                        (account || lastRevealedPkAccountRef.current)
                          ?.address || ""
                      }
                      name={(account || lastRevealedPkAccountRef.current)?.name}
                    />
                  ),
                },
                {
                  type: "row",
                  label: "Protocol",
                  value:
                    labelByProtocolMap[
                      (account || lastRevealedPkAccountRef.current)?.protocol
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
              <Typography variant={"subtitle2"} sx={{ wordBreak: "break-all" }}>
                {privateKey}
              </Typography>
              <Stack direction={"row"} spacing={1.2} alignItems={"center"}>
                <CopyButton label={"Copy"} textToCopy={privateKey} />
                <Button
                  fullWidth
                  onClick={exportPortableWallet}
                  sx={{
                    backgroundColor: themeColors.white,
                    boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.08)",
                  }}
                >
                  Download
                </Button>
              </Stack>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ height: 85, padding: 0 }}>
            <DialogButtons
              primaryButtonProps={{
                children: "Done",
                onClick: onClose,
              }}
            />
          </DialogActions>
        </>
      );
      break;
  }

  return (
    <BaseDialog
      open={!!account}
      onClose={onClose}
      title={"View Private Key"}
      PaperProps={{
        component: "form",
        onSubmit: handleSubmit(loadPrivateKey),
      }}
    >
      {content}
    </BaseDialog>
  );
}
