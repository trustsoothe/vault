import { RootState } from "../redux/store";
import { connect } from "react-redux";
import React, { useEffect } from "react";
import { Route, RouteProps, redirect } from "react-router-dom";
import { INIT_VAULT } from "../constants/routes";

type AuthenticatedRouteProps = {
  vaultSessionExists: boolean;
  isUnlocked: boolean;
} & RouteProps;

const AuthenticatedRoute: React.FC<AuthenticatedRouteProps> = ({
  vaultSessionExists,
  isUnlocked,
  ...routeProps
}) => {
  useEffect(() => {
    if (!isUnlocked || !vaultSessionExists) {
      redirect(INIT_VAULT);
    }
  }, [isUnlocked, vaultSessionExists]);

  return <Route {...routeProps} />;
};

const mapStateToProps = (state: RootState) => {
  return {
    vaultSessionExists: !!state.vault.vaultSession,
    isUnlocked: state.vault.isUnlockedStatus === "yes",
  };
};

export default connect(mapStateToProps)(AuthenticatedRoute);
