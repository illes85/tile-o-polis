"use client";

import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface RoleSelectorProps {
  currentRole: string;
  onRoleChange: (newRole: string) => void;
}

const roles = [
  "Munkanélküli",
  "Kertész/Farmer",
  "Városlakó (Vásárló)",
  "Bolti eladó",
  "Rabló",
  "Bankár",
  "Polgármester",
  "Irodai dolgozó",
  "Rendőr",
  "Tűzoltó",
  "Orvos",
  "Tanító",
  "Taxis",
  "Fuvarozó",
  "Építész",
  "Szerelő",
];

const RoleSelector: React.FC<RoleSelectorProps> = ({ currentRole, onRoleChange }) => {
  return (
    <Card className="w-full mt-4 bg-sidebar-accent text-sidebar-accent-foreground border-sidebar-border shadow-none">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold">Szerepkör választás</CardTitle>
      </CardHeader>
      <CardContent>
        <Label htmlFor="role-select" className="sr-only">Válassz szerepkört</Label>
        <Select onValueChange={onRoleChange} value={currentRole}>
          <SelectTrigger id="role-select" className="w-full bg-sidebar-primary text-sidebar-primary-foreground border-sidebar-border">
            <SelectValue placeholder="Válassz szerepkört" />
          </SelectTrigger>
          <SelectContent className="bg-sidebar text-sidebar-foreground border-sidebar-border">
            {roles.map((role) => (
              <SelectItem key={role} value={role}>
                {role}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardContent>
    </Card>
  );
};

export default RoleSelector;