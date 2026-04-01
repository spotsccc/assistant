"use client";

import { NavLink } from "@mantine/core";
import { usePathname } from "next/navigation";
import Link from "next/link";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/transactions", label: "Transactions" },
  { href: "/wallets", label: "Wallets" },
  { href: "/categories", label: "Categories" },
  { href: "/currencies", label: "Currencies" },
  { href: "/settings", label: "Settings" },
];

export function Navigation() {
  const pathname = usePathname();

  return (
    <>
      {links.map((link) => (
        <NavLink
          key={link.href}
          component={Link}
          href={link.href}
          label={link.label}
          active={
            link.href === "/"
              ? pathname === "/"
              : pathname.startsWith(link.href)
          }
        />
      ))}
    </>
  );
}
