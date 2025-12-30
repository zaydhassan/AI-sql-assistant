"use client";

import "../app/globals.css";
import { Toaster } from "sonner";
import { useEffect, useState } from "react";
import Link from "next/link";
import FooterDemo from "@/components/spectrumui/footer-demo";

import {
  Navbar,
  NavBody,
  NavItems,
  MobileNav,
  NavbarButton,
  MobileNavHeader,
  MobileNavToggle,
  MobileNavMenu,
} from "@/components/ui/resizable-navbar";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  useEffect(() => {
  const syncAuth = () =>
    setIsLoggedIn(!!localStorage.getItem("access_token"));

  syncAuth();
  window.addEventListener("storage", syncAuth);
  return () => window.removeEventListener("storage", syncAuth);
}, []);

  function handleLogout() {
    localStorage.removeItem("access_token");
    window.location.href = "/login";
  }

  const navItems = [
    { name: "Features", link: "/features" },
    { name: "Playground", link: "/playground" },
    { name: "Pricing", link: "/pricing" },
    { name: "Contact", link: "/contact" },
  ];

  return (
    <html lang="en">
      <body>
       
        <Navbar className="fixed top-4 z-50">
         
          <NavBody>
            <Link
              href="/"
              className="text-xl font-bold tracking-wide text-white"
            >
              AI SQL
            </Link>

            <NavItems items={navItems} />

            <div className="flex items-center gap-4">
              {!isLoggedIn ? (
                <>
                  <NavbarButton variant="secondary" as={Link} href="/login">
                    Login
                  </NavbarButton>
                  <NavbarButton
                as={Link}
                href="/register"
              className="rounded-full bg-blue-950 text-black px-5 py-2 text-sm font-semibold"
                >
            Sign up
        </NavbarButton> 
                </>
              ) : (
                <NavbarButton
                  className="rounded-full bg-linear-to-r from-indigo-500 to-violet-600
            px-5 py-2 text-sm font-semibold text-white shadow-lg
            hover:brightness-110 transition"
                  onClick={handleLogout}
                >
                  Logout
                </NavbarButton>
              )}
            </div>
          </NavBody>

          <MobileNav>
            <MobileNavHeader>
              <Link
            href="/"
          className="text-lg font-semibold tracking-wide text-white"
            >
            AI SQL
            </Link>
               <MobileNavToggle />
            </MobileNavHeader>

            <MobileNavMenu
              isOpen={isMobileMenuOpen}
              onClose={() => setIsMobileMenuOpen(false)}
            >
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.link}
                  className="text-neutral-300 text-lg"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}

              <div className="mt-6 flex flex-col gap-3">
                {!isLoggedIn ? (
                  <>
                    <NavbarButton
                      variant="secondary"
                      as={Link}
                      href="/login"
                      className="w-full"
                    >
                      Login
                    </NavbarButton>
                   <NavbarButton
                as={Link}
                href="/register"
              className="w-full rounded-full bg-blue text-black font-semibold hover:bg-neutral-200"
                >
              Sign up
                </NavbarButton>

                  </>
                ) : (
                  <NavbarButton
                    variant="secondary"
                    onClick={handleLogout}
                    className="w-full"
                  >
                    Logout
                  </NavbarButton>
                )}
              </div>
            </MobileNavMenu>
          </MobileNav>
        </Navbar>

        <main className="pt-24 min-h-screen">
          {children}
        </main>

        <FooterDemo />
        <Toaster position="top-center" richColors closeButton />
      </body>
    </html>
  );
}