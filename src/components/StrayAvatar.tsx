import strayImg from '../assets/stray.png';

// Source image is 422×470; the face (eyes, mouth, blush) is centered here.
const IMG_W = 422;
const IMG_H = 470;
const FACE_X = 260;
const FACE_Y = 150;
/** Width of the source region shown inside the circle, in source px. */
const CROP = 330;

/** Round profile picture of Stray, cropped to its face. */
export function StrayAvatar({ size = 34, dimmed = false }: { size?: number; dimmed?: boolean }) {
  const k = size / CROP;
  return (
    <span
      aria-hidden="true"
      style={{
        position: 'relative',
        width: size,
        height: size,
        flexShrink: 0,
        borderRadius: '50%',
        overflow: 'hidden',
        background: 'var(--sky)',
        border: '2px solid var(--ink)',
        boxSizing: 'content-box',
        opacity: dimmed ? 0.5 : 1,
      }}
    >
      <img
        src={strayImg}
        alt=""
        style={{
          position: 'absolute',
          maxWidth: 'none',
          width: IMG_W * k,
          height: IMG_H * k,
          left: size / 2 - FACE_X * k,
          top: size / 2 - FACE_Y * k,
        }}
      />
    </span>
  );
}
