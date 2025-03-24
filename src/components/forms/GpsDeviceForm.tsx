'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "@/components/ui/use-toast";

const formSchema = z.object({
  gpsDeviceId: z.string().min(1, "ID zařízení je povinné"),
});

interface GpsDeviceFormProps {
  vehicleId: string;
  currentDeviceId?: string;
  onSuccessAction: () => void;
}

export function GpsDeviceForm({ vehicleId, currentDeviceId, onSuccessAction }: GpsDeviceFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      gpsDeviceId: currentDeviceId || "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsSubmitting(true);
      
      const response = await fetch(`/api/auta/${vehicleId}/gps-device`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update GPS device');
      }
      
      toast({
        title: "Úspěch",
        description: "GPS zařízení bylo úspěšně přiřazeno",
      });
      
      onSuccessAction();
    } catch (error) {
      console.error('Error updating GPS device:', error);
      
      toast({
        title: "Chyba",
        description: "Nepodařilo se přiřadit GPS zařízení",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="gpsDeviceId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>ID GPS zařízení</FormLabel>
              <FormControl>
                <Input placeholder="Zadejte ID zařízení" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex justify-end space-x-2">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Ukládám..." : "Uložit"}
          </Button>
        </div>
      </form>
    </Form>
  );
} 