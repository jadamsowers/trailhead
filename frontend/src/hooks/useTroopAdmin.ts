import useSWR, { mutate } from "swr";
import {
  troopAPI,
  patrolAPI,
  TroopCreate,
  TroopUpdate,
  PatrolCreate,
  PatrolUpdate,
} from "../services/api";

const TROOPS_KEY = "/api/troops";

export function useTroops() {
  return useSWR(TROOPS_KEY, () => troopAPI.getAll());
}

export function useCreateTroop() {
  return {
    trigger: async (data: TroopCreate) => {
      const result = await troopAPI.create(data);
      mutate(TROOPS_KEY);
      return result;
    },
  };
}

export function useUpdateTroop() {
  return {
    trigger: async ({ id, data }: { id: string; data: TroopUpdate }) => {
      const result = await troopAPI.update(id, data);
      mutate(TROOPS_KEY);
      return result;
    },
  };
}

export function useDeleteTroop() {
  return {
    trigger: async (id: string) => {
      const result = await troopAPI.delete(id);
      mutate(TROOPS_KEY);
      return result;
    },
  };
}

export function useCreatePatrol() {
  return {
    trigger: async (data: PatrolCreate) => {
      const result = await patrolAPI.create(data);
      mutate(TROOPS_KEY);
      return result;
    },
  };
}

export function useUpdatePatrol() {
  return {
    trigger: async ({ id, data }: { id: string; data: PatrolUpdate }) => {
      const result = await patrolAPI.update(id, data);
      mutate(TROOPS_KEY);
      return result;
    },
  };
}

export function useDeletePatrol() {
  return {
    trigger: async (id: string) => {
      const result = await patrolAPI.delete(id);
      mutate(TROOPS_KEY);
      return result;
    },
  };
}
