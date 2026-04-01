"use client";

import {
  Title,
  Card,
  Text,
  Group,
  TextInput,
  Button,
  ActionIcon,
  SimpleGrid,
  Modal,
  Badge,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

interface Currency {
  id: string;
  code: string;
  name: string;
  symbol: string | null;
  createdAt: string;
}

export default function CurrenciesPage() {
  const queryClient = useQueryClient();
  const [opened, { open, close }] = useDisclosure(false);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");

  const currenciesQuery = useQuery<Currency[]>({
    queryKey: ["currencies"],
    queryFn: () =>
      fetch("/api/currencies").then((r) => r.json() as Promise<Currency[]>),
  });

  const createMutation = useMutation({
    mutationFn: (input: { code: string; name: string; symbol?: string }) =>
      fetch("/api/currencies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      }).then((r) => {
        if (!r.ok) throw new Error("Failed to create currency");
        return r.json();
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currencies"] });
      setCode("");
      setName("");
      setSymbol("");
      close();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/currencies/${id}`, { method: "DELETE" }).then((r) => {
        if (!r.ok) throw new Error("Failed to delete currency");
        return r.json();
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currencies"] });
    },
  });

  const currencies = currenciesQuery.data ?? [];

  return (
    <>
      <Group justify="space-between" mb="md">
        <Title order={2}>Валюты</Title>
        <Button onClick={open}>Добавить валюту</Button>
      </Group>

      {currenciesQuery.isLoading && <Text c="dimmed">Загрузка...</Text>}

      {currenciesQuery.isError && (
        <Text c="red">Ошибка загрузки валют</Text>
      )}

      <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }}>
        {currencies.map((currency) => (
          <Card key={currency.id} withBorder shadow="sm" radius="md">
            <Group justify="space-between" mb="xs">
              <Group gap="sm">
                <Badge variant="light" size="lg">
                  {currency.code}
                </Badge>
                {currency.symbol && (
                  <Text fw={600} size="lg">
                    {currency.symbol}
                  </Text>
                )}
              </Group>
              <ActionIcon
                variant="subtle"
                color="red"
                size="sm"
                onClick={() => deleteMutation.mutate(currency.id)}
                loading={deleteMutation.isPending}
                title="Удалить"
              >
                ✕
              </ActionIcon>
            </Group>
            <Text c="dimmed" size="sm">
              {currency.name}
            </Text>
          </Card>
        ))}
      </SimpleGrid>

      {!currenciesQuery.isLoading && currencies.length === 0 && (
        <Text c="dimmed" ta="center" mt="xl">
          Нет валют. Создайте первую!
        </Text>
      )}

      <Modal opened={opened} onClose={close} title="Новая валюта">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (code.trim() && name.trim()) {
              createMutation.mutate({
                code: code.trim().toUpperCase(),
                name: name.trim(),
                symbol: symbol.trim() || undefined,
              });
            }
          }}
        >
          <TextInput
            label="Код"
            placeholder="Например: USD"
            value={code}
            onChange={(e) => setCode(e.currentTarget.value)}
            mb="sm"
            data-autofocus
          />
          <TextInput
            label="Название"
            placeholder="Например: Доллар США"
            value={name}
            onChange={(e) => setName(e.currentTarget.value)}
            mb="sm"
          />
          <TextInput
            label="Символ"
            placeholder="Например: $"
            value={symbol}
            onChange={(e) => setSymbol(e.currentTarget.value)}
            mb="md"
          />
          <Group justify="flex-end">
            <Button variant="default" onClick={close}>
              Отмена
            </Button>
            <Button
              type="submit"
              loading={createMutation.isPending}
              disabled={!code.trim() || !name.trim()}
            >
              Создать
            </Button>
          </Group>
        </form>
      </Modal>
    </>
  );
}
