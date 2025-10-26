"use client";

import React from "react";

interface BuildingProps {
  x: number; // rács x koordinátája
  y: number; // rács y koordinátája
  width: number; // rács egységekben
  height: number; // rács egységekben
  type: "house"; // vagy más típusok később
  cellSizePx: number;
}

const Building: React.FC<BuildingProps> = ({ x, y, width, height, type, cellSizePx }) => {
  const style: React.CSSProperties = {
    position: "absolute",
    left: x * cellSizePx,
    top: y * cellSizePx,
    width: width * cellSizePx,
    height: height * cellSizePx,
  };

  let content;
  let classes = "border border-gray-500 flex items-center justify-center text-xs text-white";

  switch (type) {
    case "house":
      classes += " bg-stone-400 rounded-md shadow-md";
      content = "Ház";
      break;
    default:
      content = "Ismeretlen épület";
  }

  return (
    <div style={style} className={classes}>
      {content}
    </div>
  );
};

export default Building;