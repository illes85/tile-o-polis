"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Coins, HandCoins, Building2, Wallet } from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";

export interface Loan {
  id: string;
  borrowerId: string;
  lenderId: string; // 'system' or player ID
  lenderName: string;
  amount: number;
  interestRate: number; // percentage
  totalRepayment: number;
  remainingRepayment: number;
  dueDate: number; // timestamp
}

export interface BankConfig {
  interestRate: number; // percentage (e.g. 10 for 10%)
  maxLoanAmount: number;
}

interface BankMenuProps {
  isOpen: boolean;
  onClose: () => void;
  bankId: string; // The building ID
  ownerId?: string; // If player owned
  isOwner: boolean;
  currentPlayerId: string;
  currentPlayerMoney: number;
  activeLoans: Loan[];
  onTakeLoan: (amount: number, lenderId: string, interestRate: number) => void;
  onRepayLoan: (loanId: string, amount: number) => void;
  onUpdateConfig?: (interestRate: number, maxLoanAmount: number) => void;
  bankConfig?: BankConfig;
  systemBankConfig?: BankConfig;
}

const BankMenu: React.FC<BankMenuProps> = ({
  isOpen,
  onClose,
  bankId,
  ownerId,
  isOwner,
  currentPlayerId,
  currentPlayerMoney,
  activeLoans,
  onTakeLoan,
  onRepayLoan,
  onUpdateConfig,
  bankConfig,
  systemBankConfig = { interestRate: 20, maxLoanAmount: 10000 } // Default system config (expensive)
}) => {
  const [loanAmount, setLoanAmount] = useState<number>(1000);
  
  // Manage state
  const [newInterestRate, setNewInterestRate] = useState<number>(bankConfig?.interestRate || 15);
  const [newMaxLoan, setNewMaxLoan] = useState<number>(bankConfig?.maxLoanAmount || 5000);

  const currentBankConfig = ownerId ? (bankConfig || { interestRate: 15, maxLoanAmount: 5000 }) : systemBankConfig;
  const lenderId = ownerId || 'system';
  const interestRate = currentBankConfig?.interestRate || 20;
  const maxLoan = currentBankConfig?.maxLoanAmount || 10000;

  const handleTakeLoan = () => {
    if (loanAmount <= 0) return;
    if (loanAmount > maxLoan) {
      showError(`A maximális hitelösszeg ${maxLoan} Ft.`);
      return;
    }
    onTakeLoan(loanAmount, lenderId, interestRate);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-6 w-6" />
            {ownerId ? "Játékos Bank" : "Központi Bank"}
          </DialogTitle>
          <DialogDescription>
            {ownerId ? "Egy játékos által üzemeltetett pénzintézet." : "Állami fenntartású bank, magas kamatokkal."}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="borrow" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="borrow">Kölcsönfelvétel</TabsTrigger>
            <TabsTrigger value="repay">Törlesztés</TabsTrigger>
            {isOwner && <TabsTrigger value="manage">Kezelés</TabsTrigger>}
          </TabsList>

          <TabsContent value="borrow" className="space-y-4 py-4">
            <div className="flex flex-col gap-4">
              <div className="p-4 border rounded-lg bg-muted/50">
                <h3 className="font-semibold mb-2">Aktuális Ajánlat</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>Kamatláb:</div>
                  <div className="font-bold text-red-500">{interestRate}%</div>
                  <div>Maximum felvehető:</div>
                  <div className="font-bold">{maxLoan} Ft</div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Igényelt összeg (Ft)</Label>
                <Input 
                  type="number" 
                  value={loanAmount} 
                  onChange={(e) => setLoanAmount(Number(e.target.value))}
                  min={100}
                  max={maxLoan}
                />
                <div className="text-xs text-muted-foreground">
                  Visszafizetendő: <span className="font-bold">{Math.floor(loanAmount * (1 + interestRate / 100))} Ft</span>
                </div>
              </div>

              <Button onClick={handleTakeLoan} className="w-full">
                <HandCoins className="mr-2 h-4 w-4" /> Kölcsön felvétele
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="repay" className="space-y-4 py-4">
             {activeLoans.length === 0 ? (
                <div className="text-center text-muted-foreground">Nincs aktív tartozásod.</div>
             ) : (
                <div className="space-y-3">
                  {activeLoans.map(loan => (
                    <div key={loan.id} className="p-3 border rounded-lg flex justify-between items-center">
                       <div>
                          <div className="font-semibold">{loan.lenderName}</div>
                          <div className="text-sm text-muted-foreground">
                             Tartozás: {loan.remainingRepayment} / {loan.totalRepayment} Ft
                          </div>
                       </div>
                       <Button 
                         size="sm" 
                         variant="outline"
                         disabled={currentPlayerMoney < 1}
                         onClick={() => onRepayLoan(loan.id, Math.min(currentPlayerMoney, loan.remainingRepayment))}
                       >
                         Törlesztés (Max)
                       </Button>
                    </div>
                  ))}
                </div>
             )}
          </TabsContent>

          {isOwner && (
            <TabsContent value="manage" className="space-y-4 py-4">
               <div className="space-y-4">
                 <div className="space-y-2">
                    <Label>Kamatláb (%)</Label>
                    <Input 
                      type="number" 
                      value={newInterestRate} 
                      onChange={(e) => setNewInterestRate(Number(e.target.value))}
                    />
                 </div>
                 <div className="space-y-2">
                    <Label>Max hitelösszeg (Ft)</Label>
                    <Input 
                      type="number" 
                      value={newMaxLoan} 
                      onChange={(e) => setNewMaxLoan(Number(e.target.value))}
                    />
                 </div>
                 <Button onClick={() => {
                    if (onUpdateConfig) onUpdateConfig(newInterestRate, newMaxLoan);
                    onClose();
                 }}>
                    Beállítások mentése
                 </Button>
               </div>
            </TabsContent>
          )}
        </Tabs>

        <DialogFooter>
           <div className="flex w-full justify-between items-center text-xs text-muted-foreground">
              <div className="flex items-center">
                 <Wallet className="h-3 w-3 mr-1" /> Egyenleged: {currentPlayerMoney} Ft
              </div>
           </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BankMenu;
