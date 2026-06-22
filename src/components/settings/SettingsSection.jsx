import { useState, useCallback } from 'react';
import axios from 'axios';
import { PLUGIN_BASE_URL } from '@/config';
import { normalizeConfigValue } from '@/utils/pluginConfigValue';
import SelectField from './SelectField';
import SwitchField from './SwitchField';
import ColorField from './ColorField';
import InputField from './InputField';
import FontRowField from './FontRowField';
import JsonField from './JsonField';
import KnobField from './KnobField';
import PackUpload from './PackUpload';

const SettingsSection = ({ section, values, onChange, onSave, saving, peppyFolders, peppySpectrumFolders, onPackUploaded, t }) => {
    const [, setDeleting] = useState(null);

    const isFieldVisible = (field) => {
        if (!field.visibleIf) return true;
        return normalizeConfigValue(values[field.visibleIf.field]) === field.visibleIf.value;
    };

    // Resolve dynamic options for model fields based on selected folder
    const resolveField = (field) => {
        if (field.dynamicOptionsFrom) {
            const selectedFolder = normalizeConfigValue(values[field.dynamicOptionsFrom]);
            const sourceFolders = field.dynamicOptionsFrom === 'peppySpectrumFolder'
                ? (peppySpectrumFolders || [])
                : (peppyFolders || []);
            const peppyType = field.dynamicOptionsFrom === 'peppySpectrumFolder' ? 'peppy_spectrum' : 'peppy_meter';
            const folderData = sourceFolders.find((f) => f.folder === selectedFolder);
            const modelOptions = [{ value: 'random', label: 'Random (changes each track)' }];
            if (folderData) {
                for (const model of folderData.models) {
                    const m = typeof model === 'string' ? { name: model, bgr: '' } : model;
                    const opt = { value: m.name, label: m.name };
                    if (m.bgr) opt.preview = `${PLUGIN_BASE_URL}/${peppyType}/${selectedFolder}/${m.bgr}`;
                    modelOptions.push(opt);
                }
            }
            return { ...field, options: modelOptions };
        }
        return field;
    };

    const handleDeletePack = useCallback(async (folder, label) => {
        if (!window.confirm(t('DELETE_PACK_CONFIRM', 'Delete "{name}"?\nThis will permanently remove the pack from the server.').replace('{name}', label))) return;
        setDeleting(folder);
        try {
            await axios.post(`${PLUGIN_BASE_URL}/api/delete-peppy-pack?folder=${encodeURIComponent(folder)}`);
            if (onPackUploaded) onPackUploaded(); // re-fetch folder lists
        } catch (err) {
            alert(err.response?.data?.error || t('DELETE_PACK_FAILED', 'Failed to delete pack.'));
        } finally {
            setDeleting(null);
        }
    }, [onPackUploaded, t]);

    return (
        <div className="settings-section">
            <div className="settings-section__header">
                <span className="material-icons settings-section__icon">{section.icon}</span>
                <h3 className="settings-section__title">{section.label}</h3>
            </div>
            <div className="settings-section__body">
                {section.fields.map((rawField) => {
                    if (!isFieldVisible(rawField)) return null;
                    const field = resolveField(rawField);
                    switch (field.element) {
                        case 'select':
                            return <SelectField key={field.id} field={field} value={values[field.id]} onChange={onChange} onDelete={field.deletable ? handleDeletePack : undefined} />;
                        case 'switch':
                            return <SwitchField key={field.id} field={field} value={values[field.id]} onChange={onChange} />;
                        case 'color':
                            return <ColorField key={field.id} field={field} value={values[field.id]} onChange={onChange} />;
                        case 'input':
                            return <InputField key={field.id} field={field} value={values[field.id]} onChange={onChange} />;
                        case 'fontrow':
                            return <FontRowField key={field.id} field={field} nameValue={values[field.nameId]} sizeValue={values[field.sizeId]} onChange={onChange} />;
                        case 'json':
                            return <JsonField key={field.id} field={field} value={values[field.id]} onChange={onChange} />;
                        case 'knob':
                            return <KnobField key={field.id} field={field} value={values[field.id]} onChange={onChange} />;
                        default:
                            return null;
                    }
                })}
                {/* Upload section for peppy packs */}
                {section.id === 'section_player_config' && (normalizeConfigValue(values.vizType) === 'peppyMeter' || normalizeConfigValue(values.vizType) === 'peppySpectrum') && (
                    <PackUpload packType={normalizeConfigValue(values.vizType) === 'peppyMeter' ? 'meter' : 'spectrum'} onUploaded={onPackUploaded} t={t} />
                )}
            </div>
            <div className="settings-section__footer">
                <button className="btn btn-primary" onClick={() => onSave(section)} disabled={saving}>
                    <span className="material-icons">{saving ? 'hourglass_top' : 'save'}</span>
                    {saving ? 'Saving…' : 'Save'}
                </button>
            </div>
        </div>
    );
};

export default SettingsSection;
