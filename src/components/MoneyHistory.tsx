"use client";

import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Coins, ArrowUpCircle, ArrowDownCircle } from "lucide-react"; // DollarSign helyett Coins

export interface Transaction {
  id: string;
  playerId: string;
  type: "income" | "expense";
  description: string;
  amount: number;
  timestamp: number; // Unix timestamp
}

interface MoneyHistoryProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  currentPlayerId: string;
}

const MoneyHistory: React.FC<MoneyHistoryProps> = ({ isOpen, onClose, transactions, currentPlayerId }) => {
  const playerTransactions = transactions
    .filter(t => t.playerId === currentPlayerId)
    .sort((a, b) => b.timestamp - a.timestamp); // Legújabb felül

  // Calculate summary
  const totalIncome = playerTransactions
    .filter(t => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = playerTransactions
    .filter(t => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Pénzmozgások</DialogTitle>
          <DialogDescription>
            Itt láthatod a játékosod pénzmozgásainak történetét.
          </DialogDescription>
        </DialogHeader>
        <div className="mb-4 p-2 border rounded-md bg-gray-50 dark:bg-gray-800">
          <h3 className="font-semibold text-lg mb-2">Összesítés:</h3>
          <div className="flex justify-between items-center mb-1">
            <span className="text-green-600 flex items-center"><ArrowUpCircle className="h-4 w-4 mr-1" /> Összes bevétel:</span>
            <span className="font-bold text-green-600">{totalIncome} pénz</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-red-600 flex items-center"><ArrowDownCircle className="h-4 w-4 mr-1" /> Összes kiadás:</span>
            <span className="font-bold text-red-600">{totalExpense} pénz</span>
          </div>
        </div>
        <ScrollArea className="h-[300px] w-full rounded-md border p-4">
          {playerTransactions.length === 0 ? (
            <p className="text-center text-muted-foreground">Nincsenek tranzakciók.</p>
          ) : (
            <div className="space-y-4">
              {playerTransactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between">
                  <div className="flex items-center">
                    {transaction.type === "income" ? (
                      <ArrowUpCircle className="h-5 w-5 text-green-500 mr-2" />
                    ) : (
                      <ArrowDownCircle className="h-5 w-5 text-red-500 mr-2" />
                    )}
                    <div>
                      <p className="font-medium">{transaction.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(transaction.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <span className={`font-semibold ${transaction.type === "income" ? "text-green-500" : "text-red-500"}`}>
                    {transaction.type === "income" ? "+" : "-"} {transaction.amount} pénz
                  </span>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default MoneyHistory;