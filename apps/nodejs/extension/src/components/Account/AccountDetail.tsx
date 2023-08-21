import type { SerializedAccountReference } from "@poktscan/keyring";
import type { RootState } from "../../redux/store";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import Stack, { type StackProps } from "@mui/material/Stack";
import { saveAs } from "file-saver";
import { connect } from "react-redux";
import Button from "@mui/material/Button";
import Tooltip from "@mui/material/Tooltip";
import Skeleton from "@mui/material/Skeleton";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import CopyIcon from "@mui/icons-material/ContentCopy";
import { FormProvider, useForm } from "react-hook-form";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import { useNavigate, useSearchParams } from "react-router-dom";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import { SupportedProtocols } from "@poktscan/keyring";
import { labelByChainID, labelByProtocolMap } from "../../constants/protocols";
import { getAccountBalance } from "../../redux/slices/vault";
import { useAppDispatch } from "../../hooks/redux";
import OperationFailed from "../common/OperationFailed";
import {
  ACCOUNTS_PAGE,
  IMPORT_ACCOUNT_PAGE,
  REMOVE_ACCOUNT_PAGE,
  TRANSFER_PAGE,
  UPDATE_ACCOUNT_PAGE,
} from "../../constants/routes";
import Password from "../common/Password";
import AppToBackground from "../../controllers/communication/AppToBackground";
import { getPortableWalletContent } from "../../utils/networkOperations";

interface AccountDetailProps {
  accounts: RootState["vault"]["entities"]["accounts"]["list"];
}

interface DetailComponentProps {
  account: SerializedAccountReference;
  onUpdate?: () => void;
  containerProps?: StackProps;
  hideName?: boolean;
  hideCopy?: boolean;
}

export const DetailComponent: React.FC<DetailComponentProps> = ({
  account,
  onUpdate,
  containerProps,
  hideName,
  hideCopy = false,
}) => {
  const dispatch = useAppDispatch();
  const [showCopyAddressTooltip, setShowCopyAddressTooltip] = useState(false);
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [errorBalance, setErrorBalance] = useState(false);
  const [balance, setBalance] = useState(0);

  const getBalance = useCallback(() => {
    if (account?.address) {
      setLoadingBalance(true);
      dispatch(
        getAccountBalance({
          address: account.address,
          protocol: account.protocol,
        })
      )
        .unwrap()
        .then((result) => {
          if (result) {
            setBalance(result.amount);
            setErrorBalance(false);
          }
        })
        .catch(() => setErrorBalance(true))
        .finally(() => setLoadingBalance(false));
    }
  }, [account?.address, account?.protocol?.name, account?.protocol?.chainID]);

  useEffect(() => {
    if (loadingBalance) return;
    getBalance();
  }, [getBalance]);

  const handleCopyAddress = useCallback(() => {
    if (account?.address) {
      navigator.clipboard.writeText(account.address).then(() => {
        setShowCopyAddressTooltip(true);
        setTimeout(() => setShowCopyAddressTooltip(false), 300);
      });
    }
  }, [account?.address]);

  const balanceComponent = useMemo(() => {
    let component: React.ReactNode;
    if (loadingBalance) {
      component = <Skeleton width={150} height={18} variant={"rectangular"} />;
    } else if (errorBalance) {
      component = (
        <Typography
          fontSize={12}
          color={"red"}
          textAlign={"center"}
          lineHeight={"24px"}
        >
          Error getting balance.{" "}
          <span
            style={{
              textDecoration: "underline",
              fontWeight: 600,
              cursor: "pointer",
            }}
            onClick={getBalance}
          >
            Retry
          </span>
        </Typography>
      );
    } else {
      component = (
        <Typography fontSize={14} lineHeight={"24px"} textAlign={"center"}>
          Balance: <b> {balance} POKT</b>
        </Typography>
      );
    }

    return (
      <Stack alignItems={"center"} justifyContent={"center"} height={24}>
        {component}
      </Stack>
    );
  }, [balance, loadingBalance, errorBalance, getBalance]);

  return (
    <Stack width={360} mt={"100px"} {...containerProps}>
      <Stack
        direction={"row"}
        alignItems={"center"}
        justifyContent={"center"}
        width={1}
        spacing={"10px"}
        display={hideName ? "none" : "flex"}
      >
        <Typography>
          Name: <b>{account?.name}</b>
        </Typography>
        {onUpdate && (
          <IconButton sx={{ padding: 0 }} onClick={onUpdate}>
            <EditOutlinedIcon sx={{ fontSize: 20 }} />
          </IconButton>
        )}
      </Stack>
      {balanceComponent}
      <Stack
        mt={"5px"}
        direction={"row"}
        alignItems={"center"}
        justifyContent={"center"}
        width={1}
        spacing={"10px"}
      >
        <Typography fontSize={14}>{account?.address}</Typography>
        {!hideCopy && (
          <Tooltip title={"Copied"} open={showCopyAddressTooltip}>
            <IconButton sx={{ padding: 0 }} onClick={handleCopyAddress}>
              <CopyIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
        )}
      </Stack>
      <Stack
        mt={"5px"}
        direction={"row"}
        alignItems={"center"}
        justifyContent={"center"}
        width={1}
        spacing={"10px"}
      >
        <Typography fontSize={14}>
          Protocol: {labelByProtocolMap[account?.protocol?.name]}
        </Typography>
        <Typography fontSize={14}>
          ChainID: {labelByChainID[account?.protocol?.chainID]}
        </Typography>
      </Stack>
    </Stack>
  );
};

interface AccountPrivateKeyProps {
  account: SerializedAccountReference;
}

interface PrivateKeyFormValues {
  account_password: string;
  vault_password: string;
}

const AccountPrivateKey: React.FC<AccountPrivateKeyProps> = ({ account }) => {
  const methods = useForm<PrivateKeyFormValues>({
    defaultValues: {
      account_password: "",
      vault_password: "",
    },
  });
  const { watch, handleSubmit, reset } = methods;

  const [showCopyKeyTooltip, setShowCopyKeyTooltip] = useState(false);
  const [wrongAccountPassphrase, setWrongAccountPassphrase] = useState(false);
  const [wrongVaultPassphrase, setWrongVaultPassphrase] = useState(false);
  const [loadingPrivateKey, setLoadingPrivateKey] = useState(false);
  const [privateKey, setPrivateKey] = useState<string>(null);
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [errorPrivateKey, setErrorPrivateKey] = useState(false);

  const [accountPassword, vaultPassword] = watch([
    "account_password",
    "vault_password",
  ]);

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

  const toggleShowPrivateKey = useCallback(() => {
    setShowPrivateKey((prevState) => !prevState);
  }, []);

  const onCancelErrPrivateKey = useCallback(() => {
    setLoadingPrivateKey(false);
    setPrivateKey(null);
    setErrorPrivateKey(null);
    setShowPrivateKey(null);
    setWrongVaultPassphrase(false);
    setWrongAccountPassphrase(false);
    reset(
      {
        account_password: "",
        vault_password: "",
      },
      { keepErrors: false }
    );
  }, [reset]);

  const content = useMemo(() => {
    if (loadingPrivateKey) {
      return (
        <Stack height={110} alignItems={"center"} justifyContent={"center"}>
          <Typography textAlign={"center"}>Loading Private Key...</Typography>
        </Stack>
      );
    }

    if (errorPrivateKey) {
      return (
        <OperationFailed
          containerProps={{
            height: 110,
            alignItems: "center",
            justifyContent: "center",
          }}
          text={"There was an error loading the private key."}
          onCancel={onCancelErrPrivateKey}
        />
      );
    }

    if (privateKey) {
      return (
        <>
          <Stack
            borderRadius={"6px"}
            border={"1px solid lightgray"}
            paddingY={"5px"}
            paddingLeft={"10px"}
            paddingRight={"5px"}
            maxHeight={110}
            boxSizing={"border-box"}
            position={"relative"}
          >
            <Typography
              sx={{
                fontSize: 14,
                transform: "scale(0.75)",
                color: "rgba(0, 0, 0, 0.6)",
                position: "absolute",
                left: -1,
                top: -12,
                zIndex: 2,
                backgroundColor: "white",
                paddingX: "7px",
              }}
            >
              Private Key
            </Typography>
            <Stack direction={"row"} width={1}>
              <Typography
                fontSize={14}
                width={"calc(100% - 30px)"}
                marginRight={"5px"}
                sx={{ wordBreak: "break-all" }}
                lineHeight={!showPrivateKey ? "21px" : "24px"}
              >
                {!showPrivateKey ? "●".repeat(120) : privateKey}
              </Typography>
              <Stack
                width={30}
                paddingX={"5px"}
                spacing={"5px"}
                boxSizing={"border-box"}
              >
                <IconButton sx={{ padding: 0 }} onClick={toggleShowPrivateKey}>
                  {showPrivateKey ? (
                    <VisibilityOffIcon sx={{ fontSize: 18 }} />
                  ) : (
                    <VisibilityIcon sx={{ fontSize: 18 }} />
                  )}
                </IconButton>
                <Tooltip title={"Copied"} open={showCopyKeyTooltip}>
                  <IconButton
                    sx={{ padding: 0 }}
                    onClick={handleCopyPrivateKey}
                  >
                    <CopyIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </Tooltip>
              </Stack>
            </Stack>
          </Stack>

          <TextField label={"Portable Wallet password"} />
          <Button
            sx={{ textTransform: "none", fontWeight: 600 }}
            fullWidth
            variant={"contained"}
            disabled={!privateKey}
            onClick={exportPortableWallet}
          >
            Export Portable Wallet
          </Button>
        </>
      );
    }

    return (
      <>
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
            containerProps={{ spacing: 0.5 }}
            inputsContainerProps={{ spacing: 2 }}
          />
        </FormProvider>
        <Button
          sx={{ fontWeight: 600, mt: "20px" }}
          fullWidth
          variant={"contained"}
          type={"submit"}
        >
          Load Private Key
        </Button>
      </>
    );
  }, [
    errorPrivateKey,
    onCancelErrPrivateKey,
    toggleShowPrivateKey,
    loadingPrivateKey,
    privateKey,
    loadPrivateKey,
    showPrivateKey,
    handleCopyPrivateKey,
    showCopyKeyTooltip,
  ]);

  return (
    <Stack
      onSubmit={handleSubmit(loadPrivateKey)}
      component={"form"}
      width={360}
      spacing={2}
      mt={"40px!important"}
    >
      {content}
    </Stack>
  );
};

const AccountDetail: React.FC<AccountDetailProps> = ({ accounts }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [account, setAccount] = useState<SerializedAccountReference>(null);

  useEffect(() => {
    const id = searchParams.get("id");
    const accountFromStore = accounts.find((item) => item.id === id);
    if (accountFromStore && account?.id !== id) {
      setAccount(accountFromStore);
      return;
    }

    if (!accountFromStore) {
      navigate(ACCOUNTS_PAGE);
    }
  }, [searchParams, accounts]);

  const onUpdateAccountName = useCallback(() => {
    navigate(`${UPDATE_ACCOUNT_PAGE}?id=${account.id}`);
  }, [account]);

  const onClickTransfer = useCallback(() => {
    if (account?.address) {
      navigate(
        `${TRANSFER_PAGE}?fromAddress=${account.address}&protocol=${account.protocol.name}&chainID=${account.protocol.chainID}`
      );
    }
  }, [navigate, account?.address]);

  const onClickRemoveAccount = useCallback(() => {
    if (account?.id) {
      navigate(`${REMOVE_ACCOUNT_PAGE}?id=${account.id}`);
    }
  }, [navigate, account?.id]);

  const onClickReimport = useCallback(() => {
    if (account?.id) {
      navigate(`${IMPORT_ACCOUNT_PAGE}?reimport=${account.id}`);
    }
  }, [account?.id, navigate]);

  const explorerLink = useMemo(() => {
    if (account) {
      const { name, chainID } = account.protocol;

      if (name === SupportedProtocols.Pocket) {
        return `https://poktscan.com/account/${account.address}`;
      }
    }

    return null;
  }, [account]);

  return (
    <Stack width={360}>
      <DetailComponent
        account={account}
        onUpdate={onUpdateAccountName}
        containerProps={{ mt: 3 }}
      />
      <Stack
        mt={"5px"}
        direction={"row"}
        alignItems={"center"}
        justifyContent={"center"}
        width={1}
        spacing={"10px"}
      >
        <Button sx={{ height: 30 }} onClick={onClickTransfer}>
          Transfer
        </Button>
        <Button sx={{ height: 30 }} onClick={onClickRemoveAccount}>
          Remove
        </Button>
        <Button sx={{ height: 30 }} onClick={onClickReimport}>
          Reimport
        </Button>
      </Stack>
      {explorerLink && (
        <Stack
          direction={"row"}
          alignItems={"center"}
          justifyContent={"center"}
          component={"a"}
          color={"#1976d2"}
          spacing={0.5}
          href={explorerLink}
          target={"_blank"}
        >
          <Typography fontSize={12} textAlign={"center"} color={"#1976d2"}>
            View on Explorer
          </Typography>
          <OpenInNewIcon sx={{ fontSize: 14 }} />
        </Stack>
      )}

      {account && <AccountPrivateKey account={account} />}
    </Stack>
  );
};

const mapStateToProps = (state: RootState) => ({
  accounts: state.vault.entities.accounts.list,
});

export default connect(mapStateToProps)(AccountDetail);
