"use client";

import {
  Title,
  Card,
  Text,
  Group,
  Stack,
  Badge,
  Select,
  SimpleGrid,
  SegmentedControl,
  Skeleton,
  Paper,
} from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import { useQuery } from "@tanstack/react-query";
import { DonutChart, BarChart } from "@mantine/charts";
import { useState } from "react";
import "dayjs/locale/ru";

interface WalletBalance {
  currencyCode: string;
  currencySymbol: string | null;
  balance: string;
}

interface Wallet {
  id: string;
  name: string;
  balances: WalletBalance[];
}

interface SummaryRow {
  currencyCode: string;
  currencySymbol: string | null;
  totalIncome: string;
  totalExpenses: string;
  net: string;
}

interface SpendingByCategory {
  categoryId: string | null;
  categoryName: string | null;
  total: string;
  count: number;
}

interface TimePeriodRow {
  period: string;
  total: string;
  count: number;
}

const DONUT_COLORS = [
  "blue.6",
  "teal.6",
  "grape.6",
  "orange.6",
  "cyan.6",
  "pink.6",
  "lime.6",
  "indigo.6",
  "yellow.6",
  "violet.6",
];

function formatAmount(value: string | number, symbol: string | null, code: string) {
  const num = typeof value === "string" ? parseFloat(value) : value;
  const formatted = num.toLocaleString("ru-RU", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return symbol ? `${formatted} ${symbol}` : `${formatted} ${code}`;
}

function formatPeriodLabel(isoDate: string, groupBy: "day" | "week" | "month") {
  const date = new Date(isoDate);
  if (groupBy === "day") {
    return date.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
  }
  if (groupBy === "week") {
    const end = new Date(date);
    end.setDate(end.getDate() + 6);
    return `${date.toLocaleDateString("ru-RU", { day: "numeric", month: "short" })} – ${end.toLocaleDateString("ru-RU", { day: "numeric", month: "short" })}`;
  }
  return date.toLocaleDateString("ru-RU", { month: "long", year: "numeric" });
}

function buildSearchParams(
  filters: { walletId: string | null; dateFrom: Date | null; dateTo: Date | null },
  extra?: Record<string, string>,
) {
  const params = new URLSearchParams();
  if (filters.walletId) params.set("walletId", filters.walletId);
  if (filters.dateFrom) params.set("dateFrom", filters.dateFrom.toISOString());
  if (filters.dateTo) params.set("dateTo", filters.dateTo.toISOString());
  if (extra) {
    for (const [k, v] of Object.entries(extra)) params.set(k, v);
  }
  return params.toString();
}

export default function DashboardPage() {
  const [walletId, setWalletId] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState<Date | null>(null);
  const [dateTo, setDateTo] = useState<Date | null>(null);
  const [groupBy, setGroupBy] = useState<string>("month");

  const filters = { walletId, dateFrom, dateTo };

  const walletsQuery = useQuery<Wallet[]>({
    queryKey: ["wallets"],
    queryFn: () =>
      fetch("/api/wallets").then((r) => r.json() as Promise<Wallet[]>),
  });

  const summaryQuery = useQuery<SummaryRow[]>({
    queryKey: ["reports", "summary", walletId, dateFrom?.toISOString(), dateTo?.toISOString()],
    queryFn: () =>
      fetch(`/api/reports/summary?${buildSearchParams(filters)}`).then(
        (r) => r.json() as Promise<SummaryRow[]>,
      ),
  });

  const categoryQuery = useQuery<SpendingByCategory[]>({
    queryKey: ["reports", "spending", "category", walletId, dateFrom?.toISOString(), dateTo?.toISOString()],
    queryFn: () =>
      fetch(
        `/api/reports/spending?${buildSearchParams(filters, { groupBy: "category" })}`,
      ).then((r) => r.json() as Promise<SpendingByCategory[]>),
  });

  const spendingTimeQuery = useQuery<TimePeriodRow[]>({
    queryKey: ["reports", "spending", "time", groupBy, walletId, dateFrom?.toISOString(), dateTo?.toISOString()],
    queryFn: () =>
      fetch(
        `/api/reports/spending?${buildSearchParams(filters, { groupBy })}`,
      ).then((r) => r.json() as Promise<TimePeriodRow[]>),
  });

  const incomeTimeQuery = useQuery<TimePeriodRow[]>({
    queryKey: ["reports", "income", groupBy, walletId, dateFrom?.toISOString(), dateTo?.toISOString()],
    queryFn: () =>
      fetch(
        `/api/reports/income?${buildSearchParams(filters, { groupBy })}`,
      ).then((r) => r.json() as Promise<TimePeriodRow[]>),
  });

  const wallets = walletsQuery.data ?? [];
  const walletOptions = wallets.map((w) => ({ value: w.id, label: w.name }));
  const summary = summaryQuery.data ?? [];
  const categoryData = categoryQuery.data ?? [];
  const spendingTime = spendingTimeQuery.data ?? [];
  const incomeTime = incomeTimeQuery.data ?? [];

  // Merge income + spending time series for the combined chart
  const mergedTimeData = (() => {
    const map = new Map<string, { period: string; Расходы: number; Доходы: number }>();
    for (const row of spendingTime) {
      const label = formatPeriodLabel(row.period, groupBy as "day" | "week" | "month");
      map.set(row.period, { period: label, Расходы: parseFloat(row.total), Доходы: 0 });
    }
    for (const row of incomeTime) {
      const existing = map.get(row.period);
      if (existing) {
        existing.Доходы = parseFloat(row.total);
      } else {
        const label = formatPeriodLabel(row.period, groupBy as "day" | "week" | "month");
        map.set(row.period, { period: label, Расходы: 0, Доходы: parseFloat(row.total) });
      }
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, v]) => v);
  })();

  // Donut chart data
  const donutData = categoryData.map((item, i) => ({
    name: item.categoryName ?? "Без категории",
    value: parseFloat(item.total),
    color: DONUT_COLORS[i % DONUT_COLORS.length]!,
  }));

  // Spending over time bar chart data
  const spendingBarData = spendingTime.map((row) => ({
    period: formatPeriodLabel(row.period, groupBy as "day" | "week" | "month"),
    Расходы: parseFloat(row.total),
  }));

  return (
    <Stack gap="md">
      <Title order={2}>Дашборд</Title>

      {/* Filters */}
      <Paper p="sm" withBorder>
        <Group gap="sm" wrap="wrap">
          <DatePickerInput
            label="С"
            placeholder="Начало периода"
            value={dateFrom}
            onChange={setDateFrom}
            clearable
            locale="ru"
            w={180}
          />
          <DatePickerInput
            label="По"
            placeholder="Конец периода"
            value={dateTo}
            onChange={setDateTo}
            clearable
            locale="ru"
            w={180}
          />
          <Select
            label="Кошелёк"
            placeholder="Все кошельки"
            clearable
            data={walletOptions}
            value={walletId}
            onChange={setWalletId}
            w={200}
          />
          <Stack gap={4}>
            <Text size="sm" fw={500}>
              Период
            </Text>
            <SegmentedControl
              value={groupBy}
              onChange={setGroupBy}
              data={[
                { value: "day", label: "День" },
                { value: "week", label: "Неделя" },
                { value: "month", label: "Месяц" },
              ]}
            />
          </Stack>
        </Group>
      </Paper>

      {/* Summary cards */}
      {summaryQuery.isLoading && (
        <SimpleGrid cols={{ base: 1, sm: 3 }}>
          <Skeleton h={100} />
          <Skeleton h={100} />
          <Skeleton h={100} />
        </SimpleGrid>
      )}

      {summary.length > 0 &&
        summary.map((row) => (
          <SimpleGrid key={row.currencyCode} cols={{ base: 1, sm: 3 }}>
            <Card withBorder shadow="sm" radius="md">
              <Text size="sm" c="dimmed">
                Доходы ({row.currencyCode})
              </Text>
              <Text size="xl" fw={700} c="teal">
                {formatAmount(row.totalIncome, row.currencySymbol, row.currencyCode)}
              </Text>
            </Card>
            <Card withBorder shadow="sm" radius="md">
              <Text size="sm" c="dimmed">
                Расходы ({row.currencyCode})
              </Text>
              <Text size="xl" fw={700} c="red">
                {formatAmount(row.totalExpenses, row.currencySymbol, row.currencyCode)}
              </Text>
            </Card>
            <Card withBorder shadow="sm" radius="md">
              <Text size="sm" c="dimmed">
                Баланс ({row.currencyCode})
              </Text>
              <Text
                size="xl"
                fw={700}
                c={parseFloat(row.net) >= 0 ? "teal" : "red"}
              >
                {formatAmount(row.net, row.currencySymbol, row.currencyCode)}
              </Text>
            </Card>
          </SimpleGrid>
        ))}

      {!summaryQuery.isLoading && summary.length === 0 && (
        <Text c="dimmed" ta="center">
          Нет данных за выбранный период
        </Text>
      )}

      {/* Charts */}
      <SimpleGrid cols={{ base: 1, md: 2 }}>
        {/* Spending by category */}
        <Card withBorder shadow="sm" radius="md">
          <Text fw={600} mb="md">
            Расходы по категориям
          </Text>
          {categoryQuery.isLoading && <Skeleton h={250} />}
          {!categoryQuery.isLoading && donutData.length === 0 && (
            <Text c="dimmed" ta="center" py="xl">
              Нет данных
            </Text>
          )}
          {donutData.length > 0 && (
            <DonutChart
              data={donutData}
              withLabelsLine
              labelsType="percent"
              h={250}
              tooltipDataSource="segment"
            />
          )}
        </Card>

        {/* Spending over time */}
        <Card withBorder shadow="sm" radius="md">
          <Text fw={600} mb="md">
            Расходы по периодам
          </Text>
          {spendingTimeQuery.isLoading && <Skeleton h={250} />}
          {!spendingTimeQuery.isLoading && spendingBarData.length === 0 && (
            <Text c="dimmed" ta="center" py="xl">
              Нет данных
            </Text>
          )}
          {spendingBarData.length > 0 && (
            <BarChart
              h={250}
              data={spendingBarData}
              dataKey="period"
              series={[{ name: "Расходы", color: "red.6" }]}
            />
          )}
        </Card>

        {/* Income vs Expenses */}
        <Card withBorder shadow="sm" radius="md">
          <Text fw={600} mb="md">
            Доходы vs Расходы
          </Text>
          {(spendingTimeQuery.isLoading || incomeTimeQuery.isLoading) && (
            <Skeleton h={250} />
          )}
          {!spendingTimeQuery.isLoading &&
            !incomeTimeQuery.isLoading &&
            mergedTimeData.length === 0 && (
              <Text c="dimmed" ta="center" py="xl">
                Нет данных
              </Text>
            )}
          {mergedTimeData.length > 0 && (
            <BarChart
              h={250}
              data={mergedTimeData}
              dataKey="period"
              series={[
                { name: "Доходы", color: "teal.6" },
                { name: "Расходы", color: "red.6" },
              ]}
            />
          )}
        </Card>

        {/* Wallet balances */}
        <Card withBorder shadow="sm" radius="md">
          <Text fw={600} mb="md">
            Баланс по кошелькам
          </Text>
          {walletsQuery.isLoading && <Skeleton h={250} />}
          {!walletsQuery.isLoading && wallets.length === 0 && (
            <Text c="dimmed" ta="center" py="xl">
              Нет кошельков
            </Text>
          )}
          {wallets.length > 0 && (
            <Stack gap="sm">
              {wallets.map((wallet) => (
                <Paper key={wallet.id} p="sm" withBorder>
                  <Text fw={500} size="sm" mb={4}>
                    {wallet.name}
                  </Text>
                  {wallet.balances.length === 0 ? (
                    <Text c="dimmed" size="xs">
                      Нет транзакций
                    </Text>
                  ) : (
                    <Group gap="md">
                      {wallet.balances.map((b) => (
                        <Group key={b.currencyCode} gap="xs">
                          <Badge variant="light" size="sm">
                            {b.currencyCode}
                          </Badge>
                          <Text
                            size="sm"
                            fw={500}
                            c={parseFloat(b.balance) >= 0 ? "teal" : "red"}
                          >
                            {formatAmount(
                              b.balance,
                              b.currencySymbol,
                              b.currencyCode,
                            )}
                          </Text>
                        </Group>
                      ))}
                    </Group>
                  )}
                </Paper>
              ))}
            </Stack>
          )}
        </Card>
      </SimpleGrid>
    </Stack>
  );
}
