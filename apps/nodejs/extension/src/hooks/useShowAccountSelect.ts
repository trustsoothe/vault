import { useLocation } from "react-router-dom";
import {
  CREATE_ACCOUNT_PAGE,
  IMPORT_ACCOUNT_PAGE,
  REIMPORT_SEARCH_PARAM,
} from "../constants/routes";
import { useAppSelector } from "./redux";
import { existsAccountsOfSelectedProtocolSelector } from "../redux/selectors/account";

export const ROUTES_TO_HIDE_ACCOUNT_SELECT = [
  CREATE_ACCOUNT_PAGE,
  IMPORT_ACCOUNT_PAGE,
];

const useShowAccountSelect = () => {
  const location = useLocation();
  const existsAccountsOfSelectedProtocol = useAppSelector(
    existsAccountsOfSelectedProtocolSelector
  );

  const path = location.pathname;

  if (path === IMPORT_ACCOUNT_PAGE) {
    return location.search === REIMPORT_SEARCH_PARAM;
  }

  return (
    !ROUTES_TO_HIDE_ACCOUNT_SELECT.includes(path) &&
    existsAccountsOfSelectedProtocol
  );
};

export default useShowAccountSelect;
