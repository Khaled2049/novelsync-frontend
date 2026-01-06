import ReactModal from "react-modal";
import * as Icons from "./Icons";
import { Modal } from "./Modal";

interface IProps extends ReactModal.Props {
  url: string;
  closeModal: () => void;
  onChangeUrl: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSaveLink: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

export function LinkModal(props: IProps) {
  const { url, closeModal, onChangeUrl, onSaveLink, ...rest } = props;
  return (
    <Modal {...rest}>
      <div className="relative p-6  rounded-full shadow-xl">
        <h2 className="text-2xl font-bold mb-4">Enter Prompt</h2>
        <button
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
          type="button"
          onClick={closeModal}
        >
          <Icons.X />
        </button>
        <input
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
          autoFocus
          value={url}
          onChange={onChangeUrl}
        />
        <div className="flex justify-end space-x-2">
          <button
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition duration-150 ease-in-out"
            type="button"
            onClick={onSaveLink}
          >
            Save
          </button>
        </div>
      </div>
    </Modal>
  );
}
