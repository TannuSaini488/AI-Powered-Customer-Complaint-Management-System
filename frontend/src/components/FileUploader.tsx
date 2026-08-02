import { useState, useRef } from "react";

type FileUploaderProps = {
  onUpload: (file: File) => void;
  uploadedFileName?: string | null;
};

export function FileUploader({ onUpload, uploadedFileName }: FileUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onUpload(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      onUpload(e.target.files[0]);
      // Reset so same file can be re-uploaded
      e.target.value = "";
    }
  };

  return (
    <div
      className={`file-uploader ${dragActive ? "file-uploader--active" : ""} ${uploadedFileName ? "file-uploader--uploaded" : ""}`}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.png,.jpg,.jpeg,.txt"
        onChange={handleChange}
        className="file-input-hidden"
      />
      {uploadedFileName ? (
        <>
          <span className="file-uploader-icon">📄</span>
          <p className="file-uploader-name">{uploadedFileName}</p>
          <p className="file-uploader-hint">Click to replace</p>
        </>
      ) : (
        <>
          <span className="file-uploader-icon">⬆</span>
          <p className="file-uploader-hint">
            Drag &amp; drop or click to upload
          </p>
          <p className="file-uploader-types">PDF · PNG · JPG · TXT</p>
        </>
      )}
    </div>
  );
}
