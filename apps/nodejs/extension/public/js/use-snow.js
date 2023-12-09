/*
NOTICE:
This Snow + LavaMoat scuttling integration is currently being used
with an experimental API (https://github.com/LavaMoat/LavaMoat/pull/462).
Changing this code must be done cautiously to avoid breaking the app!
*/

// eslint-disable-next-line import/unambiguous
(function () {
  // eslint-disable-next-line no-undef
  const isWorker = !self.document;
  // eslint-disable-next-line no-undef
  Object.defineProperty(self, "SCUTTLER", {
    value: (realm, scuttle) => {
      if (isWorker) {
        scuttle(realm);
      } else {
        // eslint-disable-next-line no-undef
        self.SNOW((win) => {
          scuttle(win);
        }, realm);
      }
    },
  });
})();
