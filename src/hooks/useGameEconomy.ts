import { useCallback } from 'react';
import { Transaction, GameRules } from '../types/gameTypes';

export const useGameEconomy = (
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>,
  gameRules: GameRules,
  filterZeroTransactions: boolean = true
) => {
  const addTransaction = useCallback((playerId: string, type: "income" | "expense", description: string, amount: number) => {
    if (filterZeroTransactions && amount === 0) {
      console.log(`[Economy] Filtered zero transaction: ${description}`);
      return;
    }

    setTransactions(prev => [...prev, {
      id: `tx-${Date.now()}-${Math.random()}`,
      playerId,
      type,
      description,
      amount,
      timestamp: Date.now()
    }]);
  }, [setTransactions, filterZeroTransactions]);

  const addTransactions = useCallback((newTransactions: Omit<Transaction, "id" | "timestamp">[]) => {
    const timestamp = Date.now();
    const filtered = newTransactions.filter(t => {
      if (filterZeroTransactions && t.amount === 0) {
        console.debug(`[Economy] 🛑 Filtered zero transaction: ${t.description} (Player: ${t.playerId})`);
        return false;
      }
      return true;
    }).map(t => ({
      ...t,
      id: `tx-${timestamp}-${Math.random()}`,
      timestamp
    }));

    if (filtered.length > 0) {
      setTransactions(prev => [...prev, ...filtered]);
    }
  }, [setTransactions, filterZeroTransactions]);

  return { addTransaction, addTransactions };
};
