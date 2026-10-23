import { useEffect, useState, type ReactNode } from 'react';

/** Every screen is laid out on this canvas, matching the design. */
export const CANVAS_W = 390;
export const CANVAS_H = 844;

const PHONE_MAX_W = 480;
const DESKTOP_GUTTER_X = 32;
const DESKTOP_GUTTER_Y = 48;

function measure() {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const phone = vw <= PHONE_MAX_W;
  if (phone) {
    // Fill the width; shrink if the screen is too short. A taller screen gets a
    // taller canvas, and each screen's flexible spacing absorbs the extra height.
    const scale = Math.min(vw / CANVAS_W, vh / CANVAS_H);
    return { phone, scale, height: Math.max(CANVAS_H, vh / scale) };
  }
  const scale = Math.min(1, (vw - DESKTOP_GUTTER_X) / CANVAS_W, (vh - DESKTOP_GUTTER_Y) / CANVAS_H);
  return { phone, scale, height: CANVAS_H };
}

/**
 * Renders screens at their designed size and scales the whole canvas to fit the
 * window, so layouts never get squeezed or clipped.
 */
export function PhoneFrame({ children }: { children: ReactNode }) {
  const [box, setBox] = useState(measure);

  useEffect(() => {
    const onResize = () => setBox(measure());
    window.addEventListener('resize', onResize);
    window.visualViewport?.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      window.visualViewport?.removeEventListener('resize', onResize);
    };
  }, []);

  return (
    <div className={box.phone ? 'device is-phone' : 'device'}>
      <div className="device-frame" style={{ width: CANVAS_W * box.scale, height: box.height * box.scale }}>
        <div className="device-canvas" style={{ width: CANVAS_W, height: box.height, transform: `scale(${box.scale})` }}>
          {children}
        </div>
      </div>
    </div>
  );
}
