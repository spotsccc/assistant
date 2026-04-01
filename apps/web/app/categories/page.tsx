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
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

interface Category {
  id: string;
  name: string;
  createdAt: string;
}

export default function CategoriesPage() {
  const queryClient = useQueryClient();
  const [opened, { open, close }] = useDisclosure(false);
  const [name, setName] = useState("");

  const categoriesQuery = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: () =>
      fetch("/api/categories").then((r) => r.json() as Promise<Category[]>),
  });

  const createMutation = useMutation({
    mutationFn: (categoryName: string) =>
      fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: categoryName }),
      }).then((r) => {
        if (!r.ok) throw new Error("Failed to create category");
        return r.json();
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      setName("");
      close();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/categories/${id}`, { method: "DELETE" }).then((r) => {
        if (!r.ok) throw new Error("Failed to delete category");
        return r.json();
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });

  const categories = categoriesQuery.data ?? [];

  return (
    <>
      <Group justify="space-between" mb="md">
        <Title order={2}>Категории</Title>
        <Button onClick={open}>Добавить категорию</Button>
      </Group>

      {categoriesQuery.isLoading && <Text c="dimmed">Загрузка...</Text>}

      {categoriesQuery.isError && (
        <Text c="red">Ошибка загрузки категорий</Text>
      )}

      <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }}>
        {categories.map((category) => (
          <Card key={category.id} withBorder shadow="sm" radius="md">
            <Group justify="space-between">
              <Text fw={600} size="lg">
                {category.name}
              </Text>
              <ActionIcon
                variant="subtle"
                color="red"
                size="sm"
                onClick={() => deleteMutation.mutate(category.id)}
                loading={deleteMutation.isPending}
                title="Удалить"
              >
                ✕
              </ActionIcon>
            </Group>
          </Card>
        ))}
      </SimpleGrid>

      {!categoriesQuery.isLoading && categories.length === 0 && (
        <Text c="dimmed" ta="center" mt="xl">
          Нет категорий. Создайте первую!
        </Text>
      )}

      <Modal opened={opened} onClose={close} title="Новая категория">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (name.trim()) createMutation.mutate(name.trim());
          }}
        >
          <TextInput
            label="Название"
            placeholder="Например: Продукты"
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
