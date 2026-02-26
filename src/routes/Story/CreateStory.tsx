import { SimpleEditor } from "../../components/SimpleEditor";

const CreateStory = () => {
  return (
    // h-full fills the available space defined by NavbarWrapper (Screen - Padding)
    <div className="h-full bg-ns-bg">
      <SimpleEditor />
    </div>
  );
};

export default CreateStory;
