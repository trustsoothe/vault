import type { RootState } from "../../redux/store";
import type { ConnectionRequest } from "../../redux/slices/app";
import React, { useCallback, useMemo, useState } from "react";
import Typography from "@mui/material/Typography";
import Checkbox from "@mui/material/Checkbox";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import { connect } from "react-redux";
import { useLocation } from "react-router-dom";
import AppToBackground from "../../controllers/communication/AppToBackground";

interface ConnectionRequestProps {
  accounts: RootState["vault"]["entities"]["accounts"]["list"];
}

const Request: React.FC<ConnectionRequestProps> = ({ accounts }) => {
  const currentRequest: ConnectionRequest = useLocation()?.state;
  const [selectedAccountsMap, setSelectedAccountsMap] = useState<
    Record<string, boolean>
  >({});
  const [selectedCreateAccounts, setSelectedCreateAccounts] = useState(false);

  const toggleSelectCreateAccount = useCallback(() => {
    setSelectedCreateAccounts((prevState) => !prevState);
  }, []);

  const toggleSelectAccount = useCallback((id: string) => {
    setSelectedAccountsMap((prevState) => {
      const newAddressValue = prevState[id] ? undefined : true;
      return { ...prevState, [id]: newAddressValue };
    });
  }, []);

  const isAllSelected = useMemo(() => {
    const selectedAccountsCount = Object.values(selectedAccountsMap).filter(
      (item) => item
    ).length;

    return selectedCreateAccounts && selectedAccountsCount === accounts.length;
  }, [selectedCreateAccounts, selectedAccountsMap, accounts]);

  const isSomethingSelected = useMemo(() => {
    const selectedAccountsCount = Object.values(selectedAccountsMap).filter(
      (item) => item
    ).length;

    return selectedCreateAccounts || selectedAccountsCount;
  }, [selectedCreateAccounts, selectedAccountsMap]);

  const toggleSelectAll = useCallback(() => {
    setSelectedCreateAccounts(!isAllSelected);
    setSelectedAccountsMap(() => {
      if (isAllSelected) {
        return {};
      } else {
        return accounts.reduce(
          (acc, account) => ({ ...acc, [account.id]: true }),
          {}
        );
      }
    });
  }, [isAllSelected, accounts]);

  const sendResponse = useCallback(
    async (accepted: boolean) => {
      if (currentRequest) {
        const identities: string[] = [];

        if (accepted) {
          for (const address in selectedAccountsMap) {
            if (selectedAccountsMap[address]) {
              identities.push(address);
            }
          }
        }

        await AppToBackground.answerConnection({
          accepted,
          request: currentRequest,
          canCreateAccounts: selectedCreateAccounts && accepted,
          idsOfSelectedAccounts: identities,
        });
      }
    },
    [currentRequest, selectedCreateAccounts, selectedAccountsMap]
  );

  if (!currentRequest) {
    return null;
  }

  return (
    <Stack
      spacing={"10px"}
      height={1}
      flexGrow={1}
      // pb={"15px"}
    >
      <Typography fontSize={20} textAlign={"center"}>
        Connection Request from:
      </Typography>
      <Stack
        direction={"row"}
        alignItems={"center"}
        justifyContent={"center"}
        spacing={"10px"}
        width={1}
      >
        <img
          width={24}
          height={24}
          alt={"favicon-ico"}
          src={currentRequest.faviconUrl}
        />
        <Typography
          fontSize={16}
          fontWeight={500}
          textOverflow={"ellipsis"}
          whiteSpace={"nowrap"}
          overflow={"hidden"}
          maxWidth={300}
          sx={{ textDecoration: "underline" }}
        >
          {currentRequest.origin}
        </Typography>
      </Stack>
      <Typography fontSize={12} marginTop={"15px!important"}>
        Select the permissions and accounts you want to grant:
      </Typography>
      <Stack direction={"row"} alignItems={"center"} height={18}>
        <Checkbox
          size={"small"}
          checked={isAllSelected}
          onClick={toggleSelectAll}
        />
        <Typography fontSize={12}>Select All</Typography>
      </Stack>
      <Stack
        flexGrow={1}
        border={"1px solid lightgray"}
        overflow={"auto"}
        padding={"5px"}
        mb={"10px"}
        borderRadius={"6px"}
        boxSizing={"border-box"}
        sx={{
          "& p": {
            fontSize: "12px!important",
          },
        }}
      >
        <Stack
          padding={"5px"}
          spacing={"10px"}
          direction={"row"}
          alignItems={"center"}
          height={50}
          width={1}
          boxSizing={"border-box"}
        >
          <Checkbox
            size={"small"}
            sx={{ paddingX: 0 }}
            checked={selectedCreateAccounts}
            onClick={toggleSelectCreateAccount}
          />
          <Stack width={1}>
            <Typography fontWeight={600}>Create new Accounts</Typography>
            <Typography
              sx={{ fontSize: "10px!important" }}
              component={"span"}
              color={"dimgrey"}
            >
              Allow the site to request for the creation of new accounts.
            </Typography>
          </Stack>
        </Stack>
        {accounts.map((account, index) => {
          return (
            <Stack
              padding={"5px"}
              spacing={"10px"}
              key={account.id}
              borderTop={"1px solid lightgray"}
              direction={"row"}
              alignItems={"center"}
              height={50}
              width={1}
              boxSizing={"border-box"}
            >
              <Checkbox
                size={"small"}
                sx={{ paddingX: 0 }}
                checked={selectedAccountsMap[account.id] || false}
                onClick={() => toggleSelectAccount(account.id)}
              />
              <Stack width={1}>
                <Stack
                  direction={"row"}
                  spacing={"5px"}
                  alignItems={"center"}
                  justifyContent={"space-between"}
                  width={1}
                >
                  <Typography fontWeight={600}>Account {index + 1}</Typography>
                  <Typography
                    sx={{ fontSize: "10px!important" }}
                    component={"span"}
                    color={"dimgrey"}
                  >
                    2 POKT
                  </Typography>
                </Stack>
                <Typography>{account.address}</Typography>
              </Stack>
            </Stack>
          );
        })}
      </Stack>
      <Typography fontSize={10}>
        This site will be able to see the address and suggest transactions of
        the selected accounts. Before doing any operation, you will need to
        confirm it.
      </Typography>
      <Stack direction={"row"} spacing={"15px"} marginTop={"15px!important"}>
        <Button
          fullWidth
          variant={"outlined"}
          sx={{
            textTransform: "none",
            fontWeight: 600,
          }}
          onClick={() => sendResponse(false)}
        >
          Cancel
        </Button>
        <Button
          fullWidth
          disabled={!isSomethingSelected}
          variant={"contained"}
          sx={{
            textTransform: "none",
            backgroundColor: "rgb(29, 138, 237)",
            fontWeight: 600,
          }}
          onClick={() => {
            sendResponse(true);
          }}
        >
          Accept
        </Button>
      </Stack>
    </Stack>
  );
};

const mapStateToProps = (state: RootState) => {
  return {
    accounts: state.vault.entities.accounts.list,
  };
};

export default connect(mapStateToProps)(Request);
