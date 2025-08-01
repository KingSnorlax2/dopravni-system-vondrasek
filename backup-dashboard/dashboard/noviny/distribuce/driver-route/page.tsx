"use client"

import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Form, FormField, FormItem, FormLabel, FormMessage, FormControl } from "@/components/ui/form";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useAccessControl } from "@/hooks/useAccessControl";

const scanSchema = z.object({
  barcode: z.string().min(3, "Naskenujte kód trasy"),
});

type ScanFormValues = z.infer<typeof scanSchema>;

// Dummy function to simulate fetching route details
async function fetchRouteDetails(barcode: string) {
  await new Promise((r) => setTimeout(r, 500));
  if (barcode === "123456") {
    return {
      name: "Trasa A",
      area: "Praha 1",
      stops: 15,
    };
  }
  if (barcode === "654321") {
    return {
      name: "Trasa B",
      area: "Praha 2",
      stops: 10,
    };
  }
  return null;
}

export default function DriverRoutePage() {
  const { data: session } = useSession();
  const { hasRole, loading } = useAccessControl();
  const [route, setRoute] = useState<any>(null);
  const [error, setError] = useState("");
  const [loadingState, setLoadingState] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!loading && !hasRole("DRIVER")) {
      router.replace("/403");
    }
  }, [loading, hasRole, router]);

  const form = useForm<ScanFormValues>({
    resolver: zodResolver(scanSchema),
    defaultValues: { barcode: "" },
  });

  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, [route]);

  // Auto logout after 5 min inactivity
  useEffect(() => {
    const timeout = setTimeout(() => {
      signOut({ callbackUrl: "/dashboard/noviny/distribuce/driver-login" });
    }, 5 * 60 * 1000);
    return () => clearTimeout(timeout);
  }, []);

  const onSubmit = async (data: ScanFormValues) => {
    setLoadingState(true);
    setError("");
    const details = await fetchRouteDetails(data.barcode);
    setLoadingState(false);
    if (!details) {
      setError("Trasa nenalezena");
      setRoute(null);
    } else {
      setRoute(details);
    }
  };

  const handleConfirm = async () => {
    setConfirming(true);
    // TODO: Save confirmation to backend (API call)
    await new Promise((r) => setTimeout(r, 1000));
    setConfirming(false);
    router.push("/dashboard/noviny/distribuce/driver-login");
  };

  const driverName = session?.user?.name || "";
  const now = new Date();
  const dateStr = now.toLocaleDateString("cs-CZ");
  const timeStr = now.toLocaleTimeString("cs-CZ", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gray-50 p-4">
      <div className="w-full max-w-xl bg-white rounded-lg shadow-lg p-8 space-y-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4 gap-2">
          <div className="text-lg font-semibold">Řidič: <span className="font-bold">{driverName}</span></div>
          <div className="text-lg">{dateStr} {timeStr}</div>
        </div>
        {!route ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="barcode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kód trasy (naskenujte)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        ref={inputRef}
                        autoFocus
                        className="text-lg py-4 tracking-widest"
                        disabled={loadingState}
                        inputMode="numeric"
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
                disabled={loadingState}
              >
                {loadingState ? "Načítám..." : "Zobrazit trasu"}
              </Button>
            </form>
          </Form>
        ) : (
          <div className="space-y-6">
            <div className="text-center text-2xl font-bold mb-4">Informace o trase</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-lg">
              <div><span className="font-semibold">Název:</span> {route.name}</div>
              <div><span className="font-semibold">Oblast:</span> {route.area}</div>
              <div><span className="font-semibold">Počet zastávek:</span> {route.stops}</div>
            </div>
            <Button
              type="button"
              className="w-full text-lg py-4 mt-4"
              onClick={handleConfirm}
              disabled={confirming}
            >
              {confirming ? "Potvrzuji..." : "Potvrdit trasu"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
} 