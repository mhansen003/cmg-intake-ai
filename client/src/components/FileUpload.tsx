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
          <h3 className="file-list-header">Selected Files ({files.length})</h3>
          <div className="file-cards">
            {files.map((file, index) => (
              <div
                key={index}
                className="file-card"
                onClick={() => removeFile(index)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    removeFile(index);
                  }
                }}
              >
                <div className="file-card-checkbox">
                  <svg
                    className="checkmark-icon"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                  </svg>
                </div>
                <div className="file-card-content">
                  <div className="file-card-icon">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
                    </svg>
                  </div>
                  <div className="file-card-info">
                    <span className="file-card-name">{file.name}</span>
                    <span className="file-card-size">
                      {(file.size / 1024).toFixed(2)} KB
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <p className="file-list-hint">Click on a card to deselect</p>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
