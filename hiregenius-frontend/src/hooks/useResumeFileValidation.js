import { useState, useCallback } from 'react';

/**
 * useResumeFileValidation — shared file validation logic for resume uploads.
 *
 * Canonical rules (single source of truth for BOTH RSDemo and CandidateDashboard):
 *   - Allowed MIME types: application/pdf, application/vnd.openxmlformats-officedocument.wordprocessingml.document
 *   - Allowed extensions (fallback when MIME is empty): .pdf, .docx, .doc
 *   - Max size: 5 MB
 *
 * Usage:
 *   const { validateFile, fileError, clearFileError } = useResumeFileValidation();
 *   const accepted = validateFile(file);   // returns true if valid, false + sets fileError if not
 */

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  // Some browsers report .doc files with this MIME; include for broad compat:
  'application/msword',
]);

const ALLOWED_EXTENSIONS = new Set(['.pdf', '.docx', '.doc']);

/** 5 megabytes in bytes */
export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

/** Human-readable max size string shown in error messages */
export const MAX_FILE_SIZE_LABEL = '5 MB';

/** Error messages — all copy lives here so both UIs stay in sync */
export const FILE_ERRORS = {
  WRONG_TYPE: 'Unsupported file type. Please upload a PDF or DOCX file.',
  TOO_LARGE: `File is too large. Maximum allowed size is ${MAX_FILE_SIZE_LABEL}.`,
  NO_FILE: 'No file selected.',
};

/**
 * Checks a File object against the canonical validation rules.
 * Returns an error string if invalid, or null if valid.
 * Pure function — no state. Useful for one-off checks without the hook.
 *
 * @param {File} file
 * @returns {string | null}
 */
export const getFileValidationError = (file) => {
  if (!file) return FILE_ERRORS.NO_FILE;

  // Type check: use MIME first, fall back to file extension
  const ext = `.${file.name.split('.').pop().toLowerCase()}`;
  const mimeOk = ALLOWED_MIME_TYPES.has(file.type);
  const extOk = ALLOWED_EXTENSIONS.has(ext);
  if (!mimeOk && !extOk) return FILE_ERRORS.WRONG_TYPE;

  // Size check
  if (file.size > MAX_FILE_SIZE_BYTES) return FILE_ERRORS.TOO_LARGE;

  return null;
};

/**
 * useResumeFileValidation — React hook wrapping file validation with state.
 *
 * @returns {{
 *   validateFile: (file: File) => boolean,
 *   fileError: string | null,
 *   clearFileError: () => void,
 * }}
 */
const useResumeFileValidation = () => {
  const [fileError, setFileError] = useState(null);

  /**
   * Validates a File against allowed types and max size.
   * Sets fileError state on failure.
   * Clears fileError state on success.
   *
   * @param {File} file
   * @returns {boolean} true if the file is valid
   */
  const validateFile = useCallback((file) => {
    const error = getFileValidationError(file);
    if (error) {
      setFileError(error);
      return false;
    }
    setFileError(null);
    return true;
  }, []);

  const clearFileError = useCallback(() => setFileError(null), []);

  return { validateFile, fileError, clearFileError };
};

export default useResumeFileValidation;
