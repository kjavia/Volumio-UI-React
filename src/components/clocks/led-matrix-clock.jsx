import { useState, useEffect, memo } from 'react';
import { useTranslation } from 'react-i18next';
import useWeather from '@/hooks/useWeather';
import './led-matrix-clock.scss';

/**
 * 5×7 dot-matrix font for the ten digits. Each digit is an array of 7
 * rows, and each row is a 5-bit integer — bit 4 = leftmost column,
 * bit 0 = rightmost. `renderDots()` walks columns left → right by
 * shifting the appropriate bit into the low position.
 *
 *   Row bit layout (columns): 4 3 2 1 0
 *   Example — digit 1:
 *     . . X . .  0b00100
 *     . X X . .  0b01100
 *     X . X . .  0b10100
 *     . . X . .  0b00100
 *     . . X . .  0b00100
 *     . . X . .  0b00100
 *     X X X X X  0b11111
 */
const DIGIT_FONT = {
    '0': [0b11111, 0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b11111],
    '1': [0b00100, 0b01100, 0b10100, 0b00100, 0b00100, 0b00100, 0b11111],
    '2': [0b11111, 0b00001, 0b00001, 0b11111, 0b10000, 0b10000, 0b11111],
    '3': [0b11111, 0b00001, 0b00001, 0b11111, 0b00001, 0b00001, 0b11111],
    '4': [0b10001, 0b10001, 0b10001, 0b11111, 0b00001, 0b00001, 0b00001],
    '5': [0b11111, 0b10000, 0b10000, 0b11111, 0b00001, 0b00001, 0b11111],
    '6': [0b11111, 0b10000, 0b10000, 0b11111, 0b10001, 0b10001, 0b11111],
    '7': [0b11111, 0b00001, 0b00010, 0b00100, 0b01000, 0b10000, 0b10000],
    '8': [0b11111, 0b10001, 0b10001, 0b11111, 0b10001, 0b10001, 0b11111],
    '9': [0b11111, 0b10001, 0b10001, 0b11111, 0b00001, 0b00001, 0b11111],
};

// 1-column-wide colon glyph (7 rows), rendered as two stacked dots.
const COLON_COL = [0, 1, 1, 0, 1, 1, 0];

const DIGIT_COLS = 5;
const DIGIT_ROWS = 7;

const DotDigit = memo(({ char }) => {
    const rows = DIGIT_FONT[char] || DIGIT_FONT['0'];
    const dots = [];
    for (let r = 0; r < DIGIT_ROWS; r++) {
        for (let c = 0; c < DIGIT_COLS; c++) {
            const on = (rows[r] >> (DIGIT_COLS - 1 - c)) & 1;
            dots.push(<span key={`${r}-${c}`} className={`lmc-dot${on ? ' on' : ''}`} />);
        }
    }
    return <div className="lmc-digit" data-char={char}>{dots}</div>;
});
DotDigit.displayName = 'DotDigit';

const DotColon = memo(({ blink = false }) => (
    <div className={`lmc-digit lmc-digit--colon${blink ? ' lmc-digit--blink' : ''}`}>
        {COLON_COL.map((on, r) => (
            <span key={r} className={`lmc-dot${on ? ' on' : ''}`} />
        ))}
    </div>
));
DotColon.displayName = 'DotColon';

const LedMatrixClock = ({ showSeconds = true, use12Hour = true, showWeather = false }) => {
    const { i18n } = useTranslation();
    const { data: weather } = useWeather();
    const [time, setTime] = useState(() => new Date());

    useEffect(() => {
        let intervalId;
        const tick = () => setTime(new Date());
        // Sync to the next second boundary so the seconds digit flips on
        // the actual clock tick (matches digital-clock behaviour).
        const msToNextSecond = 1000 - new Date().getMilliseconds();
        const syncTimeout = setTimeout(() => {
            tick();
            intervalId = setInterval(tick, showSeconds ? 1000 : 60000);
        }, msToNextSecond);
        return () => {
            clearTimeout(syncTimeout);
            if (intervalId) clearInterval(intervalId);
        };
    }, [showSeconds]);

    let hours = time.getHours();
    const minutes = time.getMinutes();
    const seconds = time.getSeconds();

    let ampm = '';
    if (use12Hour) {
        ampm = new Intl.DateTimeFormat(i18n.language, { hour: 'numeric', hour12: true })
            .formatToParts(time)
            .find((p) => p.type === 'dayPeriod')?.value ?? (hours >= 12 ? 'PM' : 'AM');
        hours = hours % 12 || 12;
    }

    const h = String(hours).padStart(2, '0');
    const m = String(minutes).padStart(2, '0');
    const s = String(seconds).padStart(2, '0');

    const dateString = time.toLocaleDateString(i18n.language, {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    }).toUpperCase();

    const wrapperClass = [
        'led-matrix-clock',
        !showSeconds && 'led-matrix-clock--no-seconds',
        !use12Hour && 'led-matrix-clock--no-ampm',
    ].filter(Boolean).join(' ');

    return (
        <div className={wrapperClass}>
            <div className="lmc-panel">
                <div className="lmc-time">
                    <DotDigit char={h[0]} />
                    <DotDigit char={h[1]} />
                    <DotColon blink={!showSeconds} />
                    <DotDigit char={m[0]} />
                    <DotDigit char={m[1]} />
                    {showSeconds && (
                        <>
                            <DotColon />
                            <DotDigit char={s[0]} />
                            <DotDigit char={s[1]} />
                        </>
                    )}
                    {use12Hour && <span className="lmc-ampm">{ampm}</span>}
                </div>
                <div className="lmc-info">
                    <span className="lmc-date">{dateString}</span>
                    {showWeather && weather?.current && (
                        <span className="lmc-weather">
                            <span className="material-icons lmc-weather-icon">{weather.current.icon}</span>
                            <span className="lmc-weather-temp">
                                {Math.round(weather.current.temperature)}
                                {weather.units.tempUnit}
                            </span>
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LedMatrixClock;
