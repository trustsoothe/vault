import type { AppConnectionRequest } from "../../types/communications/connection";
import type { AccountBalanceInfo } from "../../redux/slices/app";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import orderBy from "lodash/orderBy";
import Stack from "@mui/material/Stack";
import { useTheme } from "@mui/material";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import Skeleton from "@mui/material/Skeleton";
import { useLocation } from "react-router-dom";
import Typography from "@mui/material/Typography";
import {
  AccountType,
  type SerializedAccountReference,
  SupportedProtocols,
} from "@poktscan/keyring";
import Requester from "../common/Requester";
import { getTruncatedText, roundAndSeparate } from "../../utils/ui";
import { useAppSelector } from "../../hooks/redux";
import CircularLoading from "../common/CircularLoading";
import OperationFailed from "../common/OperationFailed";
import CheckIcon from "../../assets/img/check_icon.svg";
import CheckedIcon from "../../assets/img/checked_icon.svg";
import AppToBackground from "../../controllers/communication/AppToBackground";
import {
  networksSelector,
  selectedChainByProtocolSelector,
} from "../../redux/selectors/network";
import {
  accountBalancesSelector,
  accountsSelector,
} from "../../redux/selectors/account";
import TooltipOverflow from "../common/TooltipOverflow";

type AccountWithBalanceInfo = SerializedAccountReference & {
  balanceInfo: AccountBalanceInfo;
  symbol: string;
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

  const { address, balanceInfo, symbol } = account;

  const getAccountBalance = useCallback(() => {
    AppToBackground.getAccountBalance({
      address,
      chainId: chainId as any,
      protocol,
    }).catch();
  }, [protocol, chainId, address]);

  useEffect(() => {
    getAccountBalance();
  }, [getAccountBalance]);

  const balance = (balanceInfo?.amount as number) || 0;
  const errorBalance = balanceInfo?.error || false;
  const loadingBalance = balanceInfo?.loading || false;

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

      <Stack width={295}>
        <TooltipOverflow
          enableTextCopy={false}
          text={`${account.name} (${getTruncatedText(address)})`}
          textProps={{
            fontSize: 13,
            fontWeight: 500,
            lineHeight: "22px",
            letterSpacing: "0.5px",
          }}
        />
        {loadingBalance ? (
          <Skeleton variant={"rectangular"} width={75} height={14} />
        ) : errorBalance ? (
          <Stack direction={"row"} alignItems={"center"} spacing={0.2}>
            <Typography
              fontSize={12}
              lineHeight={"16px"}
              color={theme.customColors.dark75}
            >
              Balance error.
            </Typography>
            <Button
              sx={{
                fontSize: 12,
                height: 16,
                minWidth: 0,
                paddingX: 0.5,
                marginTop: "2px!important",
              }}
              variant={"text"}
              onClick={getAccountBalance}
            >
              Retry
            </Button>
          </Stack>
        ) : (
          <Stack direction={"row"} alignItems={"center"} spacing={0.5}>
            <TooltipOverflow
              enableTextCopy={false}
              text={`${roundAndSeparate(
                balance,
                account.protocol === SupportedProtocols.Ethereum ? 18 : 6,
                "0"
              )}`}
              containerProps={{
                height: 16,
                marginTop: "-5px!important",
              }}
              textProps={{
                height: 16,
                lineHeight: "16px",
              }}
              linkProps={{
                fontSize: "12px!important",
                lineHeight: "16px",
                component: "span",
                color: theme.customColors.dark75,
              }}
            />
            <Typography
              fontSize={12}
              lineHeight={"16px"}
              component={"span"}
              color={theme.customColors.dark75}
            >
              {symbol}
            </Typography>
          </Stack>
        )}
      </Stack>
    </Stack>
  );
};

const NewConnect: React.FC = () => {
  const theme = useTheme();
  const currentRequest: AppConnectionRequest = useLocation()?.state;
  const protocol = currentRequest?.protocol;
  const [status, setStatus] = useState<"normal" | "loading" | "error">(
    "normal"
  );
  const lastAcceptedRef = useRef<boolean>(null);

  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const isSomethingSelected = !!selectedAccounts.length;
  const networks = useAppSelector(networksSelector);
  const accounts = useAppSelector(accountsSelector);
  const accountBalances = useAppSelector(accountBalancesSelector);
  const selectedChainByProtocol = useAppSelector(
    selectedChainByProtocolSelector
  );

  const toggleSelectAccount = useCallback((address: string) => {
    setSelectedAccounts((prevState) => {
      const alreadySelected = prevState.includes(address);
      return !alreadySelected
        ? [...prevState, address]
        : prevState.filter((item) => item !== address);
    });
  }, []);

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
          protocol: currentRequest.protocol,
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

  const selectedChain = selectedChainByProtocol[protocol];

  const accountsWithBalance: AccountWithBalanceInfo[] = useMemo(() => {
    const balancesById = accountBalances?.[protocol]?.[selectedChain];
    const symbolByProtocol = networks.reduce(
      (acc, network) => ({
        ...acc,
        [`${network.protocol}-${network.chainId}`]: network.currencySymbol,
      }),
      {}
    );

    return orderBy(
      accounts
        .filter(
          (item) =>
            item.protocol === protocol &&
            item.accountType !== AccountType.HDSeed
        )
        .map((item) => ({
          ...item,
          balanceInfo: balancesById?.[item.address] as AccountBalanceInfo,
          symbol: symbolByProtocol[`${item.protocol}-${selectedChain}`] || "",
        })),
      ["balanceInfo.amount"],
      ["desc"]
    );
  }, [accounts, accountBalances, selectedChain, protocol, networks]);

  const isAllSelected = selectedAccounts.length === accountsWithBalance.length;

  const toggleSelectAll = useCallback(() => {
    setSelectedAccounts(
      isAllSelected ? [] : accountsWithBalance.map((item) => item.address)
    );
  }, [isAllSelected, accountsWithBalance]);

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
              onClickCheckbox={() => toggleSelectAccount(account.address)}
              isChecked={selectedAccounts.includes(account.address)}
              account={account}
              showBorderBottom={index !== accounts.length - 1}
              protocol={protocol}
              chainId={selectedChain}
              key={account.id}
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

export default NewConnect;
