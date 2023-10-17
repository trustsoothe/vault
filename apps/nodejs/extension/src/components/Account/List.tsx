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
import { useTheme } from "@mui/material";
import Button from "@mui/material/Button";
import { FixedSizeList } from "react-window";
import { useNavigate } from "react-router-dom";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import ListAccountItem from "./ListItem";
import useDebounce from "../../hooks/useDebounce";
import { labelByChainID, labelByProtocolMap } from "../../constants/protocols";
import { getAllBalances } from "../../redux/slices/vault";
import AddIcon from "../../assets/img/add_icon.svg";
import { useAppDispatch } from "../../hooks/redux";
import RenameModal from "./RenameModal";
import {
  CREATE_ACCOUNT_PAGE,
  IMPORT_ACCOUNT_PAGE,
} from "../../constants/routes";

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
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const isLoading = useRef(false);
  const navigate = useNavigate();
  const [searchText, setSearchText] = useState("");
  const debouncedSearchText = useDebounce(searchText);
  const [accountToRename, setAccountToRename] =
    useState<SerializedAccountReference>(null);

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

  const onCloseRenameModal = useCallback(() => {
    setAccountToRename(null);
  }, []);

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

  const accountsWithBalance: AccountWithBalance[] = useMemo(() => {
    return accounts.map((item) => ({
      ...item,
      balance: balanceByIdMap[item.id]?.amount || 0,
    }));
  }, [accounts, balanceByIdMap]);

  const searchedAccounts: AccountWithBalance[] = useMemo(() => {
    const filteredAccounts = filterAccounts(
      debouncedSearchText,
      accountsWithBalance
    ) as AccountWithBalance[];
    return filteredAccounts.sort((a, b) => b.balance - a.balance);
  }, [accountsWithBalance, debouncedSearchText]);

  const accountListComponent = useMemo(() => {
    if (!searchedAccounts.length) {
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
            No Results.
          </Typography>
        </Stack>
      );
    }

    return (
      <FixedSizeList
        width={"100%"}
        itemCount={searchedAccounts.length}
        itemSize={230}
        height={485}
        itemData={searchedAccounts}
      >
        {({ style, data, index }) => {
          const account = data[index];

          return (
            <Stack style={style}>
              <ListAccountItem
                account={account}
                isLoadingTokens={isLoadingTokens}
                onClickRename={(account) => setAccountToRename(account)}
              />
            </Stack>
          );
        }}
      </FixedSizeList>
    );
  }, [accountsWithBalance, isLoadingTokens, searchedAccounts]);

  const content = useMemo(() => {
    if (!accounts.length) {
      return (
        <Stack flexGrow={1}>
          <Stack flexGrow={1} alignItems={"center"} justifyContent={"center"}>
            <Typography
              lineHeight={"40px"}
              color={theme.customColors.primary999}
              fontWeight={700}
              fontSize={18}
            >
              Welcome to the Soothe's Vault!
            </Typography>
            <Typography
              color={theme.customColors.dark100}
              fontSize={14}
              lineHeight={"20px"}
              textAlign={"center"}
            >
              You do not have any account yet.
              <br />
              Please create new or import an account.
            </Typography>
          </Stack>
          <Stack direction={"row"} height={36} spacing={2}>
            {[
              {
                label: "Import",
                onClick: onClickImport,
              },
              {
                label: "New",
                onClick: onClickNew,
              },
            ].map(({ label, onClick }, index) => (
              <Button
                key={index}
                variant={"contained"}
                fullWidth
                sx={{
                  backgroundColor: theme.customColors.primary500,
                  fontSize: 16,
                  fontWeight: 700,
                }}
                onClick={onClick}
              >
                {label}
              </Button>
            ))}
          </Stack>
        </Stack>
      );
    }

    return (
      <>
        <Stack
          direction={"row"}
          justifyContent={"space-between"}
          alignItems={"center"}
          spacing={1.2}
          mt={1.5}
        >
          <TextField
            fullWidth
            size={"small"}
            value={searchText}
            onChange={onChangeSearchText}
            disabled={!accounts.length}
            placeholder={"Search by Name / Address"}
          />
          <IconButton onClick={onClickNew}>
            <AddIcon />
          </IconButton>
        </Stack>
        <Stack
          flexGrow={1}
          overflow={"auto"}
          marginTop={1.5}
          boxSizing={"border-box"}
        >
          {accountListComponent}
        </Stack>
      </>
    );
  }, [
    theme,
    onClickNew,
    onClickImport,
    accountListComponent,
    navigate,
    isLoadingTokens,
    searchText,
    onChangeSearchText,
    accounts.length,
  ]);

  return (
    <>
      <Stack height={1}>{content}</Stack>
      <RenameModal account={accountToRename} onClose={onCloseRenameModal} />
    </>
  );
};

const mapStateToProps = (state: RootState) => {
  return {
    accounts: state.vault.entities.accounts.list,
    isLoadingTokens: state.vault.entities.accounts.balances.loading,
    balanceByIdMap: state.vault.entities.accounts.balances.byId,
  };
};

export default connect(mapStateToProps)(AccountList);
