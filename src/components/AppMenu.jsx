import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ContextMenu from './ContextMenu';
import { VOLUMIO_BASE_URL } from '@/config';

const AppMenu = ({
    vizStopped,
    onStopViz,
    onBackToPlayer,
    onFullscreenViz,
    isVizFullscreen,
    variant = 'dropdown',
    isOpen,
    onClose,
}) => {
    const navigate = useNavigate();
    const [isFullscreen, setIsFullscreen] = useState(false);

    const toggleFullscreen = async () => {
        try {
            if (!document.fullscreenElement) {
                await document.body.requestFullscreen();
                setIsFullscreen(true);
            } else {
                await document.exitFullscreen();
                setIsFullscreen(false);
            }
        } catch (err) {
            console.warn('Fullscreen toggle failed:', err);
        }
    };

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    const items = [
        { label: 'Playlist Manager', icon: 'queue_music', onClick: () => navigate('/playlist-manager') },
        { label: 'Layout Designer', icon: 'grid_view', onClick: () => navigate('/layout-designer') },
        { label: 'Settings', icon: 'settings', onClick: () => navigate('/settings') },
        ...(onBackToPlayer
            ? [
                { label: 'Back to Player', icon: 'arrow_back', onClick: onBackToPlayer },
                { separator: true },
            ]
            : []),
        { label: 'Refresh', icon: 'refresh', onClick: () => window.location.reload() },
        {
            label: isFullscreen ? 'Exit Fullscreen' : 'Fullscreen',
            icon: isFullscreen ? 'fullscreen_exit' : 'fullscreen',
            onClick: toggleFullscreen,
        },
        ...(!vizStopped && onFullscreenViz
            ? [
                { separator: true },
                {
                    label: isVizFullscreen ? 'Exit Visualization Fullscreen' : 'Visualization Fullscreen',
                    icon: isVizFullscreen ? 'fullscreen_exit' : 'fullscreen',
                    onClick: onFullscreenViz,
                },
            ]
            : []),
        ...(!vizStopped && onStopViz
            ? [
                ...(!onFullscreenViz ? [{ separator: true }] : []),
                { label: 'Stop Visualization', icon: 'equalizer', onClick: onStopViz },
            ]
            : []),
        { separator: true },
        { label: 'Back', icon: 'arrow_back', onClick: () => navigate(-1) },
        {
            label: 'Exit',
            icon: 'power_settings_new',
            danger: true,
            onClick: () => window.location.assign(VOLUMIO_BASE_URL),
        },
    ];

    return (
        <ContextMenu
            items={items}
            variant={variant}
            isOpen={isOpen}
            onClose={onClose}
        />
    );
};


export default AppMenu;
