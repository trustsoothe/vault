Object.defineProperty(window, "SCUTTLER", {
  value: (globalRef, scuttle) => {
    scuttle(globalRef);
  },
});
