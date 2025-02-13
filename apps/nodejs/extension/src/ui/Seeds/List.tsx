import Menu from "@mui/material/Menu";
import Stack from "@mui/material/Stack";
import MenuItem from "@mui/material/MenuItem";
import { useNavigate } from "react-router-dom";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import { closeSnackbar, SnackbarKey } from "notistack";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  AccountType,
  SerializedAccountReference,
  SerializedRecoveryPhraseReference,
} from "@soothe/vault";
import { accountsSelector, seedsSelector } from "../../redux/selectors/account";
import SmallGrayContainer from "../components/SmallGrayContainer";
import { MANAGE_ACCOUNTS_PAGE } from "../../constants/routes";
import AvatarByString from "../components/AvatarByString";
import MenuDivider from "../components/MenuDivider";
import MoreIcon from "../assets/img/more_icon.svg";
import { useAppSelector } from "../hooks/redux";
import { enqueueSnackbar } from "../../utils/ui";
import RemoveSeedModal from "./RemoveSeedModal";
import NewSeedButtons from "./NewSeedButtons";
import RenameSeedModal from "./RenameModal";
import { themeColors } from "../theme";
import NoSeeds from "./NoSeeds";

interface SeedItemProps {
  seed: SerializedRecoveryPhraseReference & {
    accounts: number;
  };
  openRenameModal: (seed: SerializedRecoveryPhraseReference) => void;
  openRemoveModal: (seed: SerializedRecoveryPhraseReference) => void;
}

function SeedItem({ seed, openRenameModal, openRemoveModal }: SeedItemProps) {
  const { name, accounts } = seed;
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLButtonElement>(null);
  const open = Boolean(anchorEl);
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <>
      <SmallGrayContainer>
        <AvatarByString string={seed.id} type={"square"} />
        <Stack spacing={0.4} flexGrow={1}>
          <Typography variant={"subtitle2"} lineHeight={"16px"}>
            {name}
          </Typography>
          <Typography
            variant={"body2"}
            lineHeight={"14px"}
            color={themeColors.textSecondary}
          >
            {accounts} Account{accounts === 1 ? "" : "s"}
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
        <MenuItem
          onClick={() => {
            handleClose();
            navigate(`${MANAGE_ACCOUNTS_PAGE}?seedId=${seed.id}`);
          }}
        >
          Manage Accounts
        </MenuItem>
        <MenuItem
          onClick={() => {
            handleClose();
            openRenameModal(seed);
          }}
        >
          Rename
        </MenuItem>
        <MenuDivider />
        <MenuItem
          className={"sensitive"}
          onClick={() => {
            handleClose();
            openRemoveModal(seed);
          }}
        >
          Remove Seed
        </MenuItem>
      </Menu>
    </>
  );
}

export default function SeedsList() {
  const cannotRemoveSnackbarKey = useRef<SnackbarKey>(null);
  const seeds = useAppSelector(seedsSelector);
  const accounts = useAppSelector(accountsSelector);

  const [selectedSeed, setSelectedSeed] =
    useState<SerializedRecoveryPhraseReference>(null);
  const [modalToShow, setModalToShow] = useState<"none" | "rename" | "remove">(
    "none"
  );

  const seedsWithAccounts = useMemo(() => {
    const accountsOfSeed: Record<string, number> = {};
    const accountSeeds: Array<SerializedAccountReference> = [];

    for (const account of accounts) {
      if (account.accountType === AccountType.HDSeed) {
        accountSeeds.push(account);
      } else if (account.accountType === AccountType.HDChild) {
        if (accountsOfSeed[account.parentId]) {
          accountsOfSeed[account.parentId]++;
        } else {
          accountsOfSeed[account.parentId] = 1;
        }
      }
    }

    const accountsChildBySeedId = accountSeeds.reduce(
      (acc, account) => ({
        ...acc,
        [account.seedId]:
          (acc[account.seedId] || 0) + accountsOfSeed[account.id],
      }),
      {}
    );

    return seeds.map((seed) => ({
      ...seed,
      accounts: accountsChildBySeedId[seed.id] || 0,
    }));
  }, [seeds, accounts]);

  const openRenameModal = (phrase: SerializedRecoveryPhraseReference) => {
    setSelectedSeed(phrase);
    setModalToShow("rename");
  };

  const closeSnackbars = () => {
    if (cannotRemoveSnackbarKey.current) {
      closeSnackbar(cannotRemoveSnackbarKey.current);
      cannotRemoveSnackbarKey.current = null;
    }
  };

  useEffect(() => {
    return closeSnackbars;
  }, []);

  const openRemoveModal = (phrase: typeof seedsWithAccounts[number]) => {
    if (phrase.accounts > 0) {
      cannotRemoveSnackbarKey.current = enqueueSnackbar({
        variant: "error",
        message: {
          title: "Cannot Remove Seed",
          content: "This Seed has Child Accounts. Remove them and try again.",
        },
      });
    } else {
      closeSnackbars();
      setSelectedSeed(phrase);
      setModalToShow("remove");
    }
  };

  const closeModals = () => {
    setSelectedSeed(null);
    setModalToShow("none");
  };

  return (
    <>
      {seedsWithAccounts.length > 0 ? (
        <>
          <RenameSeedModal
            onClose={closeModals}
            recoveryPhrase={modalToShow === "rename" ? selectedSeed : null}
          />
          <RemoveSeedModal
            onClose={closeModals}
            recoveryPhrase={modalToShow === "remove" ? selectedSeed : null}
          />
          <Stack
            flexGrow={1}
            spacing={1.2}
            padding={2.4}
            minHeight={0}
            flexBasis={"1px"}
            overflow={"auto"}
            bgcolor={themeColors.white}
          >
            {seedsWithAccounts.map((seed, i) => (
              <SeedItem
                key={seed.id + i}
                seed={seed}
                openRenameModal={openRenameModal}
                openRemoveModal={openRemoveModal}
              />
            ))}
          </Stack>
          <NewSeedButtons
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
        <NoSeeds />
      )}
    </>
  );
}
