import { useParams } from "react-router-dom";
import { bookClubRepo } from "./bookClubRepo";

const DeleteBookClub: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const handleDelete = async () => {
    await bookClubRepo.deleteBookClub(id!);
  };

  return (
    <div>
      <p>Are you sure you want to delete this book club?</p>
      <button onClick={handleDelete}>Yes, Delete</button>
    </div>
  );
};

export default DeleteBookClub;
