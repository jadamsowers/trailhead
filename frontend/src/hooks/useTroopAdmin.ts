import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  troopAPI,
  patrolAPI,
  TroopCreate,
  TroopUpdate,
  PatrolCreate,
  PatrolUpdate,
} from "../services/api";

export function useTroops() {
  return useQuery({
    queryKey: ["troops"],
    queryFn: () => troopAPI.getAll(),
  });
}

export function useCreateTroop() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: TroopCreate) => troopAPI.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["troops"] }),
  });
}

export function useUpdateTroop() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: TroopUpdate }) =>
      troopAPI.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["troops"] }),
  });
}

export function useDeleteTroop() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => troopAPI.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["troops"] }),
  });
}

export function useCreatePatrol() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: PatrolCreate) => patrolAPI.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["troops"] }),
  });
}

export function useUpdatePatrol() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: PatrolUpdate }) =>
      patrolAPI.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["troops"] }),
  });
}

export function useDeletePatrol() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => patrolAPI.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["troops"] }),
  });
}
