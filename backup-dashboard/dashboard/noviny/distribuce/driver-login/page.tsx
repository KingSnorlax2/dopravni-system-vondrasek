"use client"

import { useState } from "react";
import { signIn, useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Form, FormField, FormItem, FormLabel, FormMessage, FormControl } from "@/components/ui/form";
import { useRouter } from "next/navigation";

const loginSchema = z.object({
  email: z.string().min(2, "Zadejte jméno nebo email"),
  password: z.string().min(4, "Zadejte heslo"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function DriverLoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const { data: session, update: updateSession } = useSession();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setLoading(true);
    setError("");
    const res = await signIn("credentials", {
      redirect: false,
      email: data.email, // Use 'email' for both email and username
      password: data.password,
    });
    setLoading(false);
    if (res?.error) {
      setError("Neplatné přihlašovací údaje");
    } else {
      // Update session to get fresh user data
      await updateSession();
      // Get updated session after refresh
      const updatedSession = await fetch('/api/auth/session').then(r => r.json());
      const userRole = updatedSession?.user?.role;
      
      if (userRole === "DRIVER" || userRole === "RIDIC") {
        router.push("/dashboard/noviny/distribuce/driver-route");
      } else if (userRole === "ADMIN") {
        router.push("/dashboard/auta");
      } else {
        router.push("/");
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8 space-y-6">
        <h1 className="text-2xl font-bold text-center mb-2">Přihlášení řidiče</h1>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Jméno nebo email</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      autoFocus
                      autoComplete="username"
                      className="text-lg py-4"
                      disabled={loading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Heslo</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="password"
                      autoComplete="current-password"
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
              {loading ? "Přihlašuji..." : "Přihlásit se"}
            </Button>
          </form>
        </Form>
        <div className="flex justify-center mt-2">
          <button
            type="button"
            className="text-blue-600 underline text-lg"
            onClick={() => router.push("/dashboard/noviny/distribuce/driver-reset-password")}
            disabled={loading}
          >
            Zapomněli jste heslo?
          </button>
        </div>
      </div>
    </div>
  );
} 