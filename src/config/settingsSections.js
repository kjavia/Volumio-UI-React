/* ═══════════════════════════════════════════════════════════════════════
   UIConfig section definitions
   Mirrors UIConfig.json but only the editable sections (skip daemon, app info, kiosk).
   Each section defines its fields, the save method, and which field IDs to send.
   ═══════════════════════════════════════════════════════════════════════ */

const getSections = (t, peppyFolders = [], peppySpectrumFolders = []) => {
  // Build folder options from the API response
  const peppyFolderOptions = peppyFolders.map((f) => ({
    value: f.folder,
    label: `${f.name} (${f.width}×${f.height})`,
  }));

  const peppySpectrumFolderOptions = peppySpectrumFolders.map((f) => ({
    value: f.folder,
    label: `${f.name} (${f.width}×${f.height}, ${f.bars} bars)`,
  }));

  return [
    {
      id: 'section_player_config',
      label: t('PLAYER_CONFIG', 'Player Configuration'),
      icon: 'tune',
      method: 'configSavePlayerConfig',
      fields: [
        {
          id: 'theme', element: 'select', label: t('THEME', 'Theme'), icon: 'palette',
          doc: t('THEME_DESC', 'Select the UI theme for different visual styles.'),
          options: [
            { value: 'skeuomorphic', label: 'Skeuomorphic' },
            { value: 'metallic', label: 'Metallic' },
            { value: 'brushed-metal', label: 'Brushed Metal' },
            { value: 'aqua', label: 'Aqua' },
            { value: 'flat', label: 'Flat' },
            { value: 'win95', label: 'Windows 95' },
            { value: 'casio', label: 'Casio 80s' },
            { value: 'oled', label: 'OLED' },
          ],
        },
        {
          id: 'playerType', element: 'select', label: t('PLAYER_TYPE', 'Player Type'), icon: 'album',
          doc: t('PLAYER_TYPE_DESC', 'Select which player visual is displayed.'),
          options: [
            { value: 'albumArt', label: t('PLAYER_TYPE_ALBUM_ART', 'Album Art') },
            { value: 'vinyl', label: t('PLAYER_TYPE_VINYL', 'Vinyl') },
            { value: 'vinylCover', label: t('PLAYER_TYPE_VINYL_COVER', 'Vinyl Cover') },
            { value: 'cd', label: t('PLAYER_TYPE_CD', 'CD') },
            { value: 'cdCover', label: t('PLAYER_TYPE_CD_COVER', 'CD Cover') },
            { value: 'cassette', label: t('PLAYER_TYPE_CASSETTE', 'Cassette') },
            { value: 'reelToReel', label: t('PLAYER_TYPE_REEL_TO_REEL', 'Reel to Reel') },
            { value: 'radio', label: t('PLAYER_TYPE_RADIO', 'Radio') },
            { value: 'matchSource', label: t('PLAYER_TYPE_MATCH_SOURCE', 'Match Source') },
            { value: 'random', label: t('PLAYER_TYPE_RANDOM', 'Random') },
            { value: 'none', label: t('NONE', 'None') },
          ],
        },
        { id: 'showPlayerControls', element: 'switch', label: t('SHOW_PLAYER_CONTROLS', 'Show Player Controls'), icon: 'gamepad', doc: t('SHOW_PLAYER_CONTROLS_DESC', 'When disabled, player buttons are hidden.') },
        { id: 'hideSeekHandle', element: 'switch', label: t('HIDE_SEEK_HANDLE', 'Hide Seek Bar Handle'), icon: 'drag_handle', doc: t('HIDE_SEEK_HANDLE_DESC', 'Hide the draggable handle on the seek bar for a cleaner look.') },
        { id: 'showRemainingTime', element: 'switch', label: t('SHOW_REMAINING_TIME', 'Show Remaining Time'), icon: 'timer', doc: t('SHOW_REMAINING_TIME_DESC', 'Show remaining time instead of total duration.') },
        { id: 'albumArtMaxSpace', element: 'switch', label: t('ALBUM_ART_MAX_SPACE', 'Use Maximum Space'), icon: 'aspect_ratio', doc: t('ALBUM_ART_MAX_SPACE_DESC', 'Expand album art to fill the panel.'), visibleIf: { field: 'playerType', value: 'albumArt' } },
        { id: 'albumArtAnimated', element: 'switch', label: t('ALBUM_ART_ANIMATED', 'Animated Album Art'), icon: 'animation', doc: t('ALBUM_ART_ANIMATED_DESC', 'Enable rainbow border animation when playing.'), visibleIf: { field: 'playerType', value: 'albumArt' } },
        { id: 'showTrackPanel', element: 'switch', label: t('SHOW_TRACK_PANEL', 'Show Track Info Panel'), icon: 'info', doc: t('SHOW_TRACK_PANEL_DESC', 'Display a themed panel behind track info.') },
        { id: 'useCustomLayout', element: 'switch', label: t('USE_CUSTOM_LAYOUT', 'Use Custom Layouts'), icon: 'grid_view', doc: t('USE_CUSTOM_LAYOUT_DESC', 'When enabled, the player will use a saved custom layout for the current screen resolution if one exists.') },
        {
          id: 'vizType', element: 'select', label: t('VIZ_TYPE', 'Visualization'), icon: 'equalizer',
          doc: t('VIZ_TYPE_DESC', 'Select the visualization displayed on the player screen.'),
          options: [
            { value: 'spectrum', label: t('VIZ_TYPE_SPECTRUM', 'Spectrum Analyzer') },
            { value: 'peppyMeter', label: t('VIZ_TYPE_PEPPY_METER', 'Peppy Meter') },
            { value: 'peppySpectrum', label: t('VIZ_TYPE_PEPPY_SPECTRUM', 'Peppy Spectrum') },
            { value: 'none', label: t('NONE', 'None') },
          ],
        },
        { id: 'spectrumOptions', element: 'json', label: t('SPECTRUM_OPTIONS', 'Spectrum Options (JSON)'), icon: 'data_object', doc: t('SPECTRUM_OPTIONS_DESC', 'Override AudioMotion Analyzer options.'), visibleIf: { field: 'vizType', value: 'spectrum' } },
        {
          id: 'peppyMeterFolder', element: 'select', label: t('PEPPY_METER_FOLDER', 'Peppy Meter Pack'), icon: 'folder',
          doc: t('PEPPY_METER_FOLDER_DESC', 'Select the meter asset pack.'),
          options: peppyFolderOptions,
          visibleIf: { field: 'vizType', value: 'peppyMeter' },
          deletable: true,
        },
        {
          id: 'peppyMeterModel', element: 'select', label: t('PEPPY_METER_MODEL', 'Peppy Meter Model'), icon: 'speed',
          doc: t('PEPPY_METER_MODEL_DESC', 'Select a specific meter design, or Random to cycle on each track change.'),
          options: [], // Populated dynamically by SettingsSection based on selected folder
          dynamicOptionsFrom: 'peppyMeterFolder', // marker for dynamic options
          visibleIf: { field: 'vizType', value: 'peppyMeter' },
        },
        {
          id: 'peppySpectrumFolder', element: 'select', label: t('PEPPY_SPECTRUM_FOLDER', 'Peppy Spectrum Pack'), icon: 'folder',
          doc: t('PEPPY_SPECTRUM_FOLDER_DESC', 'Select the spectrum asset pack.'),
          options: peppySpectrumFolderOptions,
          visibleIf: { field: 'vizType', value: 'peppySpectrum' },
          deletable: true,
        },
        {
          id: 'peppySpectrumModel', element: 'select', label: t('PEPPY_SPECTRUM_MODEL', 'Peppy Spectrum Model'), icon: 'graphic_eq',
          doc: t('PEPPY_SPECTRUM_MODEL_DESC', 'Select a specific spectrum design, or Random to cycle on each track change.'),
          options: [], // Populated dynamically
          dynamicOptionsFrom: 'peppySpectrumFolder',
          visibleIf: { field: 'vizType', value: 'peppySpectrum' },
        },
      ],
    },
    {
      id: 'section_colors',
      label: t('COLORS', 'Colors'),
      icon: 'palette',
      method: 'configSaveColors',
      fields: [
        { id: 'backgroundColor', element: 'color', label: t('BACKGROUND_COLOR', 'Background Color'), icon: 'format_color_fill', doc: t('BACKGROUND_COLOR_DESC', 'Leave empty for album art background.') },
        { id: 'trackColor', element: 'color', label: t('TRACK_COLOR', 'Track Title Color'), icon: 'title', doc: t('TRACK_COLOR_DESC', 'Leave empty for theme default.') },
        { id: 'artistColor', element: 'color', label: t('ARTIST_COLOR', 'Artist Name Color'), icon: 'person', doc: t('ARTIST_COLOR_DESC', 'Leave empty for theme default.') },
        { id: 'albumColor', element: 'color', label: t('ALBUM_COLOR', 'Album Name Color'), icon: 'album', doc: t('ALBUM_COLOR_DESC', 'Leave empty for theme default.') },
        { id: 'streamInfoColor', element: 'color', label: t('STREAM_INFO_COLOR', 'Stream Info Color'), icon: 'stream', doc: t('STREAM_INFO_COLOR_DESC', 'Leave empty for theme default.') },
        { id: 'buttonColor', element: 'color', label: t('BUTTON_COLOR', 'Control Buttons Icon Color'), icon: 'play_circle', doc: t('BUTTON_COLOR_DESC', 'Override the icon/foreground color of the play, skip back, and skip forward buttons.') },
        { id: 'buttonBgColor', element: 'color', label: t('BUTTON_BG_COLOR', 'Control Buttons Background Color'), icon: 'play_circle', doc: t('BUTTON_BG_COLOR_DESC', 'Override the background color of the play, skip back and skip forward buttons.') },
        { id: 'barTrackColor', element: 'color', label: t('BAR_TRACK_COLOR', 'Progress / Volume Bar Track Color'), icon: 'linear_scale', doc: t('BAR_TRACK_COLOR_DESC', 'Override the background (track/rail) color of the seek bar and volume bar.') },
        { id: 'barTextColor', element: 'color', label: t('BAR_TEXT_COLOR', 'Progress / Volume Text Color'), icon: 'text_fields', doc: t('BAR_TEXT_COLOR_DESC', 'Override the color of time labels and volume value text next to the bars.') },
        { id: 'iconBtnColor', element: 'color', label: t('ICON_BTN_COLOR', 'Icon Button Color'), icon: 'interests', doc: t('ICON_BTN_COLOR_DESC', 'Override the color of secondary icon buttons (shuffle, repeat, favourite, queue, browse).') },
      ],
    },
    {
      id: 'section_idle_screen',
      label: t('IDLE_SCREEN', 'Idle Screen'),
      icon: 'pause_circle',
      method: 'configSaveIdleScreen',
      fields: [
        {
          id: 'idleScreen', element: 'select', label: t('IDLE_SCREEN_TYPE', 'Idle Screen Type'), icon: 'tv',
          doc: t('IDLE_SCREEN_TYPE_DESC', 'Which screen to display when playback is idle.'),
          options: [
            { value: 'analogClock', label: t('IDLE_SCREEN_ANALOG_CLOCK', 'Analog Clock') },
            { value: 'digitalClock', label: t('IDLE_SCREEN_DIGITAL_CLOCK', 'Digital Clock') },
            { value: 'flipClock', label: t('IDLE_SCREEN_FLIP_CLOCK', 'Flip Clock') },
            { value: 'weatherCurrent', label: t('IDLE_SCREEN_WEATHER_CURRENT', 'Weather (Current)') },
            { value: 'weatherHourly', label: t('IDLE_SCREEN_WEATHER_HOURLY', 'Weather (Hourly)') },
            { value: 'weatherDaily', label: t('IDLE_SCREEN_WEATHER_DAILY', 'Weather (Daily)') },
            { value: 'weatherFull', label: t('IDLE_SCREEN_WEATHER_FULL', 'Weather (Full)') },
            { value: 'wallpaper', label: t('IDLE_SCREEN_WALLPAPER', 'Wallpaper') },
            { value: 'externalUrl', label: t('IDLE_SCREEN_EXTERNAL_URL', 'External URL') },
          ],
        },
        { id: 'externalUrl', element: 'input', type: 'text', label: t('EXTERNAL_URL', 'External URL'), icon: 'link', doc: t('EXTERNAL_URL_DESC', 'Full URL to load in an iframe.'), visibleIf: { field: 'idleScreen', value: 'externalUrl' } },
        { id: 'idleTimeout', element: 'knob', label: t('IDLE_TIMEOUT', 'Idle Timeout (minutes)'), icon: 'hourglass_empty', doc: t('IDLE_TIMEOUT_DESC', 'Minutes of inactivity before switching.'), min: 1, max: 60 },
      ],
    },
    {
      id: 'section_clock',
      label: t('CLOCK', 'Clock'),
      icon: 'schedule',
      method: 'configSaveClock',
      fields: [
        { id: 'use24Hour', element: 'switch', label: t('USE_24_HOUR', '24-Hour Time'), icon: 'access_time' },
        { id: 'wallpaperShowSeconds', element: 'switch', label: t('WALLPAPER_SHOW_SECONDS', 'Show Seconds'), icon: 'update' },
        { id: 'showWeatherInClock', element: 'switch', label: t('SHOW_WEATHER_IN_CLOCK', 'Show Weather in Clock'), icon: 'cloud', doc: t('SHOW_WEATHER_IN_CLOCK_DESC', 'Display weather on the clock face.') },
        { id: 'analogClockShowDate', element: 'switch', label: t('ANALOG_CLOCK_SHOW_DATE', 'Show Date on Analog Clock'), icon: 'event' },
      ],
    },
    {
      id: 'section_weather',
      label: t('WEATHER', 'Weather'),
      icon: 'cloud',
      method: 'configSaveWeather',
      fields: [
        { id: 'latitude', element: 'input', type: 'text', label: t('LATITUDE', 'Latitude'), icon: 'explore', doc: t('LATITUDE_DESC', 'e.g. 51.5074 for London') },
        { id: 'longitude', element: 'input', type: 'text', label: t('LONGITUDE', 'Longitude'), icon: 'explore', doc: t('LONGITUDE_DESC', 'e.g. -0.1278 for London') },
        { id: 'weatherApiKey', element: 'input', type: 'text', label: t('WEATHER_API_KEY', 'API Key (Optional)'), icon: 'vpn_key', doc: t('WEATHER_API_KEY_DESC', 'Open-Meteo API key. Free tier does not require one.') },
        { id: 'weatherBackgroundColor', element: 'color', label: t('WEATHER_BACKGROUND_COLOR', 'Weather Background Color'), icon: 'format_color_fill', doc: t('WEATHER_BACKGROUND_COLOR_DESC', 'Override the background color used on all weather screens. Enter a hex code (e.g. #1a2b3c) or leave empty to use the theme default gradients.') },
        {
          id: 'unitSystem', element: 'select', label: t('UNIT_SYSTEM', 'Unit System'), icon: 'straighten',
          options: [
            { value: 'metric', label: t('UNIT_METRIC', 'Metric (°C, km/h)') },
            { value: 'imperial', label: t('UNIT_IMPERIAL', 'Imperial (°F, mph)') },
          ],
        },
      ],
    },
    {
      id: 'section_wallpaper',
      label: t('WALLPAPER', 'Wallpaper'),
      icon: 'wallpaper',
      method: 'configSaveWallpaper',
      fields: [
        { id: 'unsplashApiKey', element: 'input', type: 'text', label: t('UNSPLASH_API_KEY', 'Unsplash API Key'), icon: 'vpn_key' },
        { id: 'wallpaperUrl', element: 'input', type: 'text', label: t('WALLPAPER_URL', 'Wallpaper URL'), icon: 'wallpaper' },
        { id: 'wallpaperShowTime', element: 'switch', label: t('WALLPAPER_SHOW_TIME', 'Show Time on Wallpaper'), icon: 'schedule' },
        { id: 'wallpaperShowWeather', element: 'switch', label: t('WALLPAPER_SHOW_WEATHER', 'Show Weather on Wallpaper'), icon: 'thermostat' },
        { id: 'slideshowInterval', element: 'knob', label: t('SLIDESHOW_INTERVAL', 'Slideshow Interval (seconds)'), icon: 'slideshow', doc: t('SLIDESHOW_INTERVAL_DESC', 'Time between wallpaper transitions.'), min: 5, max: 120 },
      ],
    },
    {
      id: 'section_fonts',
      label: t('FONTS', 'Fonts'),
      icon: 'text_fields',
      method: 'configSaveFonts',
      fields: [
        { id: 'titleFont', element: 'fontrow', nameId: 'titleFontName', sizeId: 'titleFontSize', label: t('TITLE_FONT', 'Track Title'), icon: 'title', nameLabel: t('GOOGLE_FONT_NAME', 'Google Font Name'), nameDoc: t('FONT_NAME_DESC', 'Get custom Google Font from https://fonts.google.com. Example: Nabla, Atomic Age. Leave empty to use the theme default.'), namePlaceholder: 'e.g. Arial', sizeLabel: t('FONT_SIZE', 'Font Size'), sizeDoc: t('TITLE_FONT_SIZE_DESC', 'CSS font size for the track title (e.g. 18px, 1.2rem). Leave empty to use the theme default.'), sizePlaceholder: 'e.g. 18px' },
        { id: 'albumFont', element: 'fontrow', nameId: 'albumFontName', sizeId: 'albumFontSize', label: t('ALBUM_FONT', 'Album Name'), icon: 'album', nameLabel: t('GOOGLE_FONT_NAME', 'Google Font Name'), nameDoc: t('FONT_NAME_DESC', 'Get custom Google Font from https://fonts.google.com. Example: Nabla, Atomic Age. Leave empty to use the theme default.'), namePlaceholder: 'e.g. Arial', sizeLabel: t('FONT_SIZE', 'Font Size'), sizeDoc: t('ALBUM_FONT_SIZE_DESC', 'CSS font size for the album name (e.g. 14px, 1rem). Leave empty to use the theme default.'), sizePlaceholder: 'e.g. 14px' },
        { id: 'artistFont', element: 'fontrow', nameId: 'artistFontName', sizeId: 'artistFontSize', label: t('ARTIST_FONT', 'Artist Name'), icon: 'person', nameLabel: t('GOOGLE_FONT_NAME', 'Google Font Name'), nameDoc: t('FONT_NAME_DESC', 'Get custom Google Font from https://fonts.google.com. Example: Nabla, Atomic Age. Leave empty to use the theme default.'), namePlaceholder: 'e.g. Arial', sizeLabel: t('FONT_SIZE', 'Font Size'), sizeDoc: t('ARTIST_FONT_SIZE_DESC', 'CSS font size for the artist name (e.g. 14px, 1rem). Leave empty to use the theme default.'), sizePlaceholder: 'e.g. 14px' },
        { id: 'bitrateFont', element: 'fontrow', nameId: 'bitrateFontName', sizeId: 'bitrateFontSize', label: t('BITRATE_FONT', 'Bitrate/Stream Info'), icon: 'graphic_eq', nameLabel: t('GOOGLE_FONT_NAME', 'Google Font Name'), nameDoc: t('FONT_NAME_DESC', 'Get custom Google Font from https://fonts.google.com. Example: Nabla, Atomic Age. Leave empty to use the theme default.'), namePlaceholder: 'e.g. Arial', sizeLabel: t('FONT_SIZE', 'Font Size'), sizeDoc: t('BITRATE_FONT_SIZE_DESC', 'CSS font size for bitrate and stream info text (e.g. 12px). Leave empty to use the theme default.'), sizePlaceholder: 'e.g. 12px' },
        { id: 'progressFont', element: 'fontrow', nameId: 'progressFontName', sizeId: 'progressFontSize', label: t('PROGRESS_FONT', 'Progress Bar'), icon: 'linear_scale', nameLabel: t('GOOGLE_FONT_NAME', 'Google Font Name'), nameDoc: t('FONT_NAME_DESC', 'Get custom Google Font from https://fonts.google.com. Example: Nabla, Atomic Age. Leave empty to use the theme default.'), namePlaceholder: 'e.g. Arial', sizeLabel: t('FONT_SIZE', 'Font Size'), sizeDoc: t('PROGRESS_FONT_SIZE_DESC', 'CSS font size for labels near the progress bar (e.g. 12px). Leave empty to use the theme default.'), sizePlaceholder: 'e.g. 12px' },
        { id: 'volumeFont', element: 'fontrow', nameId: 'volumeFontName', sizeId: 'volumeFontSize', label: t('VOLUME_FONT', 'Volume Label'), icon: 'volume_up', nameLabel: t('GOOGLE_FONT_NAME', 'Google Font Name'), nameDoc: t('FONT_NAME_DESC', 'Get custom Google Font from https://fonts.google.com. Example: Nabla, Atomic Age. Leave empty to use the theme default.'), namePlaceholder: 'e.g. Arial', sizeLabel: t('FONT_SIZE', 'Font Size'), sizeDoc: t('VOLUME_FONT_SIZE_DESC', 'CSS font size for the volume label and value (e.g. 12px). Leave empty to use the theme default.'), sizePlaceholder: 'e.g. 12px' },
        { id: 'playerButtonSize', element: 'input', type: 'text', width: '100px', label: t('PLAYER_BUTTON_SIZE', 'Player Button Size'), icon: 'radio_button_checked', doc: t('PLAYER_BUTTON_SIZE_DESC', 'Button size (e.g. 64px). Skip buttons are 75% of this.') },
        { id: 'secondaryRowFontSize', element: 'input', type: 'text', width: '100px', label: t('SECONDARY_ROW_FONT', 'Secondary Controls Icon Size'), icon: 'interests', doc: t('SECONDARY_ROW_FONT_SIZE_DESC', 'CSS font size for secondary control icons (e.g. 16px).') },
      ],
    },
  ];
};

export default getSections;
