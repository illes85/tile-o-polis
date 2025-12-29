import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGameEconomy } from '../useGameEconomy';

// Mock dependencies if needed
// For this simple hook, we might not need complex mocks if we use renderHook

describe('useGameEconomy', () => {
  it('should add a transaction when amount is non-zero', () => {
    const setTransactions = vi.fn();
    const gameRules = {
      cycleTime: 30000,
      winMoney: 0,
      winCompanies: 0,
      loseInsolvencyCycles: 0
    };
    
    const { result } = renderHook(() => useGameEconomy(setTransactions, gameRules, true));

    act(() => {
      result.current.addTransaction('p1', 'income', 'Test Income', 100);
    });

    expect(setTransactions).toHaveBeenCalled();
  });

  it('should not add a transaction when amount is zero and filtering is enabled', () => {
    const setTransactions = vi.fn();
    const gameRules = {
      cycleTime: 30000,
      winMoney: 0,
      winCompanies: 0,
      loseInsolvencyCycles: 0
    };
    
    const { result } = renderHook(() => useGameEconomy(setTransactions, gameRules, true));

    act(() => {
      result.current.addTransaction('p1', 'income', 'Zero Income', 0);
    });

    expect(setTransactions).not.toHaveBeenCalled();
  });

  it('should add a transaction when amount is zero but filtering is disabled', () => {
    const setTransactions = vi.fn();
    const gameRules = {
      cycleTime: 30000,
      winMoney: 0,
      winCompanies: 0,
      loseInsolvencyCycles: 0
    };
    
    const { result } = renderHook(() => useGameEconomy(setTransactions, gameRules, false));

    act(() => {
      result.current.addTransaction('p1', 'income', 'Zero Income Allowed', 0);
    });

    expect(setTransactions).toHaveBeenCalled();
  });
});
