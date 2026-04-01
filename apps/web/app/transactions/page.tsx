"use client";

import {
  Title,
  Table,
  Text,
  Group,
  Stack,
  Badge,
  Select,
  TextInput,
  Button,
  ActionIcon,
  Modal,
  Pagination,
  SegmentedControl,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

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
  balances: Array<{
    currencyCode: string;
    currencySymbol: string | null;
    balance: string;
  }>;
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

function formatAmount(amount: string, symbol: string | null, code: string) {
  const num = parseFloat(amount);
  const formatted = Math.abs(num).toLocaleString("ru-RU", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const prefix = num > 0 ? "+" : num < 0 ? "−" : "";
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

export default function TransactionsPage() {
  const queryClient = useQueryClient();
  const [opened, { open, close }] = useDisclosure(false);
  const [page, setPage] = useState(1);
  const [filterType, setFilterType] = useState<string>("all");
  const [filterWalletId, setFilterWalletId] = useState<string | null>(null);

  // Form state
  const [formType, setFormType] = useState<string>("expense");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [walletId, setWalletId] = useState<string | null>(null);
  const [currencyCode, setCurrencyCode] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [toWalletId, setToWalletId] = useState<string | null>(null);
  const [toCurrencyCode, setToCurrencyCode] = useState("");
  const [toAmount, setToAmount] = useState("");

  const walletsQuery = useQuery<WalletWithBalances[]>({
    queryKey: ["wallets"],
    queryFn: () => fetch("/api/wallets").then((r) => r.json() as Promise<WalletWithBalances[]>),
  });

  const categoriesQuery = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: () => fetch("/api/categories").then((r) => r.json() as Promise<Category[]>),
  });

  const searchParams = new URLSearchParams();
  searchParams.set("limit", String(PAGE_SIZE));
  searchParams.set("offset", String((page - 1) * PAGE_SIZE));
  if (filterType !== "all") searchParams.set("type", filterType);
  if (filterWalletId) searchParams.set("walletId", filterWalletId);

  const transactionsQuery = useQuery<TransactionsResponse>({
    queryKey: ["transactions", page, filterType, filterWalletId],
    queryFn: () =>
      fetch(`/api/transactions?${searchParams.toString()}`).then(
        (r) => r.json() as Promise<TransactionsResponse>,
      ),
  });

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
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["wallets"] });
      resetForm();
      close();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/transactions/${id}`, { method: "DELETE" }).then((r) => {
        if (!r.ok) throw new Error("Ошибка удаления");
        return r.json();
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["wallets"] });
    },
  });

  function resetForm() {
    setFormType("expense");
    setDescription("");
    setAmount("");
    setWalletId(null);
    setCurrencyCode("");
    setCategoryId(null);
    setToWalletId(null);
    setToCurrencyCode("");
    setToAmount("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!walletId || !amount || !currencyCode) return;

    const base = {
      description,
      amount,
      walletId,
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

  const wallets = walletsQuery.data ?? [];
  const categories = categoriesQuery.data ?? [];
  const transactions = transactionsQuery.data?.items ?? [];
  const total = transactionsQuery.data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  const walletOptions = wallets.map((w) => ({ value: w.id, label: w.name }));
  const categoryOptions = categories.map((c) => ({ value: c.id, label: c.name }));

  // Build currency options from wallet balances
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
      <Group justify="space-between" mb="md">
        <Title order={2}>Транзакции</Title>
        <Button onClick={open}>Добавить транзакцию</Button>
      </Group>

      <Group mb="md">
        <SegmentedControl
          value={filterType}
          onChange={(v) => {
            setFilterType(v);
            setPage(1);
          }}
          data={[
            { value: "all", label: "Все" },
            { value: "income", label: "Доходы" },
            { value: "expense", label: "Расходы" },
            { value: "transfer", label: "Переводы" },
          ]}
        />
        <Select
          placeholder="Все кошельки"
          clearable
          data={walletOptions}
          value={filterWalletId}
          onChange={(v) => {
            setFilterWalletId(v);
            setPage(1);
          }}
          w={200}
        />
      </Group>

      {transactionsQuery.isLoading && <Text c="dimmed">Загрузка...</Text>}

      {transactionsQuery.isError && (
        <Text c="red">Ошибка загрузки транзакций</Text>
      )}

      {!transactionsQuery.isLoading && transactions.length === 0 && (
        <Text c="dimmed" ta="center" mt="xl">
          Нет транзакций
        </Text>
      )}

      {transactions.length > 0 && (
        <Table.ScrollContainer minWidth={600}>
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Дата</Table.Th>
                <Table.Th>Тип</Table.Th>
                <Table.Th>Описание</Table.Th>
                <Table.Th>Категория</Table.Th>
                <Table.Th>Сумма</Table.Th>
                <Table.Th>Кошелёк</Table.Th>
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
                    <Badge color={TYPE_COLORS[txn.type]} variant="light" size="sm">
                      {TYPE_LABELS[txn.type]}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" lineClamp={1}>
                      {txn.description || "—"}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">{txn.category?.name ?? "—"}</Text>
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
                    <Stack gap={2}>
                      {txn.entries.map((entry) => (
                        <Text key={entry.id} size="sm">
                          {entry.wallet.name}
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

      {totalPages > 1 && (
        <Group justify="center" mt="md">
          <Pagination
            value={page}
            onChange={setPage}
            total={totalPages}
          />
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

            <Select
              label="Кошелёк"
              placeholder="Выберите кошелёк"
              data={walletOptions}
              value={walletId}
              onChange={setWalletId}
              required
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
