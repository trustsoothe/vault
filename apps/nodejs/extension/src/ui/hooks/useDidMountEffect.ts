import { DependencyList, EffectCallback, useEffect, useRef } from "react";

function useDidMountEffect(effect: EffectCallback, deps: DependencyList): void {
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) isFirstRender.current = false;
    else return effect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

export default useDidMountEffect;
