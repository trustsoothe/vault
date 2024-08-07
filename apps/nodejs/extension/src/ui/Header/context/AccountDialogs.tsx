import React, { createContext, useContext } from "react";

interface AccountDialogsContext {
  showCreateAccount: () => void;
  showImportAccount: () => void;
}

const AccountDialogsContext = createContext<AccountDialogsContext>({
  showCreateAccount: () => null,
  showImportAccount: () => null,
});

export default function AccountDialogsProvider({
  children,
  ...value
}: React.PropsWithChildren<AccountDialogsContext>) {
  return (
    <AccountDialogsContext.Provider value={value}>
      {children}
    </AccountDialogsContext.Provider>
  );
}

export function useAccountDialogs() {
  const context = useContext(AccountDialogsContext);

  if (!context) {
    throw new Error(
      "to call useAccountDialogs you should wrap your component with AccountDialogsProvider"
    );
  }

  return context;
}
