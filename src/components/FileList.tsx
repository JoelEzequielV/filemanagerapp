import { IonList, IonItem, IonLabel, IonIcon } from "@ionic/react";
import { folder, document } from "ionicons/icons";
import { FileItem } from "../services/fileService";

interface Props {
  files: FileItem[];
  onFolderClick: (path: string) => void;
}

const FileList: React.FC<Props> = ({ files, onFolderClick }) => {
  return (
    <IonList>
      {files.map((file, index) => (
        <IonItem
          key={index}
          button={file.type === "directory"}
          onClick={() =>
            file.type === "directory" && onFolderClick(file.path)
          }
        >
          <IonIcon
            icon={file.type === "directory" ? folder : document}
            slot="start"
          />
          <IonLabel>{file.name}</IonLabel>
        </IonItem>
      ))}
    </IonList>
  );
};

export default FileList;