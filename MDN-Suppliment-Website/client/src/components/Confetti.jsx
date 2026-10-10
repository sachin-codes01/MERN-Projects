import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import confetti from "canvas-confetti";

/**
 * Magic UI ke Confetti component ka JSX version. Apna canvas render karta hai
 * aur ref par `fire(options)` deta hai, taaki parent jab chahe confetti chala sake.
 */
const Confetti = forwardRef(({ className = "", globalOptions, ...rest }, ref) => {
  const canvasRef = useRef(null);
  const instanceRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    // canvas-confetti ka instance isi canvas se bandha hai; resize par khud adjust hota hai
    instanceRef.current = confetti.create(canvasRef.current, {
      resize: true,
      useWorker: true,
      ...globalOptions,
    });
    return () => {
      instanceRef.current?.reset();
      instanceRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useImperativeHandle(ref, () => ({
    fire: (options = {}) => instanceRef.current?.(options),
  }));

  return <canvas ref={canvasRef} className={className} {...rest} />;
});

Confetti.displayName = "Confetti";

export default Confetti;
