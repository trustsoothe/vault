import { useEffect, useState } from "react";

const useIsPopup = () => {
  const [isPopup, setIsPopup] = useState(false);

  useEffect(() => {
    setIsPopup(window.location.search.includes("popup=true"));
  }, []);

  return isPopup;
};

export default useIsPopup;
