"use client"

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Form, FormField, FormItem, FormLabel, FormMessage, FormControl } from "@/components/ui/form";
import { useRouter } from "next/navigation";

const resetSchema = z.object({
  identifier: z.string().min(2, "Zadejte jméno nebo e-mail"),
});

type ResetFormValues = z.infer<typeof resetSchema>;

export default function DriverResetPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const form = useForm<ResetFormValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: { identifier: "" },
  });

  const onSubmit = async (data: ResetFormValues) => {
    setLoading(true);
    setError("");
    // TODO: Implement actual reset logic (API call)
    await new Promise((r) => setTimeout(r, 1000));
    setLoading(false);
    setSent(true);
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8 space-y-6">
        <h1 className="text-2xl font-bold text-center mb-2">Obnova hesla</h1>
        {sent ? (
          <div className="text-center text-green-700 text-lg">
            Pokud existuje účet, byl odeslán odkaz pro obnovení hesla.
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="identifier"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Jméno nebo e-mail</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        autoFocus
                        className="text-lg py-4"
                        disabled={loading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {error && <div className="text-red-600 text-center">{error}</div>}
              <Button
                type="submit"
                className="w-full text-lg py-4 mt-2"
                disabled={loading}
              >
                {loading ? "Odesílám..." : "Odeslat odkaz pro obnovení"}
              </Button>
            </form>
          </Form>
        )}
        <div className="flex justify-center mt-2">
          <button
            type="button"
            className="text-blue-600 underline text-lg"
            onClick={() => router.push("/dashboard/noviny/distribuce/driver-login")}
            disabled={loading}
          >
            Zpět na přihlášení
          </button>
        </div>
      </div>
    </div>
  );
} 