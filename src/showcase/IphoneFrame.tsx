import { useLayoutEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import {
  IPHONE_FRAME_BOUNDS,
  IPHONE_FRAME_IMAGE,
  IPHONE_SCREEN_VIEWPORT,
} from './mockupGeometry';

const PRODUCT_VIEWPORT = { width: 402, height: 844 } as const;
const DISPLAY_OVERSCAN = 1;

const aperture = {
  left: (IPHONE_SCREEN_VIEWPORT.x - IPHONE_FRAME_BOUNDS.x) / IPHONE_FRAME_BOUNDS.width,
  top: (IPHONE_SCREEN_VIEWPORT.y - IPHONE_FRAME_BOUNDS.y) / IPHONE_FRAME_BOUNDS.height,
  width: IPHONE_SCREEN_VIEWPORT.width / IPHONE_FRAME_BOUNDS.width,
  height: IPHONE_SCREEN_VIEWPORT.height / IPHONE_FRAME_BOUNDS.height,
  radiusX: IPHONE_SCREEN_VIEWPORT.cornerRadius / IPHONE_SCREEN_VIEWPORT.width,
  radiusY: IPHONE_SCREEN_VIEWPORT.cornerRadius / IPHONE_SCREEN_VIEWPORT.height,
} as const;

const image = {
  left: -IPHONE_FRAME_BOUNDS.x / IPHONE_FRAME_BOUNDS.width,
  top: -IPHONE_FRAME_BOUNDS.y / IPHONE_FRAME_BOUNDS.height,
  width: IPHONE_FRAME_IMAGE.width / (IPHONE_FRAME_IMAGE.width * IPHONE_FRAME_BOUNDS.width),
  height: IPHONE_FRAME_IMAGE.height / (IPHONE_FRAME_IMAGE.height * IPHONE_FRAME_BOUNDS.height),
} as const;

interface IphoneFrameProps {
  scale: number;
}

export default function IphoneFrame({ scale }: IphoneFrameProps) {
  const apertureRef = useRef<HTMLDivElement>(null);
  const [productScale, setProductScale] = useState(1);

  useLayoutEffect(() => {
    const element = apertureRef.current;
    if (!element) return;

    const updateScale = () => {
      const { clientWidth: width, clientHeight: height } = element;
      /*
       * The source display aperture (294 x 633) is slightly taller than the
       * approved 402 x 844 product viewport. Containing the iframe exposed the
       * aperture's fallback background above and below every route. Covering
       * the aperture keeps the product uniformly scaled and lets the hardware
       * bezel crop the small horizontal excess instead. One CSS pixel of
       * overscan also prevents fractional-transform seams at scaled sizes.
       */
      setProductScale(Math.max(
        (width + DISPLAY_OVERSCAN * 2) / PRODUCT_VIEWPORT.width,
        (height + DISPLAY_OVERSCAN * 2) / PRODUCT_VIEWPORT.height,
      ));
    };

    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const style = {
    '--iphone-aperture-left': `${aperture.left * 100}%`,
    '--iphone-aperture-top': `${aperture.top * 100}%`,
    '--iphone-aperture-width': `${aperture.width * 100}%`,
    '--iphone-aperture-height': `${aperture.height * 100}%`,
    '--iphone-aperture-radius-x': `${aperture.radiusX * 100}%`,
    '--iphone-aperture-radius-y': `${aperture.radiusY * 100}%`,
    '--iphone-frame-image-left': `${image.left * 100}%`,
    '--iphone-frame-image-top': `${image.top * 100}%`,
    '--iphone-frame-image-width': `${image.width * 100}%`,
    '--iphone-frame-image-height': `${image.height * 100}%`,
    '--iphone-product-scale': productScale,
    '--iphone-device-scale': scale,
  } as CSSProperties;

  return (
    <div className="iphone-frame" style={style}>
      <div ref={apertureRef} className="iphone-frame__aperture">
        <div className="iphone-frame__product-viewport">
          <iframe
            className="iphone-frame__product"
            src={`${import.meta.env.BASE_URL}#/screens/app`}
            title="Interactive Vishruth scrapbook application"
          />
        </div>
      </div>
      <img className="iphone-frame__hardware" src={`${import.meta.env.BASE_URL}mockups/iphone-frame.png`} alt="" aria-hidden="true" />
    </div>
  );
}
