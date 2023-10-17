import type { SerializedAccountReference } from "@poktscan/keyring";
import type { RootState } from "../../redux/store";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { saveAs } from "file-saver";
import { connect } from "react-redux";
import Stack from "@mui/material/Stack";
import { useTheme } from "@mui/material";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import Tooltip from "@mui/material/Tooltip";
import Skeleton from "@mui/material/Skeleton";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import { FormProvider, useForm } from "react-hook-form";
import Password from "../common/Password";
import AccountsAutocomplete from "./Autocomplete";
import CopyIcon from "../../assets/img/copy_icon.svg";
import { ACCOUNTS_PAGE } from "../../constants/routes";
import OperationFailed from "../common/OperationFailed";
import DownloadIcon from "../../assets/img/download_icon.svg";
import { getPortableWalletContent } from "../../utils/networkOperations";
import AppToBackground from "../../controllers/communication/AppToBackground";

interface ViewPrivateKeyProps {
  accounts: RootState["vault"]["entities"]["accounts"]["list"];
}

interface PrivateKeyFormValues {
  account_password: string;
  vault_password: string;
}

const ViewPrivateKey: React.FC<ViewPrivateKeyProps> = ({ accounts }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [account, setAccount] = useState<SerializedAccountReference>(null);
  const methods = useForm<PrivateKeyFormValues>({
    defaultValues: {
      account_password: "",
      vault_password: "",
    },
  });

  const { watch, handleSubmit, reset } = methods;

  const [accountPassword, vaultPassword] = watch([
    "account_password",
    "vault_password",
  ]);
  const [showCopyKeyTooltip, setShowCopyKeyTooltip] = useState(false);
  const [wrongAccountPassphrase, setWrongAccountPassphrase] = useState(false);
  const [wrongVaultPassphrase, setWrongVaultPassphrase] = useState(false);
  const [loadingPrivateKey, setLoadingPrivateKey] = useState(false);
  const [privateKey, setPrivateKey] = useState<string>(null);
  const [errorPrivateKey, setErrorPrivateKey] = useState(false);

  useEffect(() => {
    if (wrongAccountPassphrase) {
      setWrongAccountPassphrase(false);
    }
  }, [accountPassword]);

  useEffect(() => {
    if (wrongVaultPassphrase) {
      setWrongVaultPassphrase(false);
    }
  }, [vaultPassword]);

  useEffect(() => {
    const id = searchParams.get("id");
    const accountFromStore = accounts.find((item) => item.id === id);
    if (accountFromStore && account?.id !== id) {
      setAccount(accountFromStore);
      return;
    }

    if (!accountFromStore && !account) {
      navigate(ACCOUNTS_PAGE);
    }
  }, [searchParams, accounts]);

  const onChangeAccount = useCallback(
    (newAccount: SerializedAccountReference) => {
      setAccount(newAccount);
      setShowCopyKeyTooltip(false);
      setWrongAccountPassphrase(false);
      setWrongVaultPassphrase(false);
      setLoadingPrivateKey(false);
      setPrivateKey(null);
      setErrorPrivateKey(false);
      reset({
        account_password: "",
        vault_password: "",
      });
      setSearchParams((prev) => {
        prev.set("id", newAccount.id);
        return prev;
      });
    },
    [reset]
  );

  const loadPrivateKey = useCallback(
    (data: PrivateKeyFormValues) => {
      const { account_password, vault_password } = data;
      setLoadingPrivateKey(true);

      AppToBackground.getAccountPrivateKey({
        account,
        accountPassword: account_password,
        vaultPassword: vault_password,
      }).then((response) => {
        if (response.error) {
          setErrorPrivateKey(true);
        } else {
          const data = response.data;
          if (data.isAccountPasswordWrong) {
            setWrongAccountPassphrase(true);
          } else if (data.isVaultPasswordWrong) {
            setWrongVaultPassphrase(true);
          } else if (data.privateKey) {
            setPrivateKey(data.privateKey);
          }
        }
        setLoadingPrivateKey(false);
      });
    },
    [account]
  );

  const exportPortableWallet = useCallback(() => {
    if (privateKey && accountPassword) {
      getPortableWalletContent(privateKey, accountPassword)
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
  }, [privateKey, accountPassword]);

  const handleCopyPrivateKey = useCallback(() => {
    if (privateKey) {
      navigator.clipboard.writeText(privateKey).then(() => {
        setShowCopyKeyTooltip(true);
        setTimeout(() => setShowCopyKeyTooltip(false), 500);
      });
    }
  }, [privateKey]);

  const onClickDone = useCallback(() => {
    navigate(ACCOUNTS_PAGE);
  }, [navigate]);

  const showingPk = !!privateKey || loadingPrivateKey || errorPrivateKey;
  const privateKeyComponent = useMemo(() => {
    const text = showingPk ? "Private Key" : "Account & Vault Password";

    const title = (
      <Typography
        fontSize={14}
        fontWeight={500}
        lineHeight={"30px"}
        letterSpacing={"0.5px"}
        sx={{ userSelect: "none" }}
      >
        {text}
      </Typography>
    );

    if (showingPk) {
      const header = (
        <Stack
          direction={"row"}
          alignItems={"center"}
          justifyContent={"space-between"}
          sx={{
            "& path, rect": {
              stroke: !privateKey ? theme.customColors.dark25 : undefined,
            },
          }}
        >
          {title}
          <Stack direction={"row"} alignItems={"center"}>
            <Tooltip title={"Copied"} open={showCopyKeyTooltip}>
              <IconButton
                disabled={!privateKey}
                onClick={handleCopyPrivateKey}
                sx={{ width: 30, height: 30 }}
              >
                <CopyIcon />
              </IconButton>
            </Tooltip>

            <IconButton disabled={!privateKey} onClick={exportPortableWallet}>
              <DownloadIcon />
            </IconButton>
          </Stack>
        </Stack>
      );

      if (loadingPrivateKey) {
        return (
          <>
            {header}
            <Stack
              borderRadius={"2px"}
              border={`1px solid ${theme.customColors.dark25}`}
              spacing={0.7}
              paddingY={0.7}
              paddingX={1}
              height={72}
              boxSizing={"border-box"}
              marginTop={"10px!important"}
            >
              <Skeleton width={"100%"} height={14} variant={"rectangular"} />
              <Skeleton width={"100%"} height={14} variant={"rectangular"} />
              <Skeleton width={164} height={14} variant={"rectangular"} />
            </Stack>
          </>
        );
      }

      if (errorPrivateKey) {
        return (
          <>
            {header}
            <Stack marginTop={"10px!important"}>
              <OperationFailed
                text={"Error loading private key."}
                textProps={{
                  fontSize: 14,
                  width: "auto",
                }}
                containerProps={{
                  direction: "row",
                }}
                buttonsContainerProps={{
                  width: 50,
                  marginLeft: "5px!important",
                }}
                retryBtnProps={{
                  variant: "text",
                  sx: {
                    width: 50,
                    minWidth: 50,
                    color: theme.customColors.primary500,
                    textDecoration: "underline",
                    "&:hover": {
                      textDecoration: "underline",
                    },
                  },
                }}
              />
            </Stack>
          </>
        );
      }

      return (
        <>
          {header}
          {privateKey && (
            <Stack
              borderRadius={"2px"}
              border={`1px solid ${theme.customColors.primary250}`}
              spacing={0.5}
              paddingY={0.5}
              paddingX={1}
              marginTop={"10px!important"}
            >
              <Typography
                color={theme.customColors.dark100}
                fontSize={12}
                lineHeight={"20px"}
                sx={{
                  wordBreak: "break-all",
                }}
              >
                {privateKey}
              </Typography>
            </Stack>
          )}
        </>
      );
    }

    return (
      <>
        {title}
        <FormProvider {...methods}>
          <Password
            passwordName={"account_password"}
            confirmPasswordName={"vault_password"}
            labelPassword={"Account Password"}
            labelConfirm={"Vault Password"}
            canGenerateRandom={false}
            hidePasswordStrong={true}
            passwordAndConfirmEquals={false}
            justRequire={true}
            errorPassword={
              wrongAccountPassphrase ? "Wrong Password" : undefined
            }
            errorConfirm={wrongVaultPassphrase ? "Wrong Password" : undefined}
            containerProps={{ spacing: 0.5, marginTop: "15px!important" }}
            inputsContainerProps={{ spacing: 2 }}
          />
        </FormProvider>
      </>
    );
  }, [
    theme,
    methods,
    showingPk,
    wrongAccountPassphrase,
    wrongVaultPassphrase,
    privateKey,
    errorPrivateKey,
    loadingPrivateKey,
    showCopyKeyTooltip,
    exportPortableWallet,
    handleCopyPrivateKey,
  ]);

  return (
    <Stack
      flexGrow={1}
      marginTop={2}
      justifyContent={"space-between"}
      component={"form"}
      onSubmit={handleSubmit(loadPrivateKey)}
    >
      <Stack spacing={1.5} flexGrow={1}>
        <AccountsAutocomplete
          selectedAccount={account}
          onChangeSelectedAccount={onChangeAccount}
        />
        <Divider sx={{ borderColor: theme.customColors.dark25 }} />
        {privateKeyComponent}
      </Stack>
      <Stack direction={"row"} spacing={2} width={1} marginTop={2.5}>
        {showingPk ? (
          <Button
            sx={{
              fontWeight: 700,
              height: 36,
              fontSize: 16,
            }}
            onClick={onClickDone}
            variant={"contained"}
            fullWidth
          >
            Done
          </Button>
        ) : (
          <>
            <Button
              sx={{
                fontWeight: 700,
                color: theme.customColors.dark50,
                borderColor: theme.customColors.dark50,
                height: 36,
                borderWidth: 1.5,
                fontSize: 16,
              }}
              variant={"outlined"}
              onClick={onClickDone}
              fullWidth
            >
              Cancel
            </Button>
            <Button
              sx={{
                fontWeight: 700,
                height: 36,
                fontSize: 16,
              }}
              variant={"contained"}
              fullWidth
              type={"submit"}
            >
              View
            </Button>
          </>
        )}
      </Stack>
    </Stack>
  );
};

const mapStateToProps = (state: RootState) => ({
  accounts: state.vault.entities.accounts.list,
});

export default connect(mapStateToProps)(ViewPrivateKey);
