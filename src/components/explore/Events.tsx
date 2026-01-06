// Define a type for an Event
type Event = {
  id: string;
  title: string;
  description: string;
  date: string;
};

// Mock Data for December Events
const decemberEvents: Event[] = [
  {
    id: "1",
    title: "Novel Sync Launch Party",
    description:
      "Celebrate the launch of NovelSync with fellow writers. Join us for an evening of creativity and inspiration!",
    date: "December 1, 2024",
  },
  {
    id: "2",
    title: "Fantasy Story Competition",
    description:
      "Enter your best fantasy story for a chance to win exciting prizes! All genres within fantasy are welcome.",
    date: "December 15, 2024",
  },
  {
    id: "3",
    title: "Troubled Character Backstory Competition",
    description:
      "Create a compelling backstory for a troubled character. Show us what makes them unforgettable!",
    date: "December 28, 2024",
  },
];

const Events: React.FC = () => {
  return (
    <div className="events-container p-6 max-w-screen-md mx-auto">
      <h2 className="text-2xl font-bold mb-4">Events in December</h2>

      <div className="space-y-4">
        {decemberEvents.map((event) => (
          <div
            key={event.id}
            className="event-item  rounded-lg shadow-md p-4 border-l-4 border-purple-600"
          >
            <h3 className="text-lg font-semibold text-purple-600 mb-1">
              {event.title}
            </h3>
            <p className="text-gray-700 mb-2">{event.description}</p>
            <p className="text-gray-500 text-sm">{event.date}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Events;
