
import { Transaction, GameRules } from '../types/gameTypes';

// Mock implementation of the core logic from useGameEconomy
export const processTransaction = (
  transactions: Transaction[],
  newTransaction: Omit<Transaction, "id" | "timestamp">,
  filterZero: boolean
): Transaction[] => {
  if (filterZero && newTransaction.amount === 0) {
    return transactions;
  }
  
  return [...transactions, {
    ...newTransaction,
    id: 'test-id',
    timestamp: 123456789
  }];
};

// Simple test runner since we don't have Jest installed
const runTests = () => {
  console.log('Running Economy Logic Tests...');
  
  let passed = 0;
  let failed = 0;
  
  const assert = (condition: boolean, message: string) => {
    if (condition) {
      console.log(`✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${message}`);
      failed++;
    }
  };

  // Test 1: Should add valid transaction
  const initial: Transaction[] = [];
  const tx1 = { playerId: 'p1', type: 'income' as const, description: 'Test', amount: 100 };
  const result1 = processTransaction(initial, tx1, true);
  assert(result1.length === 1 && result1[0].amount === 100, 'Should add valid transaction');

  // Test 2: Should filter zero transaction when enabled
  const txZero = { playerId: 'p1', type: 'income' as const, description: 'Zero', amount: 0 };
  const result2 = processTransaction(initial, txZero, true);
  assert(result2.length === 0, 'Should filter zero transaction when enabled');

  // Test 3: Should NOT filter zero transaction when disabled
  const result3 = processTransaction(initial, txZero, false);
  assert(result3.length === 1 && result3[0].amount === 0, 'Should NOT filter zero transaction when disabled');

  console.log(`\nTests Completed: ${passed} Passed, ${failed} Failed`);
};

// Run if executed directly
// @ts-ignore
if (typeof require !== 'undefined' && require.main === module) {
  runTests();
}

export { runTests };
