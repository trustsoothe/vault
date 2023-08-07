import type { SerializedAccountReference } from "@poktscan/keyring";
import type { RootState } from "../../redux/store";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import Stack, { type StackProps } from "@mui/material/Stack";
import { connect } from "react-redux";
import Button from "@mui/material/Button";
import Tooltip from "@mui/material/Tooltip";
import Skeleton from "@mui/material/Skeleton";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import CopyIcon from "@mui/icons-material/ContentCopy";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import { useNavigate, useSearchParams } from "react-router-dom";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import { labelByChainID, labelByProtocolMap } from "../../constants/protocols";
import { getAccountBalance } from "../../redux/slices/vault";
import { useAppDispatch } from "../../hooks/redux";
import OperationFailed from "../common/OperationFailed";
import {
  ACCOUNTS_PAGE,
  REMOVE_ACCOUNT_PAGE,
  TRANSFER_PAGE,
  UPDATE_ACCOUNT_PAGE,
} from "../../constants/routes";

interface AccountDetailProps {
  accounts: RootState["vault"]["entities"]["accounts"]["list"];
}

interface DetailComponentProps {
  account: SerializedAccountReference;
  onUpdate?: () => void;
  containerProps?: StackProps;
  hideName?: boolean;
}

export const DetailComponent: React.FC<DetailComponentProps> = ({
  account,
  onUpdate,
  containerProps,
  hideName,
}) => {
  const dispatch = useAppDispatch();
  const [showCopyAddressTooltip, setShowCopyAddressTooltip] = useState(false);
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [errorBalance, setErrorBalance] = useState(false);
  const [balance, setBalance] = useState(0);

  const getBalance = useCallback(() => {
    if (account) {
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
  }, [account]);

  useEffect(() => {
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
        <Tooltip title={"Copied"} open={showCopyAddressTooltip}>
          <IconButton sx={{ padding: 0 }} onClick={handleCopyAddress}>
            <CopyIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Tooltip>
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

  const [showCopyKeyTooltip, setShowCopyKeyTooltip] = useState(false);
  const [accountPassphrase, setAccountPassphrase] = useState("");
  const [wrongPassphrase, setWrongPassphrase] = useState(false);
  const [loadingPrivateKey, setLoadingPrivateKey] = useState(false);
  const [privateKey, setPrivateKey] = useState<string>(null);
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [errorPrivateKey, setErrorPrivateKey] = useState(false);

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

  const handleCopyPrivateKey = useCallback(() => {
    if (privateKey) {
      navigator.clipboard.writeText(privateKey).then(() => {
        setShowCopyKeyTooltip(true);
        setTimeout(() => setShowCopyKeyTooltip(false), 300);
      });
    }
  }, [privateKey]);

  const handleChangeAccountPassphrase = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setAccountPassphrase(e.target.value);
      if (wrongPassphrase) {
        setWrongPassphrase(false);
      }
    },
    [wrongPassphrase]
  );

  const loadPrivateKey = useCallback(() => {
    if (accountPassphrase) {
      setLoadingPrivateKey(true);
      setTimeout(() => {
        if (accountPassphrase.length < 3) {
          setErrorPrivateKey(true);
        } else if (accountPassphrase.length < 4) {
          setWrongPassphrase(true);
        } else {
          //todo: replace with functionality to get private key
          setPrivateKey(
            "41885f998ba8d931817559447e7c20f144890d635f445fe59859395bac8c2d8341885f998ba8d931817559447e7c20f144890d635f445fe59859395b"
          );
        }

        setLoadingPrivateKey(false);
      }, 500);
    }
  }, [accountPassphrase]);

  const toggleShowPrivateKey = useCallback(() => {
    setShowPrivateKey((prevState) => !prevState);
  }, []);

  const onCancelErrPrivateKey = useCallback(() => {
    setLoadingPrivateKey(false);
    setPrivateKey(null);
    setErrorPrivateKey(null);
    setShowPrivateKey(null);
    setWrongPassphrase(false);
    setAccountPassphrase("");
  }, []);

  const privateKeyComponent = useMemo(() => {
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
          onRetry={loadPrivateKey}
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
          >
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
          <Button
            sx={{ textTransform: "none", fontWeight: 600, mt: "20px" }}
            fullWidth
            variant={"contained"}
            disabled={!privateKey}
          >
            Export PPK
          </Button>
        </>
      );
    }

    return (
      <>
        <TextField
          fullWidth
          size={"small"}
          type={"password"}
          error={wrongPassphrase}
          value={accountPassphrase}
          label={"Account Passphrase"}
          onChange={handleChangeAccountPassphrase}
          helperText={wrongPassphrase ? "Wrong Passphrase" : undefined}
        />
        <Button
          sx={{ textTransform: "none", fontWeight: 600, mt: "20px" }}
          fullWidth
          variant={"contained"}
          onClick={loadPrivateKey}
          disabled={!accountPassphrase}
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
    wrongPassphrase,
    accountPassphrase,
    handleChangeAccountPassphrase,
    handleCopyPrivateKey,
    showCopyKeyTooltip,
  ]);

  return (
    <Stack width={360}>
      <DetailComponent account={account} onUpdate={onUpdateAccountName} />
      <Stack
        mt={"5px"}
        mb={"50px"}
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
      </Stack>

      {privateKeyComponent}
    </Stack>
  );
};

const mapStateToProps = (state: RootState) => ({
  accounts: state.vault.entities.accounts.list,
});

export default connect(mapStateToProps)(AccountDetail);
