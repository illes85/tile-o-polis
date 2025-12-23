import { supabase } from '@/lib/supabase';

export const saveGame = async (state: any) => {
  try {
    // Mentés local storage-ba biztonsági másolatként
    const serializedState = JSON.stringify(state);
    localStorage.setItem('tile_o_polis_save', serializedState);

    // Mentés Supabase-be
    const { data, error } = await supabase
      .from('game_saves')
      .upsert({ 
        id: 'global_save', // Egyelőre egyetlen közös mentést használunk
        state: state, 
        updated_at: new Date() 
      }, { onConflict: 'id' });

    if (error) throw error;
    return true;
  } catch (err) {
    console.error("Hiba a mentés során:", err);
    return false;
  }
};

export const loadGame = async () => {
  try {
    // Próbáljuk betölteni a felhőből
    const { data, error } = await supabase
      .from('game_saves')
      .select('state')
      .eq('id', 'global_save')
      .single();

    if (data && data.state) {
      return data.state;
    }

    // Ha nincs a felhőben, nézzük meg a local storage-ban
    const serializedState = localStorage.getItem('tile_o_polis_save');
    if (serializedState === null) return null;
    return JSON.parse(serializedState);
  } catch (err) {
    console.error("Hiba a betöltés során:", err);
    return null;
  }
};