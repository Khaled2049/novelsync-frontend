import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Book, ChevronDown, PlusCircle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { PlotLineEditModal } from "./PlotlineEditModal";
import { EventEditModal } from "./EventEditModal";
import { PlotEvent, PlotLine, TemplateData } from "@/types/IPlot";
import { plotService } from "@/services/PlotService";
import { useParams } from "react-router-dom";
import axios from "axios";

const PlotTimeline: React.FC = () => {
  const [plotLines, setPlotLines] = useState<PlotLine[]>([]);
  const { storyId } = useParams<{ storyId: string }>();

  const [templates, setTemplates] = useState<TemplateData[]>([]);
  const [isPlotLineModalOpen, setisPlotLineModalOpen] = useState(false);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [editingPlotLine, setEditingPlotLine] = useState<PlotLine | null>(null);
  const [editingEvent, setEditingEvent] = useState<{
    plotLineId: string;
    event: PlotEvent;
  } | null>(null);

  useEffect(() => {
    loadPlots();
  }, [storyId]);

  const loadPlots = async () => {
    if (!storyId) return;

    const plots = await plotService.getPlots(storyId);
    setPlotLines(plots);

    const data = await plotService.loadTemplateData();
    setTemplates(data);
  };

  const addPlotLine = async () => {
    if (!storyId) return;

    const plotId = await plotService.addPlot(storyId, "New PlotLine");
    setPlotLines([
      ...plotLines,
      {
        id: plotId,
        name: "New PlotLine",
        description: "",
        events: [],
      },
    ]);
  };

  const addEvent = async (plotLineId: string) => {
    const newEvent: PlotEvent = {
      id: new Date().getTime().toString(),
      name: "New Event",
      content: "",
    };
    if (!storyId) return;

    const eventId = await plotService.addEvent(storyId, plotLineId, newEvent);
    setPlotLines(
      plotLines.map((plotLine) =>
        plotLine.id === plotLineId
          ? {
              ...plotLine,
              events: [
                ...plotLine.events,
                { ...newEvent, id: eventId } as PlotEvent,
              ],
            }
          : plotLine
      )
    );
  };

  const removePlotline = async (plotLineId: string) => {
    if (!storyId) return;
    await plotService.deletePlot(storyId, plotLineId);
    setPlotLines(plotLines.filter((plotLine) => plotLine.id !== plotLineId));
  };

  const handleSavePlotLineModal = async () => {
    if (!storyId || !editingPlotLine) return;
    await plotService.updatePlot(storyId, editingPlotLine);
    if (editingPlotLine) {
      setPlotLines(
        plotLines.map((plotLine) =>
          plotLine.id === editingPlotLine.id ? editingPlotLine : plotLine
        )
      );
      closeEditPlotLineModal();
    }
  };

  const handleSaveEvent = async () => {
    if (!storyId || !editingEvent) return;

    if (editingEvent) {
      await plotService.updateEvent(
        storyId,
        editingEvent.plotLineId,
        editingEvent.event
      );
      setPlotLines(
        plotLines.map((plotLine) =>
          plotLine.id === editingEvent.plotLineId
            ? {
                ...plotLine,
                events: plotLine.events.map((event) =>
                  event.id === editingEvent.event.id
                    ? editingEvent.event
                    : event
                ),
              }
            : plotLine
        )
      );
      closeEditEventModal();
    }
  };

  // const addPlotLineFromTemplate = (template: TemplateData) => {
  //   const newPlotLine: PlotLine = {
  //     id: nextplotLineId,
  //     name: template.name,
  //     description: `Timeline based on the ${template.name} template`,
  //     events: template.items.map((item) => ({
  //       id: nextEventId + item.id - 1,
  //       name: item.name,
  //       content: item.content,
  //     })),
  //   };
  //   setPlotLines([...plotLines, newPlotLine]);
  //   setNextplotLineId(nextplotLineId + 1);
  //   setNextEventId(nextEventId + template.items.length);
  // };

  const openEditPlotlineModal = (plotLine: PlotLine) => {
    setEditingPlotLine(plotLine);
    setisPlotLineModalOpen(true);
  };

  const closeEditPlotLineModal = () => {
    setisPlotLineModalOpen(false);
    setEditingPlotLine(null);
  };

  const openEditEventModal = (plotLineId: string, event: PlotEvent) => {
    setEditingEvent({ plotLineId, event: { ...event } });
    setIsEventModalOpen(true);
  };

  const closeEditEventModal = () => {
    setIsEventModalOpen(false);
    setEditingEvent(null);
  };

  const addPlotLineFromTemplate = async (template: TemplateData) => {
    if (!storyId) {
      console.error("No storyId provided");
      return;
    }

    try {
      // Add the plot first
      const plotId = await plotService.addPlot(storyId, template.name);

      // Prepare all events to be added
      const eventPromises = template.events.map((e, idx) => {
        const plotEvent = {
          content: e.content,
          name: e.name,
          id: idx.toString(),
        };
        return plotService.addEvent(storyId, plotId, plotEvent);
      });

      // Add all events concurrently
      await Promise.all(eventPromises);

      // Reload the plots
      loadPlots();
    } catch (error) {
      console.error("Error adding plot line from template:", error);
      throw error;
    }
  };

  const generateText = async () => {
    if (!storyId) {
      console.error("No storyId provided");
      return;
    }

    try {
      // Make the GET request to the specified endpoint
      const response = await axios.get(
        `http://127.0.0.1:5001/novelsync-f82ec/us-central1/createContext`,
        {
          params: {
            storyId: storyId,
          },
        }
      );

      // Extract the generated text from the response
      const generatedText = response.data.generatedText;
      console.log("Generated text:", generatedText);
    } catch (error) {
      console.error("Error generating plot text:", error);
    }
  };

  return (
    <div className="container mx-auto p-4 bg-neutral-50 dark:bg-black transition-colors duration-200">
      <div className="flex space-x-4 mb-4">
        <button
          onClick={addPlotLine}
          className="mb-4 py-2 px-4 rounded-sm bg-dark-green dark:bg-light-green text-white flex items-center justify-center hover:bg-light-green dark:hover:bg-dark-green transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-dark-green dark:focus:ring-light-green focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-black"
        >
          Add Plot
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="flex items-center text-black dark:text-white border-black/20 dark:border-white/20 hover:bg-black/10 dark:hover:bg-neutral-50/10 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-dark-green dark:focus:ring-light-green focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-black"
            >
              <Book className="mr-2 h-4 w-4 text-dark-green dark:text-light-green" />
              Plot Templates
              <ChevronDown className="ml-2 h-4 w-4 text-black dark:text-white" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="border border-black/20 dark:border-white/20 bg-neutral-50 dark:bg-black shadow-lg rounded-md p-1 min-w-[200px]">
            {templates.map((template, idx) => (
              <DropdownMenuItem
                key={idx}
                onSelect={() => addPlotLineFromTemplate(template)}
                className="px-4 py-2 hover:bg-black/10 dark:hover:bg-neutral-50/10 rounded-sm cursor-pointer transition-colors duration-150 ease-in-out text-black dark:text-white"
              >
                <span className="font-serif">{template.name}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex">
        {/* PlotLine management column */}
        <div className="space-y-16 w-64 pr-4 border-r border-black/20 dark:border-white/20">
          {plotLines.map((plotLine) => (
            <div
              key={plotLine.id}
              className="rounded-lg shadow-lg p-4 bg-light-green dark:bg-dark-green text-white"
            >
              <div
                className="flex items-center justify-between p-2 rounded cursor-pointer"
                onClick={() => openEditPlotlineModal(plotLine)}
              >
                <span>{plotLine.name}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removePlotline(plotLine.id);
                  }}
                  className="text-white/70 hover:text-white transition-colors duration-200"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* plotLines display area */}
        <div className="flex-1 pl-4">
          {plotLines.map((plotLine) => (
            <div key={plotLine.id} className="">
              <div className="relative h-32 overflow-x-auto">
                <div className="absolute top-[2.5rem] left-0 right-0 h-1 bg-black/20 dark:bg-neutral-50/20 transform -translate-y-1/2" />

                <AnimatePresence>
                  {plotLine.events.map((event, index) => (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, y: 50 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 50 }}
                      transition={{ duration: 0.3 }}
                      className="absolute top-[-0.75rem] p-3 rounded-full transform -translate-y-1/2"
                      style={{ left: `${index * 220}px` }}
                      onClick={() => openEditEventModal(plotLine.id, event)}
                    >
                      <div className="w-48 bg-light-green dark:bg-dark-green rounded-lg shadow-lg p-4 text-white cursor-pointer hover:bg-dark-green dark:hover:bg-light-green transition-colors duration-200">
                        <h3 className="font-bold text-lg mb-2">{event.name}</h3>
                        <div className="text-sm">Click to edit</div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                <button
                  onClick={() => addEvent(plotLine.id)}
                  className="absolute top-[2.5rem] p-3 pl-4 pr-6 flex items-center space-x-2 rounded-full transform -translate-y-1/2 z-10 bg-black/10 dark:bg-neutral-50/10 text-black dark:text-white hover:bg-black/20 dark:hover:bg-neutral-50/20 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-dark-green dark:focus:ring-light-green focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-black"
                  style={{ left: `${plotLine.events.length * 220}px` }}
                >
                  <PlusCircle className="h-4 w-4" />
                  <span>Add</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <PlotLineEditModal
        isOpen={isPlotLineModalOpen}
        onClose={closeEditPlotLineModal}
        onSave={handleSavePlotLineModal}
        editingPlotLine={editingPlotLine}
        setEditingPlotLine={setEditingPlotLine}
      />

      <EventEditModal
        isOpen={isEventModalOpen}
        onClose={closeEditEventModal}
        onSave={handleSaveEvent}
        editingEvent={editingEvent}
        setEditingEvent={setEditingEvent}
      />
      <div className="flex">
        <button
          onClick={generateText}
          className="mb-4 py-2 px-4 rounded-sm bg-dark-green dark:bg-light-green text-white flex items-center justify-center hover:bg-light-green dark:hover:bg-dark-green transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-dark-green dark:focus:ring-light-green focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-black"
        >
          Generate Plot Ideas
        </button>
      </div>
    </div>
  );
};

export default PlotTimeline;
