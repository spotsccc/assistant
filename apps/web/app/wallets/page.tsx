"use client";

import {
  Title,
  Card,
  Text,
  Group,
  Stack,
  Badge,
  TextInput,
  Button,
  ActionIcon,
  SimpleGrid,
  Modal,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";

interface WalletBalance {
  currencyCode: string;
  currencySymbol: string | null;
  balance: string;
}

interface Wallet {
  id: string;
  name: string;
  createdAt: string;
  balances: WalletBalance[];
}

function formatBalance(balance: string, symbol: string | null, code: string) {
  const num = parseFloat(balance);
  const formatted = num.toLocaleString("ru-RU", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return symbol ? `${formatted} ${symbol}` : `${formatted} ${code}`;
}

export default function WalletsPage() {
  const queryClient = useQueryClient();
  const [opened, { open, close }] = useDisclosure(false);
  const [name, setName] = useState("");

  const walletsQuery = useQuery<Wallet[]>({
    queryKey: ["wallets"],
    queryFn: () => fetch("/api/wallets").then((r) => r.json() as Promise<Wallet[]>),
  });

  const createMutation = useMutation({
    mutationFn: (walletName: string) =>
      fetch("/api/wallets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: walletName }),
      }).then((r) => {
        if (!r.ok) throw new Error("Failed to create wallet");
        return r.json();
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wallets"] });
      setName("");
      close();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/wallets/${id}`, { method: "DELETE" }).then((r) => {
        if (!r.ok) throw new Error("Failed to delete wallet");
        return r.json();
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wallets"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });

  const wallets = walletsQuery.data ?? [];

  return (
    <>
      <Group justify="space-between" mb="md">
        <Title order={2}>Кошельки</Title>
        <Button onClick={open}>Добавить кошелёк</Button>
      </Group>

      {walletsQuery.isLoading && <Text c="dimmed">Загрузка...</Text>}

      {walletsQuery.isError && (
        <Text c="red">Ошибка загрузки кошельков</Text>
      )}

      <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }}>
        {wallets.map((wallet) => (
          <Card key={wallet.id} withBorder shadow="sm" radius="md">
            <Group justify="space-between" mb="xs">
              <Text
                fw={600}
                size="lg"
                component={Link}
                href={`/wallets/${wallet.id}`}
                style={{ textDecoration: "none", color: "inherit" }}
              >
                {wallet.name}
              </Text>
              <ActionIcon
                variant="subtle"
                color="red"
                size="sm"
                onClick={() => deleteMutation.mutate(wallet.id)}
                loading={deleteMutation.isPending}
                title="Удалить"
              >
                ✕
              </ActionIcon>
            </Group>

            {wallet.balances.length === 0 ? (
              <Text c="dimmed" size="sm">
                Нет транзакций
              </Text>
            ) : (
              <Stack gap="xs">
                {wallet.balances.map((b) => (
                  <Group key={b.currencyCode} justify="space-between">
                    <Badge variant="light" size="sm">
                      {b.currencyCode}
                    </Badge>
                    <Text
                      fw={500}
                      c={parseFloat(b.balance) >= 0 ? "teal" : "red"}
                    >
                      {formatBalance(b.balance, b.currencySymbol, b.currencyCode)}
                    </Text>
                  </Group>
                ))}
              </Stack>
            )}
          </Card>
        ))}
      </SimpleGrid>

      {!walletsQuery.isLoading && wallets.length === 0 && (
        <Text c="dimmed" ta="center" mt="xl">
          Нет кошельков. Создайте первый!
        </Text>
      )}

      <Modal opened={opened} onClose={close} title="Новый кошелёк">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (name.trim()) createMutation.mutate(name.trim());
          }}
        >
          <TextInput
            label="Название"
            placeholder="Например: Наличные"
            value={name}
            onChange={(e) => setName(e.currentTarget.value)}
            mb="md"
            data-autofocus
          />
          <Group justify="flex-end">
            <Button variant="default" onClick={close}>
              Отмена
            </Button>
            <Button
              type="submit"
              loading={createMutation.isPending}
              disabled={!name.trim()}
            >
              Создать
            </Button>
          </Group>
        </form>
      </Modal>
    </>
  );
}
