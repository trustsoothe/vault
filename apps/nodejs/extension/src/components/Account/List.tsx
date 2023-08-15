import type { SerializedAccountReference } from "@poktscan/keyring";
import type { AccountWithBalance } from "../../types";
import type { RootState } from "../../redux/store";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { connect } from "react-redux";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import { FixedSizeList } from "react-window";
import { useNavigate } from "react-router-dom";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import VisibilityIcon from "@mui/icons-material/Visibility";
import {
  ACCOUNTS_DETAIL_PAGE,
  CREATE_ACCOUNT_PAGE,
  IMPORT_ACCOUNT_PAGE,
} from "../../constants/routes";
import ListAccountItem from "./ListItem";
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
  const isLoading = useRef(false);
  const navigate = useNavigate();
  const [searchText, setSearchText] = useState("");
  const debouncedSearchText = useDebounce(searchText);

  useEffect(() => {
    if (!isLoading.current) {
      dispatch(getAllBalances()).finally(() => {
        isLoading.current = false;
      });
    }
    isLoading.current = true;

    const interval = setInterval(() => {
      dispatch(getAllBalances());
    }, 60000);

    return () => clearInterval(interval);
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

  const onClickViewAccount = useCallback(
    (account: SerializedAccountReference) => {
      navigate(`${ACCOUNTS_DETAIL_PAGE}?id=${account.id}`);
    },
    [navigate]
  );

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
        height={400}
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
                  onClick={() => onClickViewAccount(account)}
                >
                  <VisibilityIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </Stack>
            </Stack>
          );
        }}
      </FixedSizeList>
    );
  }, [accountsWithBalance, isLoadingTokens, searchedAccounts]);

  const content = useMemo(() => {
    return (
      <>
        <Stack
          direction={"row"}
          justifyContent={"space-between"}
          alignItems={"center"}
          spacing={0.5}
          mt={1.5}
        >
          <TextField
            fullWidth
            size={"small"}
            value={searchText}
            onChange={onChangeSearchText}
            disabled={!accounts.length}
            placeholder={"Search by name / address"}
          />
          <Stack
            direction={"row"}
            sx={{ "& button": { textTransform: "none" } }}
            mr={"-5px!important"}
          >
            <Button onClick={onClickImport}>Import</Button>
            <Button onClick={onClickNew} sx={{ width: 50, minWidth: 50 }}>
              New
            </Button>
          </Stack>
        </Stack>
        <Stack
          flexGrow={1}
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
    accountListComponent,
    navigate,
    isLoadingTokens,
    searchText,
    onChangeSearchText,
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
