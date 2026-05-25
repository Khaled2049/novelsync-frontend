import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "./queryKeys";
import { placeService } from "@/services/PlaceService";
import { Place } from "@/types/IPlace";

export function usePlaces(storyId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.places.byStory(storyId!),
    queryFn: () => placeService.getPlaces(storyId!),
    enabled: !!storyId,
  });
}

export function useDeletePlace(storyId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (placeId: string) =>
      placeService.deletePlace(storyId!, placeId),
    onMutate: async (placeId) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.places.byStory(storyId!),
      });
      const prev = queryClient.getQueryData<Place[]>(
        queryKeys.places.byStory(storyId!),
      );
      queryClient.setQueryData<Place[]>(
        queryKeys.places.byStory(storyId!),
        (old) => old?.filter((place) => place.id !== placeId) ?? [],
      );
      return { prev };
    },
    onError: (_err, _placeId, ctx) => {
      if (ctx?.prev) {
        queryClient.setQueryData(queryKeys.places.byStory(storyId!), ctx.prev);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.places.byStory(storyId!),
      });
    },
  });
}

export function useAddPlace(storyId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (place: Omit<Place, "id">) =>
      placeService.addPlace(storyId!, place),
    onSuccess: (newPlace) => {
      queryClient.setQueryData<Place[]>(
        queryKeys.places.byStory(storyId!),
        (old) => {
          if (!old) return [newPlace];
          const withoutExisting = old.filter((p) => p.id !== newPlace.id);
          return [newPlace, ...withoutExisting];
        },
      );
    },
  });
}

export function useUpdatePlace(storyId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (place: Place) => placeService.updatePlace(storyId!, place),
    onMutate: async (updated) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.places.byStory(storyId!),
      });
      const prev = queryClient.getQueryData<Place[]>(
        queryKeys.places.byStory(storyId!),
      );
      queryClient.setQueryData<Place[]>(
        queryKeys.places.byStory(storyId!),
        (old) => old?.map((p) => (p.id === updated.id ? updated : p)) ?? [],
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) {
        queryClient.setQueryData(queryKeys.places.byStory(storyId!), ctx.prev);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.places.byStory(storyId!),
      });
    },
  });
}
