import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Expense, Occasion, UserProfile } from "../backend";
import { useActor } from "./useActor";

export function useUserProfile() {
  const { actor, isFetching } = useActor();
  return useQuery<UserProfile | null>({
    queryKey: ["userProfile"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSetDisplayName() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (displayName: string) => {
      if (!actor) throw new Error("Not connected");
      await actor.setDisplayName(displayName);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
    },
  });
}

export function useAllExpenses() {
  const { actor, isFetching } = useActor();
  return useQuery<Expense[]>({
    queryKey: ["expenses"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllExpenses();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAggregateTotals() {
  const { actor, isFetching } = useActor();
  return useQuery<Array<[string, number]>>({
    queryKey: ["aggregateTotals"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAggregateTotals();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAllOccasions() {
  const { actor, isFetching } = useActor();
  return useQuery<Occasion[]>({
    queryKey: ["occasions"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllOccasions();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useExpensesByOccasion(occasionId: string) {
  const { actor, isFetching } = useActor();
  return useQuery<Expense[]>({
    queryKey: ["expenses", "occasion", occasionId],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getExpensesByOccasion(occasionId);
    },
    enabled: !!actor && !isFetching && !!occasionId,
  });
}

export function useCreateExpense() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (expense: Expense) => {
      if (!actor) throw new Error("Not connected");
      return actor.createExpense(expense);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["aggregateTotals"] });
    },
  });
}

export function useCreateOccasion() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      name,
      description,
    }: { name: string; description: string }) => {
      if (!actor) throw new Error("Not connected");
      return actor.createOccasion(name, description);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["occasions"] });
    },
  });
}

export function useAddParticipant() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      occasionId,
      participantName,
    }: { occasionId: string; participantName: string }) => {
      if (!actor) throw new Error("Not connected");
      return actor.addParticipantToOccasion(occasionId, participantName);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["occasions"] });
    },
  });
}

export function useExtractAmount() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async (base64Image: string) => {
      if (!actor) throw new Error("Not connected");
      return actor.extractAmountFromImage({ base64Image });
    },
  });
}
