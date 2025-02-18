"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface Setting {
  id: number;
  key: string;
  value: string;
  category: string;
  label: string;
  type: "text" | "number" | "boolean" | "select";
  options?: string[];
}

export default function AdminSettings() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    try {
      const response = await fetch('/api/admin/settings');
      if (!response.ok) throw new Error('Chyba při načítání nastavení');
      const data = await response.json();
      setSettings(data);
    } catch (error) {
      toast.error('Nepodařilo se načíst nastavení');
    } finally {
      setLoading(false);
    }
  }

  async function updateSetting(setting: Setting) {
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(setting)
      });
      
      if (!response.ok) throw new Error('Chyba při ukládání');
      toast.success('Nastavení bylo uloženo');
      fetchSettings();
    } catch (error) {
      toast.error('Nepodařilo se uložit nastavení');
    }
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Nastavení systému</h1>
      
      {loading ? (
        <div>Načítání...</div>
      ) : (
        <div className="grid gap-6">
          {Object.entries(
            settings.reduce((acc, setting) => {
              const category = setting.category;
              if (!acc[category]) acc[category] = [];
              acc[category].push(setting);
              return acc;
            }, {} as Record<string, Setting[]>)
          ).map(([category, categorySettings]) => (
            <Card key={category}>
              <CardHeader>
                <CardTitle>{category}</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4">
                {categorySettings.map(setting => (
                  <div key={setting.key} className="flex items-center justify-between">
                    <label className="font-medium">{setting.label}</label>
                    {renderSettingInput(setting, updateSetting)}
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function renderSettingInput(setting: Setting, onUpdate: (setting: Setting) => void) {
  switch (setting.type) {
    case "boolean":
      return (
        <Switch
          checked={setting.value === "true"}
          onCheckedChange={(checked) => 
            onUpdate({ ...setting, value: String(checked) })
          }
        />
      );
    case "select":
      return (
        <Select
          value={setting.value}
          onValueChange={(value) => onUpdate({ ...setting, value })}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {setting.options?.map(option => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    default:
      return (
        <Input
          type={setting.type}
          value={setting.value}
          onChange={(e) => onUpdate({ ...setting, value: e.target.value })}
          className="w-[200px]"
        />
      );
  }
} 