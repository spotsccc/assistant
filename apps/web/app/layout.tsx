import "@mantine/core/styles.css";
import "@mantine/charts/styles.css";
import "@mantine/dates/styles.css";
import {
  ColorSchemeScript,
  MantineProvider,
  AppShell,
  AppShellNavbar,
  AppShellMain,
} from "@mantine/core";
import { Navigation } from "./components/navigation";
import { QueryProvider } from "./components/query-provider";

export const metadata = {
  title: "Assistant",
  description: "Personal finance assistant",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <head>
        <ColorSchemeScript defaultColorScheme="dark" />
      </head>
      <body>
        <MantineProvider defaultColorScheme="dark">
          <QueryProvider>
            <AppShell navbar={{ width: 220, breakpoint: "sm" }} padding="md">
              <AppShellNavbar p="md">
                <Navigation />
              </AppShellNavbar>
              <AppShellMain>{children}</AppShellMain>
            </AppShell>
          </QueryProvider>
        </MantineProvider>
      </body>
    </html>
  );
}
