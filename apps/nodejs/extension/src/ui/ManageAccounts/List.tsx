import Menu from "@mui/material/Menu";
import Stack from "@mui/material/Stack";
import MenuItem from "@mui/material/MenuItem";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AccountType, SerializedAccountReference } from "@poktscan/vault";
import { accountsSelector, seedsSelector } from "../../redux/selectors/account";
import { useAppDispatch, useAppSelector } from "../../hooks/redux";
import SmallGrayContainer from "../components/SmallGrayContainer";
import { labelByProtocolMap } from "../../constants/protocols";
import NewAccountsButtons from "../Home/NewAccountsButtons";
import AvatarByString from "../components/AvatarByString";
import ViewPrivateKeyModal from "./ViewPrivateKeyModal";
import { ACCOUNTS_PAGE } from "../../constants/routes";
import RenameAccountModal from "./RenameAccountModal";
import RemoveAccountModal from "./RemoveAccountModal";
import MenuDivider from "../components/MenuDivider";
import MoreIcon from "../assets/img/more_icon.svg";
import NoAccounts from "../Home/NoAccounts";
import { themeColors } from "../theme";
import {
  selectedChainByProtocolSelector,
  selectedProtocolSelector,
} from "../../redux/selectors/network";
import {
  changeSelectedAccountOfNetwork,
  changeSelectedNetwork,
} from "../../redux/slices/app";

type AccountWithSeed = SerializedAccountReference & {
  seedName?: string;
};

interface AccountItemProps {
  account: AccountWithSeed;
  showRenameModal: (account: SerializedAccountReference) => void;
  showViewPkModal: (account: SerializedAccountReference) => void;
  showRemoveModal: (account: SerializedAccountReference) => void;
}

function AccountItem({
  account,
  showRenameModal,
  showViewPkModal,
  showRemoveModal,
}: AccountItemProps) {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const selectedProtocol = useAppSelector(selectedProtocolSelector);
  const selectedChainByProtocol = useAppSelector(
    selectedChainByProtocolSelector
  );
  const [anchorEl, setAnchorEl] = useState<null | HTMLButtonElement>(null);
  const open = Boolean(anchorEl);
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  const viewAccount = () => {
    Promise.all([
      ...(selectedProtocol !== account.protocol
        ? [
            dispatch(
              changeSelectedNetwork({
                network: account.protocol,
                chainId: selectedChainByProtocol[account.protocol],
              })
            ),
          ]
        : []),
      dispatch(
        changeSelectedAccountOfNetwork({
          protocol: account.protocol,
          address: account.address,
        })
      ),
    ]).then(() => {
      handleClose();
      navigate(ACCOUNTS_PAGE);
    });
  };

  return (
    <>
      <SmallGrayContainer>
        <AvatarByString string={account.address} />
        <Stack spacing={0.4} flexGrow={1}>
          <Typography variant={"subtitle2"} lineHeight={"16px"}>
            {account.name}
          </Typography>
          <Typography
            variant={"body2"}
            lineHeight={"14px"}
            color={themeColors.textSecondary}
          >
            {labelByProtocolMap[account.protocol]}
            {account.seedName && (
              <span style={{ marginLeft: "8px" }}>{account.seedName}</span>
            )}
          </Typography>
        </Stack>
        <IconButton
          sx={{ height: 25, width: 27, borderRadius: "8px" }}
          onClick={handleClick}
        >
          <MoreIcon />
        </IconButton>
      </SmallGrayContainer>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        slotProps={{
          paper: {
            sx: {
              width: 190,
              marginTop: 0.8,
            },
          },
        }}
      >
        <MenuItem onClick={viewAccount}>View Account</MenuItem>
        <MenuItem
          onClick={() => {
            showRenameModal(account);
            handleClose();
          }}
        >
          Rename
        </MenuItem>
        <MenuItem
          onClick={() => {
            showViewPkModal(account);
            handleClose();
          }}
        >
          View Private Key
        </MenuItem>
        <MenuDivider />
        <MenuItem
          className={"sensitive"}
          onClick={() => {
            showRemoveModal(account);
            handleClose();
          }}
        >
          Remove Account
        </MenuItem>
      </Menu>
    </>
  );
}

export default function ListAccounts() {
  const [searchParams] = useSearchParams();
  const seedId = searchParams.get("seedId");
  const [selectedAccount, setSelectedAccount] =
    useState<SerializedAccountReference | null>(null);
  const [modalToShow, setModalToShow] = useState<
    "none" | "rename" | "private_key" | "remove"
  >("none");

  const showRenameModal = (account: SerializedAccountReference) => {
    setSelectedAccount(account);
    setModalToShow("rename");
  };

  const showViewPrivateKeyModal = (account: SerializedAccountReference) => {
    setSelectedAccount(account);
    setModalToShow("private_key");
  };

  const showRemoveModal = (account: SerializedAccountReference) => {
    setSelectedAccount(account);
    setModalToShow("remove");
  };

  const closeModal = () => {
    setSelectedAccount(null);
    setModalToShow("none");
  };

  const accounts = useAppSelector(accountsSelector);
  const seeds = useAppSelector(seedsSelector);

  const usableAccounts: Array<AccountWithSeed> = useMemo(() => {
    const noSeedAccounts = [],
      seedAccounts = [];

    for (const account of accounts) {
      if (
        account.accountType === AccountType.HDSeed &&
        (!seedId || account.seedId === seedId)
      ) {
        seedAccounts.push(account);
      } else {
        noSeedAccounts.push(account);
      }
    }

    const seedsMap = seeds.reduce(
      (acc, item) => ({ ...acc, [item.id]: item.name }),
      {}
    );

    const seedNameById = seedAccounts.reduce(
      (acc, account) => ({ ...acc, [account.id]: seedsMap[account.seedId] }),
      {}
    );

    return (
      seedId
        ? noSeedAccounts.filter(
            (account) =>
              account.accountType === AccountType.HDChild &&
              !!seedNameById[account.parentId]
          )
        : noSeedAccounts
    ).map((account) => {
      if (account.accountType === AccountType.HDChild) {
        return {
          ...account,
          seedName: seedNameById[account.parentId],
        };
      }

      return account;
    });
  }, [accounts, seeds, seedId]);

  useEffect(() => {
    const toRemoveWithFile = searchParams.get("toRemoveWithFile");

    const account = usableAccounts.find(
      (account) => account.id === toRemoveWithFile
    );

    if (account) {
      showRemoveModal(account);
    }
  }, []);

  return (
    <>
      <RenameAccountModal
        onClose={closeModal}
        account={modalToShow === "rename" ? selectedAccount : null}
      />
      <ViewPrivateKeyModal
        onClose={closeModal}
        account={modalToShow === "private_key" ? selectedAccount : null}
      />
      <RemoveAccountModal
        onClose={closeModal}
        account={modalToShow === "remove" ? selectedAccount : null}
      />
      {usableAccounts.length > 0 ? (
        <>
          <Stack
            flexGrow={1}
            padding={2.4}
            spacing={1.2}
            minHeight={0}
            flexBasis={"1px"}
            overflow={"auto"}
            bgcolor={themeColors.white}
          >
            {usableAccounts.map((account) => (
              <AccountItem
                account={account}
                key={account.id}
                showViewPkModal={showViewPrivateKeyModal}
                showRenameModal={showRenameModal}
                showRemoveModal={showRemoveModal}
              />
            ))}
          </Stack>
          <NewAccountsButtons
            containerProps={{
              width: 1,
              height: 86,
              marginTop: 0,
              bgcolor: themeColors.bgLightGray,
              borderTop: `1px solid ${themeColors.borderLightGray}`,
              sx: {
                button: {
                  width: 1,
                },
              },
            }}
          />
        </>
      ) : (
        <NoAccounts />
      )}
    </>
  );
}
