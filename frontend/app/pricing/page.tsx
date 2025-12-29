"use client";

export const dynamic = "force-dynamic";

import { Check } from "lucide-react";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { getUserIdFromToken } from "@/lib/auth";

export default function PricingPage() {
  const [isPro, setIsPro] = useState(false);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  useEffect(() => {
    async function fetchUser() {
      try {
        const token = localStorage.getItem("access_token");
        if (!token) {
          setLoading(false);
          return;
        }

        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        if (!apiUrl) {
          console.error("NEXT_PUBLIC_API_URL is undefined");
          setLoading(false);
          return;
        }

        const res = await fetch(`${apiUrl}/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          console.error("Failed to fetch /me", res.status);
          setLoading(false);
          return;
        }

        const data = await res.json();
        setIsPro(Boolean(data.is_pro));
      } catch (err) {
        console.error("Error fetching user:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchUser();
  }, []);

  useEffect(() => {
  async function refreshUser() {
    const token = localStorage.getItem("access_token");
    if (!token) return;

    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    const res = await fetch(`${apiUrl}/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (res.ok) {
      const data = await res.json();
      setIsPro(Boolean(data.is_pro));
    }
  }

  if (searchParams.get("success") === "true") {
    toast.success("🎉 Subscription activated! Welcome to Pro");
    refreshUser(); // 🔥 THIS FIXES UI
  }
}, [searchParams]);

  async function startCheckout() {
    const userId = getUserIdFromToken();

    if (!userId) {
      toast.error("Please login first");
      window.location.href = "/login";
      return;
    }

    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error("Unable to start checkout");
      }
    } catch (err) {
      console.error("Checkout error:", err);
      toast.error("Something went wrong");
    }
  }

  return (
    <main className="py-24">
      
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-4xl font-semibold">
          Simple, transparent pricing
        </h1>
        <p className="mt-4 text-muted-foreground">
          Upgrade anytime. Cancel anytime.
        </p>
      </div>

      <div className="mx-auto mt-16 grid max-w-5xl grid-cols-1 gap-8 md:grid-cols-3">
        {/* Free */}
        <Card title="Free" price="₹0">
          <Feature>2 datasets</Feature>
          <Feature>Basic queries</Feature>
        </Card>

        <div className="relative rounded-2xl border border-indigo-500/40 p-8">
          <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-indigo-500 px-3 py-1 text-xs text-white">
            Most Popular
          </span>

          <h3 className="text-lg font-semibold">Pro</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            For professionals
          </p>

          <div className="mt-6">
            <span className="text-4xl font-bold">₹999</span>
            <span className="text-sm text-muted-foreground"> / month</span>
          </div>

          <ul className="mt-6 space-y-3 text-sm">
            <Feature>Unlimited datasets</Feature>
            <Feature>Fast queries</Feature>
            <Feature>Charts & KPIs</Feature>
            <Feature>Priority support</Feature>
          </ul>

          {loading ? (
            <button
              disabled
              className="mt-8 w-full rounded-lg bg-gray-600 py-3 text-white opacity-70"
            >
              Checking plan…
            </button>
          ) : isPro ? (
            <button
              disabled
              className="mt-8 w-full rounded-lg bg-green-600 py-3 text-white cursor-not-allowed"
            >
              You’re on Pro ✅
            </button>
          ) : (
            <button
              onClick={startCheckout}
              className="mt-8 w-full rounded-lg bg-indigo-500 py-3 text-white hover:bg-indigo-600"
            >
              Upgrade to Pro
            </button>
          )}
        </div>

        <Card title="Team" price="Custom">
          <Feature>Multi-user</Feature>
          <Feature>RBAC</Feature>
        </Card>
      </div>
    </main>
  );
}
function Card({
  title,
  price,
  children,
}: {
  title: string;
  price: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/10 p-8">
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-6 text-4xl font-bold">{price}</p>
      <ul className="mt-6 space-y-3 text-sm">{children}</ul>
    </div>
  );
}

function Feature({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-2 text-muted-foreground">
      <Check className="h-4 w-4 text-indigo-500" />
      {children}
    </li>
  );
}