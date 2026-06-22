import { useState, useRef, useCallback } from 'react';
import axios from 'axios';
import { PLUGIN_BASE_URL } from '@/config';

const PackUpload = ({ packType, onUploaded, t }) => {
    const fileRef = useRef(null);
    const [uploading, setUploading] = useState(false);
    const [status, setStatus] = useState(null);

    const handleUpload = useCallback(async () => {
        const file = fileRef.current?.files?.[0];
        if (!file) return;

        if (!file.name.toLowerCase().endsWith('.zip')) {
            setStatus({ type: 'error', message: t('UPLOAD_ZIP_ONLY', 'Only .zip files are accepted.') });
            return;
        }

        setUploading(true);
        setStatus(null);

        try {
            const buffer = await file.arrayBuffer();
            const response = await axios.post(
                `${PLUGIN_BASE_URL}/api/upload-peppy-pack?type=${packType}`,
                buffer,
                { headers: { 'Content-Type': 'application/octet-stream' }, timeout: 120000 }
            );
            setStatus({ type: 'success', message: response.data?.message || t('UPLOAD_SUCCESS', 'Upload successful.') });
            if (fileRef.current) fileRef.current.value = '';
            if (onUploaded) onUploaded();
        } catch (err) {
            const msg = err.response?.data?.error || err.message || t('UPLOAD_FAILED', 'Upload failed.');
            setStatus({ type: 'error', message: msg });
        } finally {
            setUploading(false);
        }
    }, [packType, onUploaded, t]);

    return (
        <div className="settings-field pack-upload">
            <div className="settings-field__label">
                <span className="material-icons settings-field__icon">upload_file</span>
                <span>{packType === 'meter' ? t('UPLOAD_METER_PACK', 'Upload Meter Pack (.zip)') : t('UPLOAD_SPECTRUM_PACK', 'Upload Spectrum Pack (.zip)')}</span>
            </div>
            <div className="pack-upload__row">
                <input
                    ref={fileRef}
                    type="file"
                    accept=".zip,application/zip"
                    className="form-control form-control-sm"
                    disabled={uploading}
                />
                <button
                    className="btn btn-sm btn-outline-primary"
                    onClick={handleUpload}
                    disabled={uploading}
                >
                    <span className="material-icons">{uploading ? 'hourglass_top' : 'cloud_upload'}</span>
                    {uploading ? t('UPLOAD_BTN_UPLOADING', 'Uploading…') : t('UPLOAD_BTN', 'Upload')}
                </button>
            </div>
            <div className="pack-upload__link">
                {packType === 'meter' ? (
                    <a href="https://github.com/foonerd/peppy_templates/blob/main/catalog/README.md" target="_blank" rel="noopener noreferrer">
                        <span className="material-icons">open_in_new</span> {t('BROWSE_PEPPY_TEMPLATES', 'Browse Peppy Templates')}
                    </a>
                ) : (
                    <a href="https://github.com/balbuze/Spectrum-peppyspectrum/tree/main/Zipped-folders" target="_blank" rel="noopener noreferrer">
                        <span className="material-icons">open_in_new</span> {t('BROWSE_SPECTRUM_PACKS', 'Browse Spectrum Packs')}
                    </a>
                )}
            </div>
            {status && (
                <div className={`pack-upload__status pack-upload__status--${status.type}`}>
                    {status.message}
                </div>
            )}
        </div>
    );
};

export default PackUpload;
