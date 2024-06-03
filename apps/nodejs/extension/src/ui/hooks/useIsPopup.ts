export default function useIsPopup() {
  return window.location.search.includes("popup=true");
}
