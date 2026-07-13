import { forwardRef, useEffect, useRef, useState } from "react";

// A plain <img> that fades in once it's actually decoded, instead of
// popping in the instant bytes arrive. Checks `.complete` on mount/src
// change so already-cached images (most nav-backs, most localhost loads)
// still render immediately with no needless fade.
const FadeImage = forwardRef(function FadeImage({ className = "", onLoad, src, ...props }, forwardedRef) {
  const [loaded, setLoaded] = useState(false);
  const innerRef = useRef(null);

  useEffect(() => {
    setLoaded(innerRef.current?.complete ?? false);
  }, [src]);

  function setRefs(node) {
    innerRef.current = node;
    if (typeof forwardedRef === "function") forwardedRef(node);
    else if (forwardedRef) forwardedRef.current = node;
  }

  return (
    <img
      {...props}
      ref={setRefs}
      src={src}
      onLoad={(e) => {
        setLoaded(true);
        onLoad?.(e);
      }}
      className={`${className} transition-opacity duration-500 ease-out ${loaded ? "opacity-100" : "opacity-0"}`}
    />
  );
});

export default FadeImage;
