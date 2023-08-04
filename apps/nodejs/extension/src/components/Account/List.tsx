import type { SerializedAccountReference } from "@poktscan/keyring";
import type { AccountWithBalance } from "../../types";
import type { RootState } from "../../redux/store";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { connect } from "react-redux";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import { FixedSizeList } from "react-window";
import { useNavigate } from "react-router-dom";
import TextField from "@mui/material/TextField";
import EditIcon from "@mui/icons-material/Edit";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import ReplyIcon from "@mui/icons-material/Reply";
import DeleteIcon from "@mui/icons-material/Delete";
import VisibilityIcon from "@mui/icons-material/Visibility";
import {
  CREATE_ACCOUNT_PAGE,
  IMPORT_ACCOUNT_PAGE,
  TRANSFER_PAGE,
} from "../../constants/routes";
import UpdateAccount from "./Update";
import RemoveAccount from "./Remove";
import ListAccountItem from "./ListItem";
import AccountDetail from "./AccountDetail";
import useDebounce from "../../hooks/useDebounce";
import { labelByChainID, labelByProtocolMap } from "../../constants/protocols";
import { useAppDispatch } from "../../hooks/redux";
import { getAllBalances } from "../../redux/slices/vault";

interface AccountListProps {
  accounts: SerializedAccountReference[];
  isLoadingTokens: boolean;
  balanceByIdMap: RootState["vault"]["entities"]["accounts"]["balances"]["byId"];
}

export const filterAccounts = (
  searchText: string,
  accounts: SerializedAccountReference[]
) => {
  if (!searchText) {
    return accounts;
  }

  const text = searchText.trim().toLowerCase();

  return accounts.filter((account) => {
    if (account.name.toLowerCase().includes(text)) {
      return true;
    }

    if (account.address.toLowerCase().includes(text)) {
      return true;
    }

    if (
      labelByProtocolMap[account.protocol.name].toLowerCase().includes(text)
    ) {
      return true;
    }

    if (labelByChainID[account.protocol.chainID].toLowerCase().includes(text)) {
      return true;
    }

    return false;
  });
};

const AccountList: React.FC<AccountListProps> = ({
  accounts,
  balanceByIdMap,
  isLoadingTokens,
}) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [view, setView] = useState<"list" | "update" | "remove" | "detail">(
    "list"
  );
  const [selectedAccount, setSelectedAccount] =
    useState<SerializedAccountReference>(null);
  const [searchText, setSearchText] = useState("");
  const debouncedSearchText = useDebounce(searchText);

  useEffect(() => {
    dispatch(getAllBalances());
    const timeout = setInterval(() => {
      dispatch(getAllBalances());
    }, 60000);

    return () => clearInterval(timeout);
  }, [dispatch]);

  const onChangeSearchText = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setSearchText(event.target.value);
    },
    []
  );

  const onClickImport = useCallback(() => {
    navigate(IMPORT_ACCOUNT_PAGE);
  }, [navigate]);

  const onClickNew = useCallback(() => {
    navigate(CREATE_ACCOUNT_PAGE);
  }, [navigate]);

  const onClickUpdateAccount = useCallback(
    (account: SerializedAccountReference) => {
      setSelectedAccount(account);
      setView("update");
    },
    []
  );

  const onClickViewAccount = useCallback(
    (account: SerializedAccountReference) => {
      setSelectedAccount(account);
      setView("detail");
    },
    []
  );

  const onClickRemoveAccount = useCallback(
    (account: SerializedAccountReference) => {
      setSelectedAccount(account);
      setView("remove");
    },
    []
  );

  const onClose = useCallback(() => {
    setSelectedAccount(null);
    setView("list");
  }, []);

  const accountsWithBalance: AccountWithBalance[] = useMemo(() => {
    return accounts.map((item) => ({
      ...item,
      balance: balanceByIdMap[item.id]?.amount || 0,
    }));
  }, [accounts, balanceByIdMap]);

  const searchedAccounts: AccountWithBalance[] = useMemo(() => {
    return filterAccounts(debouncedSearchText, accountsWithBalance);
  }, [accountsWithBalance, debouncedSearchText]);

  const accountListComponent = useMemo(() => {
    if (!accountsWithBalance.length || !searchedAccounts.length) {
      const text = !accountsWithBalance.length
        ? "You do not have any account yet."
        : "No Results.";
      return (
        <Stack
          flexGrow={1}
          alignItems={"center"}
          justifyContent={"center"}
          sx={{
            "& p": {
              fontSize: "14px!important",
            },
          }}
        >
          <Typography mt={"-50px"} fontWeight={500}>
            {text}
          </Typography>
        </Stack>
      );
    }

    return (
      <FixedSizeList
        width={"100%"}
        itemCount={searchedAccounts.length}
        itemSize={100}
        height={350}
        itemData={searchedAccounts}
      >
        {({ style, data, index }) => {
          const account = data[index];

          return (
            <Stack
              paddingY={"10px"}
              paddingX={"5px"}
              spacing={"5px"}
              key={account.id}
              borderTop={index === 0 ? undefined : "1px solid lightgray"}
              width={1}
              boxSizing={"border-box"}
              direction={"row"}
              style={style}
            >
              <ListAccountItem
                account={account}
                isLoadingTokens={isLoadingTokens}
              />
              <Stack
                spacing={"5px"}
                marginTop={"-5px!important"}
                width={"min-content"}
              >
                <IconButton
                  sx={{ padding: 0 }}
                  onClick={() =>
                    navigate(`${TRANSFER_PAGE}?fromAddress=${account.address}`)
                  }
                >
                  <ReplyIcon
                    sx={{ fontSize: 18, transform: "rotateY(180deg)" }}
                  />
                </IconButton>
                <IconButton
                  sx={{ padding: 0 }}
                  onClick={() => onClickViewAccount(account)}
                >
                  <VisibilityIcon sx={{ fontSize: 18 }} />
                </IconButton>
                <IconButton
                  sx={{ padding: 0 }}
                  onClick={() => onClickUpdateAccount(account)}
                >
                  <EditIcon sx={{ fontSize: 18 }} />
                </IconButton>
                <IconButton
                  sx={{ padding: 0 }}
                  onClick={() => onClickRemoveAccount(account)}
                >
                  <DeleteIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </Stack>
            </Stack>
          );
        }}
      </FixedSizeList>
    );
  }, [
    accountsWithBalance,
    onClickUpdateAccount,
    onClickRemoveAccount,
    isLoadingTokens,
    searchedAccounts,
  ]);

  const content = useMemo(() => {
    if (selectedAccount && view === "update") {
      return <UpdateAccount account={selectedAccount} onClose={onClose} />;
    }

    if (selectedAccount && view === "remove") {
      return <RemoveAccount account={selectedAccount} onClose={onClose} />;
    }

    if (selectedAccount && view === "detail") {
      return <AccountDetail account={selectedAccount} onClose={onClose} />;
    }

    return (
      <>
        <Stack
          direction={"row"}
          justifyContent={"space-between"}
          alignItems={"center"}
          marginY={"5px"}
        >
          <Stack direction={"row"} alignItems={"center"} spacing={"10px"}>
            <Typography variant={"h6"}>Accounts</Typography>
            <Stack
              justifyContent={"center"}
              alignItems={"center"}
              height={20}
              paddingX={"5px"}
              bgcolor={"#d3d3d3"}
              borderRadius={"4px"}
            >
              <Typography
                fontSize={10}
                fontWeight={600}
                color={"#454545"}
                letterSpacing={"0.5px"}
              >
                {accounts.length}
              </Typography>
            </Stack>
          </Stack>
          <Stack
            direction={"row"}
            sx={{ "& button": { textTransform: "none" } }}
          >
            <Button onClick={onClickImport}>Import</Button>
            <Button onClick={onClickNew}>New</Button>
          </Stack>
        </Stack>
        <TextField
          fullWidth
          size={"small"}
          value={searchText}
          onChange={onChangeSearchText}
          disabled={!accounts.length}
          placeholder={"Search by name / address"}
          sx={{
            "& .MuiInputBase-root": {
              height: 35,
              minHeight: 35,
              maxHeight: 35,
            },
            "& input": {
              fontSize: 14,
            },
          }}
        />
        <Stack
          flexGrow={1}
          // border={"1px solid lightgray"}
          overflow={"auto"}
          paddingX={"5px"}
          marginTop={"10px"}
          boxSizing={"border-box"}
          sx={{
            "& p": {
              fontSize: "12px!important",
            },
          }}
        >
          {accountListComponent}
        </Stack>
      </>
    );
  }, [
    onClickImport,
    onClickNew,
    view,
    accountListComponent,
    navigate,
    isLoadingTokens,
    searchText,
    onChangeSearchText,
    onClose,
    selectedAccount,
    accounts.length,
  ]);

  return <Stack height={1}>{content}</Stack>;
};

const mapStateToProps = (state: RootState) => {
  return {
    accounts: state.vault.entities.accounts.list,
    isLoadingTokens: state.vault.entities.accounts.balances.loading,
    balanceByIdMap: state.vault.entities.accounts.balances.byId,
  };
};

export default connect(mapStateToProps)(AccountList);
