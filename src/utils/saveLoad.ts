export const saveGame = (state: any) => {
  try {
    const serializedState = JSON.stringify(state);
    localStorage.setItem('tile_o_polis_save', serializedState);
    return true;
  } catch (err) {
    console.error("Hiba a mentés során:", err);
    return false;
  }
};

export const loadGame = () => {
  try {
    const serializedState = localStorage.getItem('tile_o_polis_save');
    if (serializedState === null) return null;
    return JSON.parse(serializedState);
  } catch (err) {
    console.error("Hiba a betöltés során:", err);
    return null;
  }
};