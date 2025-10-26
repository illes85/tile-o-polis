"use client";

import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { DollarSign, ArrowUpCircle, ArrowDownCircle } from "lucide-react";

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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Pénzmozgások</DialogTitle>
          <DialogDescription>
            Itt láthatod a játékosod pénzmozgásainak történetét.
          </DialogDescription>
        </DialogHeader>
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