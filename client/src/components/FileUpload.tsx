import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

interface FileUploadProps {
  onFilesSelected: (files: File[]) => void;
  files: File[];
}

const FileUpload: React.FC<FileUploadProps> = ({ onFilesSelected, files }) => {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    onFilesSelected([...files, ...acceptedFiles]);
  }, [files, onFilesSelected]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
      'text/plain': ['.txt'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    multiple: true,
  });

  const removeFile = (index: number) => {
    const newFiles = [...files];
    newFiles.splice(index, 1);
    onFilesSelected(newFiles);
  };

  return (
    <div className="file-upload-container">
      <div
        {...getRootProps()}
        className={`dropzone ${isDragActive ? 'active' : ''}`}
      >
        <input {...getInputProps()} />
        <div className="dropzone-content">
          <svg
            className="upload-icon"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
          {isDragActive ? (
            <p className="dropzone-text">Drop files here...</p>
          ) : (
            <>
              <p className="dropzone-text">
                Drag & drop files here, or click to select
              </p>
              <p className="dropzone-subtext">
                PDF, Images, Text documents supported
              </p>
            </>
          )}
        </div>
      </div>

      {files.length > 0 && (
        <div className="file-list">
          <h3>Selected Files ({files.length})</h3>
          {files.map((file, index) => (
            <div key={index} className="file-item">
              <div className="file-info">
                <span className="file-name">{file.name}</span>
                <span className="file-size">
                  {(file.size / 1024).toFixed(2)} KB
                </span>
              </div>
              <button
                onClick={() => removeFile(index)}
                className="remove-btn"
                type="button"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileUpload;
