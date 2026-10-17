import React, { useState, useRef } from "react";
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Copy,
  Check,
  X,
  FileCheck,
  Loader2,
} from "lucide-react";
import { uploadDeedToIPFS } from "../services/pinataService";

/**
 * Format raw bytes into human readable format (KB, MB)
 */
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export default function DocumentUploader({
  onUploadSuccess,
  metadata = {},
  maxSizeMB = 15,
  acceptedFileTypes = ".pdf,.png,.jpg,.jpeg,.webp",
}) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [ipfsResult, setIpfsResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [copied, setCopied] = useState(false);

  const fileInputRef = useRef(null);

  // Maximum allowed file size in bytes
  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  const validateFile = (file) => {
    setErrorMessage("");

    if (!file) return false;

    // Check file size
    if (file.size > maxSizeBytes) {
      setErrorMessage(
        `File is too large (${formatBytes(file.size)}). Maximum allowed size is ${maxSizeMB} MB.`
      );
      return false;
    }

    // Check allowed extensions
    const fileExtension = `.${file.name.split(".").pop().toLowerCase()}`;
    const allowed = acceptedFileTypes
      .split(",")
      .map((ext) => ext.trim().toLowerCase());

    if (!allowed.includes(fileExtension)) {
      setErrorMessage(
        `Unsupported file type. Please upload one of: ${acceptedFileTypes}`
      );
      return false;
    }

    return true;
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file && validateFile(file)) {
      setSelectedFile(file);
      setIpfsResult(null);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file && validateFile(file)) {
      setSelectedFile(file);
      setIpfsResult(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setErrorMessage("Please select a file to upload.");
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(0);
      setErrorMessage("");

      const result = await uploadDeedToIPFS(
        selectedFile,
        {
          fileName: selectedFile.name,
          ...metadata,
        },
        (progress) => {
          setUploadProgress(progress);
        }
      );

      setIpfsResult(result);

      if (onUploadSuccess) {
        onUploadSuccess(result.ipfsHash, result.gatewayUrl, selectedFile);
      }
    } catch (err) {
      console.error(err);
      setErrorMessage(
        err.message || "Failed to upload file to Pinata IPFS. Check your API credentials."
      );
    } finally {
      setUploading(false);
    }
  };

  const handleCopyCID = () => {
    if (ipfsResult?.ipfsHash) {
      navigator.clipboard.writeText(ipfsResult.ipfsHash);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setIpfsResult(null);
    setErrorMessage("");
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="w-full space-y-4 font-sans text-slate-100">
      {/* Dropzone Container */}
      {!ipfsResult && (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => !uploading && fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-2xl p-6 transition-all duration-200 cursor-pointer flex flex-col items-center justify-center text-center ${
            dragActive
              ? "border-emerald-400 bg-emerald-500/10 shadow-lg shadow-emerald-500/10"
              : "border-slate-800 hover:border-slate-700 bg-slate-900/40 hover:bg-slate-900/60"
          } ${uploading ? "pointer-events-none opacity-80" : ""}`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={acceptedFileTypes}
            onChange={handleFileChange}
            className="hidden"
          />

          <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-3">
            <UploadCloud className="h-6 w-6 text-emerald-400" />
          </div>

          <h4 className="text-sm font-semibold text-slate-200 mb-1">
            Drag & Drop Title Deed or Surveyor Map
          </h4>
          <p className="text-xs text-slate-400 max-w-sm mb-3">
            Upload verified deed PDF, surveyor land boundaries, or government property certificate
          </p>

          <span className="inline-flex items-center text-[11px] font-medium text-slate-500 bg-slate-950/80 px-2.5 py-1 rounded-full border border-slate-800">
            PDF, PNG, JPG, WEBP • Max {maxSizeMB} MB
          </span>
        </div>
      )}

      {/* Selected File Card Preview */}
      {selectedFile && !ipfsResult && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className="h-10 w-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
              <FileText className="h-5 w-5 text-emerald-400" />
            </div>
            <div className="truncate">
              <p className="text-xs font-semibold text-slate-100 truncate">
                {selectedFile.name}
              </p>
              <p className="text-[11px] text-slate-400">
                {formatBytes(selectedFile.size)}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            {!uploading && (
              <button
                type="button"
                onClick={handleReset}
                className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition-colors"
                title="Remove file"
              >
                <X className="h-4 w-4" />
              </button>
            )}

            <button
              type="button"
              onClick={handleUpload}
              disabled={uploading}
              className="inline-flex items-center space-x-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold px-3 py-2 rounded-lg transition-all shadow-md shadow-emerald-500/20 active:scale-95 disabled:opacity-50"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Pinning ({uploadProgress}%)</span>
                </>
              ) : (
                <>
                  <UploadCloud className="h-3.5 w-3.5" />
                  <span>Pin to IPFS</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Upload Progress Bar */}
      {uploading && (
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-slate-400">
            <span>Uploading to Pinata decentralized storage...</span>
            <span className="font-mono text-emerald-400">{uploadProgress}%</span>
          </div>
          <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-emerald-400 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Error Message Alert */}
      {errorMessage && (
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-3 flex items-start space-x-2 text-xs text-rose-300">
          <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">Upload Notice</p>
            <p className="text-rose-200/90 mt-0.5">{errorMessage}</p>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage("")}
            className="text-rose-400 hover:text-rose-200"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Successful Upload State & IPFS Gateway Preview */}
      {ipfsResult && (
        <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-emerald-400 text-xs font-semibold">
              <CheckCircle2 className="h-4 w-4" />
              <span>Document Pinned to IPFS Successfully</span>
            </div>

            <button
              type="button"
              onClick={handleReset}
              className="text-xs text-slate-400 hover:text-white transition-colors"
            >
              Upload Another
            </button>
          </div>

          {/* CID Display */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 flex items-center justify-between gap-2">
            <div className="truncate">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold">
                IPFS Hash / CID:
              </span>
              <span className="font-mono text-xs text-emerald-300 truncate select-all">
                {ipfsResult.ipfsHash}
              </span>
            </div>

            <button
              type="button"
              onClick={handleCopyCID}
              className="inline-flex items-center space-x-1 bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0"
              title="Copy CID"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>

          {/* Action Links */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
            <div className="flex items-center space-x-2 text-slate-400">
              <FileCheck className="h-4 w-4 text-emerald-400" />
              <span>{selectedFile?.name || "Deed Document"}</span>
              {ipfsResult.pinSize && (
                <span>• {formatBytes(ipfsResult.pinSize)}</span>
              )}
            </div>

            <a
              href={ipfsResult.gatewayUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1.5 text-emerald-400 hover:text-emerald-300 font-semibold hover:underline"
            >
              <span>View via Pinata Gateway</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
