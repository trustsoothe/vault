import type { SerializedAccountReference } from "@poktscan/keyring";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import Tooltip from "@mui/material/Tooltip";
import Skeleton from "@mui/material/Skeleton";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import CopyIcon from "@mui/icons-material/ContentCopy";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import { labelByChainID, labelByProtocolMap } from "../../constants/protocols";

interface AccountDetailProps {
  account: SerializedAccountReference;
  onClose: () => void;
}

const AccountDetail: React.FC<AccountDetailProps> = ({ account, onClose }) => {
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [showCopyAddressTooltip, setShowCopyAddressTooltip] = useState(false);
  const [showCopyKeyTooltip, setShowCopyKeyTooltip] = useState(false);
  const [balance, setBalance] = useState(0);
  const [accountPassphrase, setAccountPassphrase] = useState("");
  const [wrongPassphrase, setWrongPassphrase] = useState(false);
  const [loadingPrivateKey, setLoadingPrivateKey] = useState(false);
  const [privateKey, setPrivateKey] = useState<string>(null);
  const [showPrivateKey, setShowPrivateKey] = useState(false);

  const getAccountBalance = useCallback(() => {
    setLoadingBalance(true);
    setTimeout(() => {
      setBalance(54.23);
      setLoadingBalance(false);
    }, 500);
  }, []);

  useEffect(() => {
    getAccountBalance();
  }, []);

  const handleCopyAddress = useCallback(() => {
    navigator.clipboard.writeText(account.address).then(() => {
      setShowCopyAddressTooltip(true);
      setTimeout(() => setShowCopyAddressTooltip(false), 300);
    });
  }, [account.address]);

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
        if (accountPassphrase.length < 4) {
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

  const privateKeyComponent = useMemo(() => {
    if (loadingPrivateKey) {
      return (
        <Typography textAlign={"center"}>Loading Private Key...</Typography>
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
      <Stack
        direction={"row"}
        alignItems={"center"}
        justifyContent={"space-between"}
        width={1}
        boxSizing={"border-box"}
        marginY={"5px"}
      >
        <Typography variant={"h6"}>Account Detail</Typography>
        <IconButton sx={{ padding: 0 }} onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </Stack>
      <Stack
        mt={"100px"}
        direction={"row"}
        alignItems={"center"}
        justifyContent={"center"}
        width={1}
        spacing={"10px"}
      >
        <Typography fontWeight={600}>{account.name}</Typography>
        {loadingBalance ? (
          <Skeleton width={100} height={15} variant={"rectangular"} />
        ) : (
          //todo: replace POKT with asset symbol
          <Typography
            fontSize={14}
            lineHeight={"24px"}
            fontWeight={600}
            color={"gray"}
          >
            {balance} POKT
          </Typography>
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
        <Typography fontSize={14}>{account.address}</Typography>
        <Tooltip title={"Copied"} open={showCopyAddressTooltip}>
          <IconButton sx={{ padding: 0 }} onClick={handleCopyAddress}>
            <CopyIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Tooltip>
      </Stack>
      <Stack
        mt={"5px"}
        mb={"50px"}
        direction={"row"}
        alignItems={"center"}
        justifyContent={"center"}
        width={1}
        spacing={"10px"}
      >
        <Typography fontSize={14}>
          Protocol: {labelByProtocolMap[account.protocol.name]}
        </Typography>
        <Typography fontSize={14}>
          ChainID: {labelByChainID[account.protocol.chainID]}
        </Typography>
      </Stack>

      {privateKeyComponent}
    </Stack>
  );
};

export default AccountDetail;
