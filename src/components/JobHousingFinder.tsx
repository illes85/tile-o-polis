"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card"; // HIÁNYZÓ IMPORT HOZZÁADVA
import { ScrollArea } from "@/components/ui/scroll-area";
import { Briefcase, Home, Coins, Users, Factory, Leaf, ShoppingBag, Popcorn, Warehouse, CheckCircle, XCircle } from "lucide-react";
import { BuildingData } from "@/components/Map";
import { showSuccess, showError } from "@/utils/toast";

interface Player {
    id: string;
    name: string;
    money: number;
    workplace: string;
}

interface JobHousingFinderProps {
    isOpen: boolean;
    onClose: () => void;
    buildings: BuildingData[];
    currentPlayer: Player;
    onApplyForJob: (buildingId: string) => void;
    onRentHouse: (buildingId: string) => void;
}

const JobHousingFinder: React.FC<JobHousingFinderProps> = ({
    isOpen,
    onClose,
    buildings,
    currentPlayer,
    onApplyForJob,
    onRentHouse,
}) => {
    const [activeTab, setActiveTab] = useState<"jobs" | "housing">("jobs");

    const availableJobs = buildings.filter(b => 
        b.salary !== undefined && b.employeeIds.length < b.capacity && b.type !== 'road' && !b.isUnderConstruction
    );

    const availableHousing = buildings.filter(b => 
        b.rentalPrice !== undefined && b.residentIds.length < b.capacity && !b.isUnderConstruction
    );

    const isEmployed = currentPlayer.workplace !== "Munkanélküli";
    const isRenting = buildings.some(b => b.residentIds.includes(currentPlayer.id));

    const getBuildingIcon = (type: BuildingData['type']) => {
        switch (type) {
            case 'office': return <Factory className="h-4 w-4 text-blue-500" />;
            case 'forestry': return <Leaf className="h-4 w-4 text-green-600" />;
            case 'shop': return <ShoppingBag className="h-4 w-4 text-purple-500" />;
            case 'mill': return <Warehouse className="h-4 w-4 text-amber-700" />;
            case 'farm': return <Leaf className="h-4 w-4 text-green-500" />;
            case 'popcorn_stand': return <Popcorn className="h-4 w-4 text-red-500" />;
            default: return <Briefcase className="h-4 w-4 text-gray-500" />;
        }
    };

    const renderJobCard = (job: BuildingData) => {
        const isCurrentWorkplace = currentPlayer.workplace === job.name;
        const canApply = !isEmployed || isCurrentWorkplace;

        return (
            <Card key={job.id} className="p-3 flex justify-between items-center border-l-4 border-blue-500">
                <div className="flex items-center space-x-3">
                    {getBuildingIcon(job.type)}
                    <div>
                        <h4 className="font-semibold text-sm">{job.name}</h4>
                        <p className="text-xs text-muted-foreground flex items-center">
                            <Coins className="h-3 w-3 mr-1 text-green-500" /> Fizetés: {job.salary} pénz/ciklus
                        </p>
                        <p className="text-xs text-muted-foreground flex items-center">
                            <Users className="h-3 w-3 mr-1" /> Szabad helyek: {job.capacity - job.employeeIds.length} / {job.capacity}
                        </p>
                    </div>
                </div>
                <Button 
                    size="sm" 
                    onClick={() => onApplyForJob(job.id)}
                    disabled={isEmployed && !isCurrentWorkplace}
                    variant={isCurrentWorkplace ? "secondary" : "default"}
                >
                    {isCurrentWorkplace ? <><CheckCircle className="h-4 w-4 mr-1" /> Itt dolgozol</> : "Jelentkezés"}
                </Button>
            </Card>
        );
    };

    const renderHousingCard = (house: BuildingData) => {
        const isCurrentResidence = house.residentIds.includes(currentPlayer.id);
        const canRent = !isRenting || isCurrentResidence;
        const isAffordable = currentPlayer.money >= (house.rentalPrice || 0);

        return (
            <Card key={house.id} className={`p-3 flex justify-between items-center border-l-4 ${isAffordable ? 'border-green-500' : 'border-red-500'}`}>
                <div className="flex items-center space-x-3">
                    <Home className="h-4 w-4 text-indigo-500" />
                    <div>
                        <h4 className="font-semibold text-sm">{house.name}</h4>
                        <p className="text-xs text-muted-foreground flex items-center">
                            <Coins className="h-3 w-3 mr-1 text-red-500" /> Bérleti díj: {house.rentalPrice} pénz/ciklus
                        </p>
                        <p className="text-xs text-muted-foreground flex items-center">
                            <Users className="h-3 w-3 mr-1" /> Szabad helyek: {house.capacity - house.residentIds.length} / {house.capacity}
                        </p>
                    </div>
                </div>
                <Button 
                    size="sm" 
                    onClick={() => onRentHouse(house.id)}
                    disabled={!canRent || !isAffordable}
                    variant={isCurrentResidence ? "secondary" : "default"}
                >
                    {isCurrentResidence ? <><CheckCircle className="h-4 w-4 mr-1" /> Itt laksz</> : "Bérlés"}
                </Button>
            </Card>
        );
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Briefcase className="h-5 w-5" /> Állás és Ingatlan Kereső
                    </DialogTitle>
                    <DialogDescription>
                        Keress munkát vagy kiadó lakást a városban.
                    </DialogDescription>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "jobs" | "housing")} className="flex-1 flex flex-col">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="jobs" className="flex items-center"><Briefcase className="h-4 w-4 mr-2" /> Állások ({availableJobs.length})</TabsTrigger>
                        <TabsTrigger value="housing" className="flex items-center"><Home className="h-4 w-4 mr-2" /> Lakások ({availableHousing.length})</TabsTrigger>
                    </TabsList>

                    <ScrollArea className="flex-1 pt-4">
                        <TabsContent value="jobs" className="space-y-3">
                            {isEmployed && <p className="text-sm text-center text-yellow-600 italic mb-4">Jelenleg itt dolgozol: {currentPlayer.workplace}. Új állásért fel kell mondanod a jelenlegi munkahelyeden.</p>}
                            {availableJobs.length === 0 ? (
                                <p className="text-center text-muted-foreground italic py-8">Jelenleg nincs szabad állás.</p>
                            ) : (
                                availableJobs.map(renderJobCard)
                            )}
                        </TabsContent>

                        <TabsContent value="housing" className="space-y-3">
                            {isRenting && <p className="text-sm text-center text-yellow-600 italic mb-4">Jelenleg már bérelsz egy ingatlant. Csak egyet bérelhetsz egyszerre.</p>}
                            {availableHousing.length === 0 ? (
                                <p className="text-center text-muted-foreground italic py-8">Jelenleg nincs kiadó ingatlan.</p>
                            ) : (
                                availableHousing.map(renderHousingCard)
                            )}
                        </TabsContent>
                    </ScrollArea>
                </Tabs>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Bezárás</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default JobHousingFinder;