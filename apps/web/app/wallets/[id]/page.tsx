"use client";

import {
  Title,
  Table,
  Text,
  Group,
  Stack,
  Badge,
  Card,
  Select,
  TextInput,
  Button,
  ActionIcon,
  Modal,
  SegmentedControl,
  Loader,
  Anchor,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import Link from "next/link";
import { use, useEffect, useRef, useState } from "react";

interface Currency {
  id: string;
  code: string;
  name: string;
  symbol: string | null;
}

interface Wallet {
  id: string;
  name: string;
}

interface Category {
  id: string;
  name: string;
}

interface WalletBalance {
  currencyCode: string;
  currencySymbol: string | null;
  balance: string;
}

interface WalletDetail {
  id: string;
  name: string;
  balances: WalletBalance[];
}

interface TransactionEntry {
  id: string;
  amount: string;
  wallet: Wallet;
  currency: Currency;
}

interface Transaction {
  id: string;
  description: string;
  type: "income" | "expense" | "transfer";
  category: Category | null;
  entries: TransactionEntry[];
  createdAt: string;
}

interface TransactionsResponse {
  items: Transaction[];
  total: number;
}

interface WalletWithBalances extends Wallet {
  balances: WalletBalance[];
}

const TYPE_LABELS: Record<string, string> = {
  income: "Доход",
  expense: "Расход",
  transfer: "Перевод",
};

const TYPE_COLORS: Record<string, string> = {
  income: "teal",
  expense: "red",
  transfer: "blue",
};

const PAGE_SIZE = 20;

function formatBalance(balance: string, symbol: string | null, code: string) {
  const num = parseFloat(balance);
  const formatted = num.toLocaleString("ru-RU", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return symbol ? `${formatted} ${symbol}` : `${formatted} ${code}`;
}

function formatAmount(amount: string, symbol: string | null, code: string) {
  const num = parseFloat(amount);
  const formatted = Math.abs(num).toLocaleString("ru-RU", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const prefix = num > 0 ? "+" : num < 0 ? "\u2212" : "";
  const suffix = symbol ?? code;
  return `${prefix}${formatted} ${suffix}`;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function WalletDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const queryClient = useQueryClient();
  const [opened, { open, close }] = useDisclosure(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Form state
  const [formType, setFormType] = useState<string>("expense");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [currencyCode, setCurrencyCode] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [toWalletId, setToWalletId] = useState<string | null>(null);
  const [toCurrencyCode, setToCurrencyCode] = useState("");
  const [toAmount, setToAmount] = useState("");

  const walletQuery = useQuery<WalletDetail>({
    queryKey: ["wallet", id],
    queryFn: () =>
      fetch(`/api/wallets/${id}/balance`).then(
        (r) => r.json() as Promise<WalletDetail>,
      ),
  });

  const transactionsQuery = useInfiniteQuery<TransactionsResponse>({
    queryKey: ["wallet-transactions", id],
    queryFn: ({ pageParam }) => {
      const params = new URLSearchParams();
      params.set("walletId", id);
      params.set("limit", String(PAGE_SIZE));
      params.set("offset", String(pageParam));
      return fetch(`/api/transactions?${params}`).then(
        (r) => r.json() as Promise<TransactionsResponse>,
      );
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.reduce((sum, p) => sum + p.items.length, 0);
      return loaded < lastPage.total ? loaded : undefined;
    },
  });

  const walletsQuery = useQuery<WalletWithBalances[]>({
    queryKey: ["wallets"],
    queryFn: () =>
      fetch("/api/wallets").then(
        (r) => r.json() as Promise<WalletWithBalances[]>,
      ),
  });

  const categoriesQuery = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: () =>
      fetch("/api/categories").then((r) => r.json() as Promise<Category[]>),
  });

  // Infinite scroll
  const { hasNextPage, isFetchingNextPage, fetchNextPage } = transactionsQuery;

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then(async (r) => {
        if (!r.ok) {
          const err = await r.json();
          throw new Error(err.error ?? "Ошибка создания транзакции");
        }
        return r.json();
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wallet-transactions", id] });
      queryClient.invalidateQueries({ queryKey: ["wallet", id] });
      queryClient.invalidateQueries({ queryKey: ["wallets"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      resetForm();
      close();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (txnId: string) =>
      fetch(`/api/transactions/${txnId}`, { method: "DELETE" }).then((r) => {
        if (!r.ok) throw new Error("Ошибка удаления");
        return r.json();
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wallet-transactions", id] });
      queryClient.invalidateQueries({ queryKey: ["wallet", id] });
      queryClient.invalidateQueries({ queryKey: ["wallets"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });

  function resetForm() {
    setFormType("expense");
    setDescription("");
    setAmount("");
    setCurrencyCode("");
    setCategoryId(null);
    setToWalletId(null);
    setToCurrencyCode("");
    setToAmount("");
  }

  function openWithType(type: string) {
    setFormType(type);
    open();
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!amount || !currencyCode) return;

    const base = {
      description,
      amount,
      walletId: id,
      currencyCode,
      type: formType,
    };

    if (formType === "expense") {
      if (!categoryId) return;
      createMutation.mutate({ ...base, categoryId });
    } else if (formType === "transfer") {
      if (!toWalletId || !toCurrencyCode || !toAmount) return;
      createMutation.mutate({ ...base, toWalletId, toCurrencyCode, toAmount });
    } else {
      createMutation.mutate(base);
    }
  }

  const wallet = walletQuery.data;
  const wallets = walletsQuery.data ?? [];
  const categories = categoriesQuery.data ?? [];
  const transactions =
    transactionsQuery.data?.pages.flatMap((p) => p.items) ?? [];

  const walletOptions = wallets
    .filter((w) => w.id !== id)
    .map((w) => ({ value: w.id, label: w.name }));
  const categoryOptions = categories.map((c) => ({
    value: c.id,
    label: c.name,
  }));

  const currencySet = new Map<string, string>();
  for (const w of wallets) {
    for (const b of w.balances) {
      currencySet.set(b.currencyCode, b.currencySymbol ?? b.currencyCode);
    }
  }
  const currencyOptions = Array.from(currencySet.entries()).map(([code]) => ({
    value: code,
    label: code,
  }));

  return (
    <>
      <Group mb="md" gap="xs">
        <Anchor component={Link} href="/wallets" size="sm">
          Кошельки
        </Anchor>
        <Text size="sm" c="dimmed">
          /
        </Text>
        <Title order={2}>{wallet?.name ?? "..."}</Title>
      </Group>

      {walletQuery.isLoading && <Text c="dimmed">Загрузка...</Text>}
      {walletQuery.isError && <Text c="red">Кошелёк не найден</Text>}

      {wallet && (
        <>
          {wallet.balances.length > 0 && (
            <Group mb="md" gap="md">
              {wallet.balances.map((b) => (
                <Card
                  key={b.currencyCode}
                  withBorder
                  shadow="sm"
                  radius="md"
                  p="sm"
                >
                  <Group gap="xs">
                    <Badge variant="light" size="sm">
                      {b.currencyCode}
                    </Badge>
                    <Text
                      fw={600}
                      size="lg"
                      c={parseFloat(b.balance) >= 0 ? "teal" : "red"}
                    >
                      {formatBalance(
                        b.balance,
                        b.currencySymbol,
                        b.currencyCode,
                      )}
                    </Text>
                  </Group>
                </Card>
              ))}
            </Group>
          )}

          <Group mb="lg">
            <Button color="teal" onClick={() => openWithType("income")}>
              Доход
            </Button>
            <Button color="red" onClick={() => openWithType("expense")}>
              Расход
            </Button>
            <Button
              color="blue"
              variant="light"
              onClick={() => openWithType("transfer")}
            >
              Перевод
            </Button>
          </Group>
        </>
      )}

      {transactionsQuery.isLoading && <Text c="dimmed">Загрузка...</Text>}
      {transactionsQuery.isError && (
        <Text c="red">Ошибка загрузки транзакций</Text>
      )}

      {!transactionsQuery.isLoading && transactions.length === 0 && wallet && (
        <Text c="dimmed" ta="center" mt="xl">
          Нет транзакций
        </Text>
      )}

      {transactions.length > 0 && (
        <Table.ScrollContainer minWidth={500}>
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Дата</Table.Th>
                <Table.Th>Тип</Table.Th>
                <Table.Th>Описание</Table.Th>
                <Table.Th>Категория</Table.Th>
                <Table.Th>Сумма</Table.Th>
                <Table.Th w={40} />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {transactions.map((txn) => (
                <Table.Tr key={txn.id}>
                  <Table.Td>
                    <Text size="sm">{formatDate(txn.createdAt)}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Badge
                      color={TYPE_COLORS[txn.type]}
                      variant="light"
                      size="sm"
                    >
                      {TYPE_LABELS[txn.type]}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" lineClamp={1}>
                      {txn.description || "\u2014"}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">{txn.category?.name ?? "\u2014"}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Stack gap={2}>
                      {txn.entries.map((entry) => (
                        <Text
                          key={entry.id}
                          size="sm"
                          fw={500}
                          c={
                            parseFloat(entry.amount) > 0
                              ? "teal"
                              : parseFloat(entry.amount) < 0
                                ? "red"
                                : undefined
                          }
                        >
                          {formatAmount(
                            entry.amount,
                            entry.currency.symbol,
                            entry.currency.code,
                          )}
                        </Text>
                      ))}
                    </Stack>
                  </Table.Td>
                  <Table.Td>
                    <ActionIcon
                      variant="subtle"
                      color="red"
                      size="sm"
                      onClick={() => deleteMutation.mutate(txn.id)}
                      loading={deleteMutation.isPending}
                      title="Удалить"
                    >
                      ✕
                    </ActionIcon>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      )}

      <div ref={sentinelRef} style={{ height: 1 }} />
      {isFetchingNextPage && (
        <Group justify="center" mt="md">
          <Loader size="sm" />
        </Group>
      )}

      <Modal
        opened={opened}
        onClose={() => {
          close();
          resetForm();
        }}
        title="Новая транзакция"
        size="md"
      >
        <form onSubmit={handleSubmit}>
          <Stack gap="sm">
            <SegmentedControl
              fullWidth
              value={formType}
              onChange={setFormType}
              data={[
                { value: "income", label: "Доход" },
                { value: "expense", label: "Расход" },
                { value: "transfer", label: "Перевод" },
              ]}
            />

            <TextInput
              label="Описание"
              placeholder="За что"
              value={description}
              onChange={(e) => setDescription(e.currentTarget.value)}
            />

            <Group grow>
              <TextInput
                label="Сумма"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.currentTarget.value)}
                required
              />
              <Select
                label="Валюта"
                placeholder="Код"
                data={currencyOptions}
                value={currencyCode}
                onChange={(v) => setCurrencyCode(v ?? "")}
                required
                searchable
                allowDeselect={false}
              />
            </Group>

            {formType === "expense" && (
              <Select
                label="Категория"
                placeholder="Выберите категорию"
                data={categoryOptions}
                value={categoryId}
                onChange={setCategoryId}
                required
                searchable
              />
            )}

            {formType === "transfer" && (
              <>
                <Select
                  label="Кошелёк получатель"
                  placeholder="Выберите кошелёк"
                  data={walletOptions}
                  value={toWalletId}
                  onChange={setToWalletId}
                  required
                />
                <Group grow>
                  <TextInput
                    label="Сумма получения"
                    placeholder="0.00"
                    value={toAmount}
                    onChange={(e) => setToAmount(e.currentTarget.value)}
                    required
                  />
                  <Select
                    label="Валюта получения"
                    placeholder="Код"
                    data={currencyOptions}
                    value={toCurrencyCode}
                    onChange={(v) => setToCurrencyCode(v ?? "")}
                    required
                    searchable
                    allowDeselect={false}
                  />
                </Group>
              </>
            )}

            {createMutation.isError && (
              <Text c="red" size="sm">
                {createMutation.error.message}
              </Text>
            )}

            <Group justify="flex-end" mt="xs">
              <Button
                variant="default"
                onClick={() => {
                  close();
                  resetForm();
                }}
              >
                Отмена
              </Button>
              <Button type="submit" loading={createMutation.isPending}>
                Создать
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </>
  );
}
