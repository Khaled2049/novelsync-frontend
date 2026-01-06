import { SimpleEditor } from "../../components/SimpleEditor";

const CreateStory = () => {
  return (
    // h-full fills the available space defined by NavbarWrapper (Screen - Padding)
    <div className="h-full bg-neutral-50 dark:bg-black transition-colors duration-200">
      <SimpleEditor />
    </div>
  );
};

export default CreateStory;
