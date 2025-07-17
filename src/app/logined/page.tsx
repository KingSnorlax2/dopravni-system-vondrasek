"use client";

import { signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";

export default function LoginedPage() {
  const { data: session } = useSession();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-purple-900 to-purple-800">
      <div className="bg-white rounded-lg shadow-lg p-10 max-w-xl w-full flex flex-col items-center">
        <h1 className="text-3xl font-bold mb-4 text-purple-800 text-center">You are logged in!</h1>
        {session?.user && (
          <p className="mb-4 text-lg text-gray-700">Welcome, {session.user.name || session.user.email}!</p>
        )}
        <Button onClick={() => signOut({ callbackUrl: "/" })} className="w-full text-lg">Logout</Button>
      </div>
    </div>
  );
} 