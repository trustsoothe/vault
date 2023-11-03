import type { ExternalConnectionRequest } from "../../types/communication";
import type { AccountBalanceInfo } from "../../redux/slices/app";
import type { RootState } from "../../redux/store";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import orderBy from "lodash/orderBy";
import { connect } from "react-redux";
import Stack from "@mui/material/Stack";
import { useTheme } from "@mui/material";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import Skeleton from "@mui/material/Skeleton";
import { useLocation } from "react-router-dom";
import Typography from "@mui/material/Typography";
import {
  type SerializedAccountReference,
  SupportedProtocols,
} from "@poktscan/keyring";
import Requester from "../common/Requester";
import { roundAndSeparate } from "../../utils/ui";
import { useAppDispatch } from "../../hooks/redux";
import CircularLoading from "../common/CircularLoading";
import OperationFailed from "../common/OperationFailed";
import CheckIcon from "../../assets/img/check_icon.svg";
import { getAllBalances } from "../../redux/slices/vault";
import CheckedIcon from "../../assets/img/checked_icon.svg";
import AppToBackground from "../../controllers/communication/AppToBackground";

type AccountWithBalanceInfo = SerializedAccountReference & {
  balanceInfo: AccountBalanceInfo;
};

interface AccountItemProps {
  account: AccountWithBalanceInfo;
  isChecked: boolean;
  onClickCheckbox: () => void;
  showBorderBottom?: boolean;
  protocol: SupportedProtocols;
  chainId: string;
}

const AccountItem: React.FC<AccountItemProps> = ({
  account,
  isChecked,
  onClickCheckbox,
  showBorderBottom,
  protocol,
  chainId,
}) => {
  const theme = useTheme();

  const { address, balanceInfo } = account;

  useEffect(() => {
    AppToBackground.getAccountBalance({
      address,
      chainId: chainId as any,
      protocol,
    }).catch();
  }, [protocol, chainId, address]);

  const balance = (balanceInfo?.amount as number) || 0;
  const errorBalance = balanceInfo?.error || false;
  const loadingBalance = balanceInfo?.loading || false;

  const firstCharacters = address.substring(0, 4);
  const lastCharacters = address.substring(address.length - 4);
  const symbol = account.asset.symbol;

  return (
    <Stack
      spacing={1.4}
      paddingX={0.5}
      direction={"row"}
      height={45}
      minHeight={45}
      width={1}
      boxSizing={"border-box"}
      borderBottom={
        showBorderBottom ? `1px solid ${theme.customColors.dark15}` : undefined
      }
    >
      <Checkbox
        size={"small"}
        checked={isChecked}
        onClick={onClickCheckbox}
        checkedIcon={<CheckedIcon />}
        icon={<CheckIcon />}
        component={"div"}
        sx={{
          minWidth: 19,
          width: 19,
          height: 19,
          padding: 0,
          marginTop: "5px!important",
        }}
      />

      <Stack width={1}>
        <Typography
          fontWeight={500}
          fontSize={13}
          letterSpacing={"0.5px"}
          lineHeight={"22px"}
        >
          {account.name} ({firstCharacters}...{lastCharacters})
        </Typography>
        {loadingBalance ? (
          <Skeleton variant={"rectangular"} width={75} height={14} />
        ) : (
          <Typography
            sx={{ fontSize: "12px!important" }}
            lineHeight={"16px"}
            component={"span"}
            color={theme.customColors.dark75}
          >
            {roundAndSeparate(balance, 2, "0")} {symbol}
          </Typography>
        )}
      </Stack>
    </Stack>
  );
};

interface NewConnectProps {
  accounts: RootState["vault"]["entities"]["accounts"]["list"];
  accountBalances: RootState["app"]["accountBalances"];
  selectedChainByNetwork: RootState["app"]["selectedChainByNetwork"];
}

const NewConnect: React.FC<NewConnectProps> = ({
  accounts,
  accountBalances,
  selectedChainByNetwork,
}) => {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const loadingBalanceRef = useRef(false);
  // todo: this should come with the request
  const [protocol, setProtocol] = useState(SupportedProtocols.Pocket);
  const currentRequest: ExternalConnectionRequest = useLocation()?.state;
  const [status, setStatus] = useState<"normal" | "loading" | "error">(
    "normal"
  );
  const lastAcceptedRef = useRef<boolean>(null);

  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const isAllSelected = selectedAccounts.length === accounts.length;
  const isSomethingSelected = !!selectedAccounts.length;

  useEffect(() => {
    if (loadingBalanceRef.current) return;
    loadingBalanceRef.current = true;
    dispatch(getAllBalances());
  }, []);

  const toggleSelectAccount = useCallback((id: string) => {
    setSelectedAccounts((prevState) => {
      const alreadySelected = prevState.includes(id);
      return !alreadySelected
        ? [...prevState, id]
        : prevState.filter((item) => item !== id);
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    setSelectedAccounts(isAllSelected ? [] : accounts.map((item) => item.id));
  }, [isAllSelected, accounts]);

  const sendResponse = useCallback(
    async (accepted: boolean) => {
      if (currentRequest) {
        lastAcceptedRef.current = accepted;
        selectedAccounts;
        setStatus("loading");
        const result = await AppToBackground.answerConnection({
          accepted: accepted && !!selectedAccounts.length,
          request: currentRequest,
          selectedAccounts,
        });
        const isError = !!result.error;
        setStatus(isError ? "error" : "normal");

        if (!isError) {
          lastAcceptedRef.current = null;
        }
      }
    },
    [currentRequest, selectedAccounts]
  );

  const selectedChainId = selectedChainByNetwork[protocol];

  const accountsWithBalance: AccountWithBalanceInfo[] = useMemo(() => {
    const balancesById = accountBalances[protocol][selectedChainId];

    return orderBy(
      accounts
        .filter((item) => item.asset?.protocol === protocol)
        .map((item) => ({
          ...item,
          balanceInfo: balancesById[item.address],
        })),
      ["balanceInfo.amount"],
      ["desc"]
    );
  }, [accounts, accountBalances, selectedChainId, protocol]);

  if (!currentRequest) {
    return null;
  }

  if (status === "loading") {
    return <CircularLoading />;
  }

  if (status === "error") {
    return (
      <OperationFailed
        text={"There was an error trying to answer the request."}
        onCancel={() => sendResponse(false)}
        onRetry={() => {
          if (typeof lastAcceptedRef.current === "boolean") {
            sendResponse(lastAcceptedRef.current);
          }
        }}
      />
    );
  }

  return (
    <Stack alignItems={"center"} justifyContent={"space-between"} height={1}>
      <Stack paddingX={2} width={1} boxSizing={"border-box"}>
        <Typography
          width={340}
          height={60}
          fontSize={18}
          marginTop={2.5}
          fontWeight={700}
          marginBottom={1.5}
          lineHeight={"28px"}
          textAlign={"center"}
          sx={{ userSelect: "none" }}
          color={theme.customColors.primary999}
        >
          Select the accounts you want to grant to this site.
        </Typography>
        <Requester request={currentRequest} />
        <Stack
          direction={"row"}
          alignItems={"center"}
          height={24}
          mt={1.5}
          width={"auto"}
          spacing={1.3}
        >
          <Checkbox
            size={"small"}
            checked={isAllSelected}
            onClick={toggleSelectAll}
            checkedIcon={<CheckedIcon />}
            icon={<CheckIcon />}
            sx={{
              width: 19,
              height: 19,
              padding: 0,
              marginLeft: "5px!important",
            }}
          />
          <Typography fontSize={14} fontWeight={500} letterSpacing={"0.5px"}>
            Select All
          </Typography>
        </Stack>
        <Stack
          width={1}
          paddingX={1}
          paddingTop={0.75}
          height={220}
          marginTop={1}
          spacing={0.5}
          overflow={"auto"}
          borderRadius={"4px"}
          boxSizing={"border-box"}
          border={`1px solid ${theme.customColors.primary250}`}
        >
          {accountsWithBalance.map((account, index) => (
            <AccountItem
              onClickCheckbox={() => toggleSelectAccount(account.id)}
              isChecked={selectedAccounts.includes(account.id)}
              account={account}
              showBorderBottom={index !== accounts.length - 1}
              protocol={protocol}
              chainId={selectedChainId}
            />
          ))}
        </Stack>
        <Typography
          fontSize={10}
          marginTop={1}
          lineHeight={"14px"}
          textAlign={"center"}
          color={theme.customColors.dark75}
        >
          You allow the site to see the address, account balance and suggest
          transactions for you to approve.
        </Typography>
      </Stack>
      <Stack
        width={1}
        spacing={2}
        paddingX={2}
        direction={"row"}
        alignItems={"center"}
        boxSizing={"border-box"}
      >
        <Button
          onClick={() => {
            sendResponse(false);
          }}
          sx={{
            fontWeight: 700,
            color: theme.customColors.dark50,
            borderColor: theme.customColors.dark50,
            height: 36,
            borderWidth: 1.5,
            fontSize: 16,
          }}
          variant={"outlined"}
          fullWidth
        >
          Reject
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
          disabled={!isSomethingSelected}
          onClick={() => {
            sendResponse(true);
          }}
        >
          Connect
        </Button>
      </Stack>
    </Stack>
  );
};

const mapStateToProps = (state: RootState) => {
  const selectedNetwork = state.app.selectedNetwork;
  const selectedChain = state.app.selectedChainByNetwork[selectedNetwork];

  return {
    accounts: state.vault.entities.accounts.list,
    selectedChainByNetwork: state.app.selectedChainByNetwork,
    accountBalances: state.app.accountBalances,
  };
};

export default connect(mapStateToProps)(NewConnect);
