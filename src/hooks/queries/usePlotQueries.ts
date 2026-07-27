import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "./queryKeys";
import { plotService } from "@/services/PlotService";
import { PlotEvent, PlotLine } from "@/types/IPlot";

/**
 * Plot lines follow the same optimistic-update pattern as characters and places:
 * snapshot the cache in `onMutate`, apply the change immediately, roll back in
 * `onError`, invalidate in `onSettled`.
 *
 * The one difference is granularity — a plot line owns its events as a nested
 * array, so the event mutations patch a single line inside the cached list rather
 * than a whole document.
 */

/** Replace one plot line inside the cached list, leaving the others untouched. */
function patchLine(
  lines: PlotLine[] | undefined,
  plotLineId: string,
  update: (line: PlotLine) => PlotLine,
): PlotLine[] {
  return (lines ?? []).map((line) =>
    line.id === plotLineId ? update(line) : line,
  );
}

export function usePlots(storyId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.plots.byStory(storyId!),
    queryFn: () => plotService.getPlots(storyId!),
    enabled: !!storyId,
  });
}

export function useAddPlotLine(storyId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => plotService.addPlot(storyId!, name),
    onSuccess: (plotId, name) => {
      queryClient.setQueryData<PlotLine[]>(
        queryKeys.plots.byStory(storyId!),
        (old) => [
          ...(old ?? []),
          { id: plotId, name, description: "", events: [] },
        ],
      );
    },
  });
}

export function useUpdatePlotLineMeta(storyId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (line: PlotLine) =>
      plotService.updatePlotMeta(storyId!, line.id, {
        name: line.name,
        description: line.description,
      }),
    onMutate: async (line) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.plots.byStory(storyId!),
      });
      const prev = queryClient.getQueryData<PlotLine[]>(
        queryKeys.plots.byStory(storyId!),
      );
      queryClient.setQueryData<PlotLine[]>(
        queryKeys.plots.byStory(storyId!),
        (old) =>
          patchLine(old, line.id, (existing) => ({
            ...existing,
            name: line.name,
            description: line.description,
          })),
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) {
        queryClient.setQueryData(queryKeys.plots.byStory(storyId!), ctx.prev);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.plots.byStory(storyId!),
      });
    },
  });
}

export function useDeletePlotLine(storyId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (plotLineId: string) =>
      plotService.deletePlot(storyId!, plotLineId),
    onMutate: async (plotLineId) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.plots.byStory(storyId!),
      });
      const prev = queryClient.getQueryData<PlotLine[]>(
        queryKeys.plots.byStory(storyId!),
      );
      queryClient.setQueryData<PlotLine[]>(
        queryKeys.plots.byStory(storyId!),
        (old) => old?.filter((line) => line.id !== plotLineId) ?? [],
      );
      return { prev };
    },
    onError: (_err, _plotLineId, ctx) => {
      if (ctx?.prev) {
        queryClient.setQueryData(queryKeys.plots.byStory(storyId!), ctx.prev);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.plots.byStory(storyId!),
      });
    },
  });
}

/** The service mints the event id, so the cache is written from its return value. */
export function useAddEvent(storyId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      plotLineId,
      event,
    }: {
      plotLineId: string;
      event: Omit<PlotEvent, "id">;
    }) => plotService.addEvent(storyId!, plotLineId, event),
    onSuccess: (created, { plotLineId }) => {
      queryClient.setQueryData<PlotLine[]>(
        queryKeys.plots.byStory(storyId!),
        (old) =>
          patchLine(old, plotLineId, (line) => ({
            ...line,
            events: [...line.events, created],
          })),
      );
    },
  });
}

/**
 * `revalidate: false` suppresses the settle-time refetch. The inline grid path uses
 * it: edits to other cells may still be sitting in their debounce, and a refetch
 * would momentarily revert them to server state under the user's cursor.
 */
export function useUpdateEvent(storyId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      plotLineId,
      event,
    }: {
      plotLineId: string;
      event: PlotEvent;
      revalidate?: boolean;
    }) => plotService.updateEvent(storyId!, plotLineId, event),
    onMutate: async ({ plotLineId, event }) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.plots.byStory(storyId!),
      });
      const prev = queryClient.getQueryData<PlotLine[]>(
        queryKeys.plots.byStory(storyId!),
      );
      queryClient.setQueryData<PlotLine[]>(
        queryKeys.plots.byStory(storyId!),
        (old) =>
          patchLine(old, plotLineId, (line) => ({
            ...line,
            events: line.events.map((e) => (e.id === event.id ? event : e)),
          })),
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) {
        queryClient.setQueryData(queryKeys.plots.byStory(storyId!), ctx.prev);
      }
    },
    onSettled: (_data, _err, { revalidate }) => {
      if (revalidate === false) return;
      queryClient.invalidateQueries({
        queryKey: queryKeys.plots.byStory(storyId!),
      });
    },
  });
}

export function useDeleteEvent(storyId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      plotLineId,
      eventId,
    }: {
      plotLineId: string;
      eventId: string;
    }) => plotService.deleteEvent(storyId!, plotLineId, eventId),
    onMutate: async ({ plotLineId, eventId }) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.plots.byStory(storyId!),
      });
      const prev = queryClient.getQueryData<PlotLine[]>(
        queryKeys.plots.byStory(storyId!),
      );
      queryClient.setQueryData<PlotLine[]>(
        queryKeys.plots.byStory(storyId!),
        (old) =>
          patchLine(old, plotLineId, (line) => ({
            ...line,
            events: line.events
              .filter((e) => e.id !== eventId)
              .map((e, index) => ({ ...e, orderIndex: index })),
          })),
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) {
        queryClient.setQueryData(queryKeys.plots.byStory(storyId!), ctx.prev);
      }
    },
    // The server reconciles by id and returns the authoritative array.
    onSuccess: (events, { plotLineId }) => {
      queryClient.setQueryData<PlotLine[]>(
        queryKeys.plots.byStory(storyId!),
        (old) => patchLine(old, plotLineId, (line) => ({ ...line, events })),
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.plots.byStory(storyId!),
      });
    },
  });
}

export function useReorderEvents(storyId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      plotLineId,
      orderedIds,
    }: {
      plotLineId: string;
      orderedIds: string[];
    }) => plotService.reorderEvents(storyId!, plotLineId, orderedIds),
    onMutate: async ({ plotLineId, orderedIds }) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.plots.byStory(storyId!),
      });
      const prev = queryClient.getQueryData<PlotLine[]>(
        queryKeys.plots.byStory(storyId!),
      );
      queryClient.setQueryData<PlotLine[]>(
        queryKeys.plots.byStory(storyId!),
        (old) =>
          patchLine(old, plotLineId, (line) => {
            const byId = new Map(line.events.map((e) => [e.id, e]));
            const events = orderedIds
              .map((id) => byId.get(id))
              .filter((e): e is PlotEvent => e !== undefined)
              .map((event, index) => ({ ...event, orderIndex: index }));
            return { ...line, events };
          }),
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) {
        queryClient.setQueryData(queryKeys.plots.byStory(storyId!), ctx.prev);
      }
    },
    onSuccess: (events, { plotLineId }) => {
      queryClient.setQueryData<PlotLine[]>(
        queryKeys.plots.byStory(storyId!),
        (old) => patchLine(old, plotLineId, (line) => ({ ...line, events })),
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.plots.byStory(storyId!),
      });
    },
  });
}
