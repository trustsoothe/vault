import { useLocation } from "react-router-dom";
import { IMPORT_ACCOUNT_PAGE } from "../constants/routes";
import { useAppSelector } from "./redux";
import { existsAccountsOfSelectedProtocolSelector } from "../redux/selectors/account";

export const ROUTES_TO_HIDE_ACCOUNT_SELECT = [IMPORT_ACCOUNT_PAGE];

const useShowAccountSelect = () => {
  const location = useLocation();
  const existsAccountsOfSelectedProtocol = useAppSelector(
    existsAccountsOfSelectedProtocolSelector
  );

  const path = location.pathname;

  return (
    !ROUTES_TO_HIDE_ACCOUNT_SELECT.includes(path) &&
    existsAccountsOfSelectedProtocol
  );
};

export default useShowAccountSelect;
