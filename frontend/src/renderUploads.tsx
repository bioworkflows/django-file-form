import { render } from "inferno";
import BaseUpload from "./uploads/base_upload";
import { formatBytes } from "./util";

export type Translations = { [key: string]: string };

interface CancelLinkProps {
  onDelete: (upload: BaseUpload) => void;
  translations: Translations;
  upload: BaseUpload;
}

const CancelLink = ({ onDelete, translations, upload }: CancelLinkProps) => {
  const handleCancel = () => onDelete(upload);

  const classes = ["dff-cancel"];
  const cancelling = upload.deleteStatus === "in_progress";

  if (cancelling) {
    classes.push("dff-disabled");
  }

  return (
    <a
      className="dff-cancel"
      href="#"
      onClick={cancelling ? undefined : handleCancel}
    >
      {translations.Cancel}
    </a>
  );
};

interface UploadInProgressProps {
  onDelete: (upload: BaseUpload) => void;
  translations: Translations;
  upload: BaseUpload;
}

const UploadInProgress = ({
  onDelete,
  translations,
  upload
}: UploadInProgressProps) => (
  <div className={`dff-file dff-file-id-${upload.uploadIndex}`}>
    <span>{upload.name}</span>
    <span className="dff-progress">
      <span
        className="dff-progress-inner"
        style={{ width: `${upload.progress.toFixed(2)}%` }}
      />
    </span>
    <CancelLink
      onDelete={onDelete}
      translations={translations}
      upload={upload}
    />
  </div>
);

interface DeleteLinkProps {
  onDelete: (upload: BaseUpload) => void;
  translations: Translations;
  upload: BaseUpload;
}

const DeleteLink = ({ onDelete, translations, upload }: DeleteLinkProps) => {
  const handleDelete = () => onDelete(upload);

  const classes = ["dff-delete"];
  const deleting = upload.deleteStatus === "in_progress";

  if (deleting) {
    classes.push("dff-disabled");
  }

  return (
    <a
      className="dff-delete"
      href="#"
      onClick={deleting ? undefined : handleDelete}
    >
      {translations.Delete}
    </a>
  );
};

interface UploadDoneProps {
  onDelete: (upload: BaseUpload) => void;
  translations: Translations;
  upload: BaseUpload;
}

const UploadDone = ({ onDelete, translations, upload }: UploadDoneProps) => (
  <div
    className={`dff-file dff-upload-success dff-file-id-${upload.uploadIndex}`}
  >
    <span>{upload.name}</span>
    <span className="dff-filesize">{formatBytes(upload.getSize(), 2)}</span>
    <DeleteLink
      onDelete={onDelete}
      translations={translations}
      upload={upload}
    />
    {upload.deleteStatus === "error" && (
      <span className="dff-error">{translations["Delete failed"]}</span>
    )}
  </div>
);

interface UploadErrorProps {
  translations: Translations;
  upload: BaseUpload;
}

const UploadError = ({ translations, upload }: UploadErrorProps) => (
  <div className={`dff-file dff-upload-fail dff-file-id-${upload.uploadIndex}`}>
    <span>{upload.name}</span>
    <span className="dff-error">{translations["Upload failed"]}</span>
  </div>
);

interface UploadProps {
  onDelete: (upload: BaseUpload) => void;
  translations: Translations;
  upload: BaseUpload;
}

const Upload = ({ onDelete, translations, upload }: UploadProps) => {
  switch (upload.status) {
    case "done":
      return (
        <UploadDone
          onDelete={onDelete}
          translations={translations}
          upload={upload}
        />
      );

    case "error":
      return <UploadError translations={translations} upload={upload} />;

    case "uploading":
      return (
        <UploadInProgress
          onDelete={onDelete}
          translations={translations}
          upload={upload}
        />
      );
  }
};

interface RenderUploadParameters {
  container: HTMLElement;
  onDelete: (upload: BaseUpload) => void;
  translations: Translations;
  uploads: BaseUpload[];
}

const renderUploads = ({
  container,
  onDelete,
  translations,
  uploads
}: RenderUploadParameters): void => {
  render(
    <>
      {uploads.map(upload => (
        <Upload
          key={upload.uploadIndex}
          onDelete={onDelete}
          upload={upload}
          translations={translations}
        />
      ))}
    </>,
    container
  );
};

export default renderUploads;
