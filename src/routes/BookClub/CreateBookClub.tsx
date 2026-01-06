import { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { IClub } from "../../types/IClub";
import { IUser } from "../../types/IUser";
import { Book, X, Users, MapPin, Tag } from "lucide-react";
import { IBook } from "../../types/IBook";
import BookSearch from "../../components/BookSearch";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

const CreateBookClub = ({
  user,
  onCreate,
  onCancel,
}: {
  user: IUser;
  onCreate: (newClub: IClub) => void;
  onCancel: () => void;
}) => {
  const [bookOfTheMonth, setBookOfTheMonth] = useState<IBook>({
    id: "",
    volumeInfo: {
      title: "",
      authors: [],
      description: "",
      imageLinks: {
        thumbnail: "",
      },
    },
  });
  const [newClub, setNewClub] = useState<IClub>({
    id: "",
    name: "",
    description: "",
    image: "",
    members: [],
    category: "",
    activity: "",
    creatorId: "",
    bookOfTheMonth: {
      id: "",
      volumeInfo: {
        title: "",
        authors: [],
        description: "",
        imageLinks: {
          thumbnail: "",
        },
      },
    },
    meetUp: "",
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setNewClub({
      ...newClub,
      [e.target.name]: e.target.value,
    });
  };

  const handleBookSelect = (book: IBook) => {
    setBookOfTheMonth(book);
    setNewClub({
      ...newClub,
      bookOfTheMonth: book,
    });
  };

  const handleCreateClub = () => {
    const clubWithDefaults = {
      ...newClub,
      id: uuidv4(),
      members: [user.uid],
      activity: "New",
      image: "/api/placeholder/400/250",
      creatorId: user.uid,
      bookOfTheMonth: {
        id: bookOfTheMonth.id,
        volumeInfo: {
          title: bookOfTheMonth.volumeInfo.title,
          authors: bookOfTheMonth.volumeInfo.authors,
          description: bookOfTheMonth.volumeInfo.description,
          imageLinks: {
            thumbnail: bookOfTheMonth.volumeInfo.imageLinks?.thumbnail || "",
          },
        },
      },
      meetUp: newClub.meetUp,
    };
    onCreate(clubWithDefaults);
  };

  return (
    <Card className="shadow-lg">
      <CardHeader className="border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-dark-green/10 dark:bg-light-green/10">
              <Book className="w-6 h-6 text-dark-green dark:text-light-green" />
            </div>
            <div>
              <CardTitle className="text-2xl font-heading text-black dark:text-white">
                Create New Book Club
              </CardTitle>
              <CardDescription className="mt-1">
                Start a community around your favorite books
              </CardDescription>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onCancel}
            className="h-8 w-8"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        <div className="space-y-6">
          {/* Club Name */}
          <div className="space-y-2">
            <Label
              htmlFor="name"
              className="text-base font-semibold text-black dark:text-white flex items-center gap-2"
            >
              <Users className="w-4 h-4 text-dark-green dark:text-light-green" />
              Club Name
            </Label>
            <Input
              id="name"
              name="name"
              value={newClub.name}
              onChange={handleInputChange}
              placeholder="e.g., Fantasy Book Lovers"
              className="h-11 text-base focus-visible:ring-2 focus-visible:ring-dark-green dark:focus-visible:ring-light-green"
            />
          </div>

          {/* Club Description */}
          <div className="space-y-2">
            <Label
              htmlFor="description"
              className="text-base font-semibold text-black dark:text-white"
            >
              Club Description
            </Label>
            <Textarea
              id="description"
              name="description"
              value={newClub.description}
              onChange={handleInputChange}
              placeholder="Tell us about your book club. What genres do you read? What makes your club special?"
              className="min-h-[120px] text-base resize-none focus-visible:ring-2 focus-visible:ring-dark-green dark:focus-visible:ring-light-green"
            />
          </div>

          {/* Category and Meetup in a grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label
                htmlFor="category"
                className="text-base font-semibold text-black dark:text-white flex items-center gap-2"
              >
                <Tag className="w-4 h-4 text-dark-green dark:text-light-green" />
                Category
              </Label>
              <Input
                id="category"
                name="category"
                value={newClub.category}
                onChange={handleInputChange}
                placeholder="e.g., Fantasy, Mystery, Romance"
                className="h-11 text-base focus-visible:ring-2 focus-visible:ring-dark-green dark:focus-visible:ring-light-green"
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="meetUp"
                className="text-base font-semibold text-black dark:text-white flex items-center gap-2"
              >
                <MapPin className="w-4 h-4 text-dark-green dark:text-light-green" />
                Meetup Location
              </Label>
              <Input
                id="meetUp"
                name="meetUp"
                value={newClub.meetUp}
                onChange={handleInputChange}
                placeholder="e.g., Online, New York, London"
                className="h-11 text-base focus-visible:ring-2 focus-visible:ring-dark-green dark:focus-visible:ring-light-green"
              />
            </div>
          </div>

          {/* Book of the Month */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-2">
              <Book className="w-5 h-5 text-dark-green dark:text-light-green" />
              <Label className="text-base font-semibold text-black dark:text-white">
                Book of the Month
              </Label>
            </div>
            <BookSearch onBookSelect={handleBookSelect} />
            {bookOfTheMonth.volumeInfo.title && (
              <div className="mt-4 p-4 bg-neutral-50 dark:bg-neutral-900 rounded-lg">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Selected Book:
                </p>
                <p className="text-base font-semibold text-black dark:text-white">
                  {bookOfTheMonth.volumeInfo.title}
                </p>
                {bookOfTheMonth.volumeInfo.authors && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    by {bookOfTheMonth.volumeInfo.authors.join(", ")}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-end gap-3 mt-8 pt-6 border-t border-gray-200 dark:border-gray-800">
          <Button
            variant="outline"
            onClick={onCancel}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreateClub}
            className="w-full sm:w-auto bg-dark-green dark:bg-light-green text-white hover:bg-light-green dark:hover:bg-dark-green"
            disabled={!newClub.name.trim()}
          >
            Create Club
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default CreateBookClub;
