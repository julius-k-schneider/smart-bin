import { useEffect } from "react";
import { useMap } from "react-leaflet";

export const MapScrollWheelGuard = () => {
  const map = useMap();

  useEffect(() => {
    const container = map.getContainer();
    const enableScrollZoom = () => map.scrollWheelZoom.enable();
    const disableScrollZoom = () => map.scrollWheelZoom.disable();

    disableScrollZoom();
    map.on("click", enableScrollZoom);
    container.addEventListener("mouseleave", disableScrollZoom);

    return () => {
      map.off("click", enableScrollZoom);
      container.removeEventListener("mouseleave", disableScrollZoom);
    };
  }, [map]);

  return null;
};
