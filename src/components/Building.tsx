"use client";

import React from "react";

interface BuildingProps {
  id: string; // Hozzáadva az id a kattintás kezeléséhez
  x: number; // rács x koordinátája
  y: number; // rács y koordinátája
  width: number; // rács egységekben
  height: number; // rács egységekben
  type: "house"; // vagy más típusok később
  cellSizePx: number;
  rentalPrice?: number; // A bérleti díj adatként megmarad, de nem jelenik meg itt
  onClick: (buildingId: string) => void; // Új prop a kattintás kezeléséhez
}

const Building: React.FC<BuildingProps> = ({ id, x, y, width, height, type, cellSizePx, onClick }) => {
  const style: React.CSSProperties = {
    position: "absolute",
    left: x * cellSizePx,
    top: y * cellSizePx,
    width: width * cellSizePx,
    height: height * cellSizePx,
  };

  let content;
  let classes = "border border-gray-500 flex flex-col items-center justify-center text-xs text-white p-1 cursor-pointer hover:bg-stone-500 transition-colors";

  switch (type) {
    case "house":
      classes += " bg-stone-400 rounded-md shadow-md";
      content = (
        <>
          Ház
          {/* A bérleti díj már nem jelenik meg itt */}
        </>
      );
      break;
    default:
      content = "Ismeretlen épület";
  }

  return (
    <div style={style} className={classes} onClick={() => onClick(id)}>
      {content}
    </div>
  );
};

export default Building;