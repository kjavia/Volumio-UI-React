import { useRef, useState, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import './AlphabetScroller.scss';

const ALPHABET = ['#', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];

/**
 * AlphabetScroller — vertical strip for fast-scrolling through sorted lists.
 *
 * Renders a column of labels on the right side. When the user touches/drags
 * vertically, the active label enlarges and onSelect fires with the label.
 *
 * @param {string[]} props.labels — custom labels to display (defaults to A-Z + #)
 * @param {string[]} props.availableLetters — labels that exist in the list (others appear dimmed)
 * @param {function} props.onSelect — called with the label when the user drags over it
 */
const AlphabetScroller = ({ labels = ALPHABET, availableLetters, onSelect }) => {
  const displayLabels = labels;
  const containerRef = useRef(null);
  const [activeLetter, setActiveLetter] = useState(null);
  const [dragging, setDragging] = useState(false);

  const availableSet = useMemo(() => new Set(availableLetters), [availableLetters]);

  const getLetterFromY = useCallback((clientY) => {
    const el = containerRef.current;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    const y = clientY - rect.top;
    const ratio = Math.max(0, Math.min(1, y / rect.height));
    const idx = Math.min(Math.floor(ratio * displayLabels.length), displayLabels.length - 1);
    return displayLabels[idx];
  }, [displayLabels]);

  const selectLetter = useCallback((letter) => {
    if (!letter || letter === activeLetter) return;
    setActiveLetter(letter);
    onSelect?.(letter);
  }, [activeLetter, onSelect]);

  // Mouse events
  const handleMouseDown = useCallback((e) => {
    e.preventDefault();
    setDragging(true);
    const letter = getLetterFromY(e.clientY);
    selectLetter(letter);
  }, [getLetterFromY, selectLetter]);

  const handleMouseMove = useCallback((e) => {
    if (!dragging) return;
    e.preventDefault();
    const letter = getLetterFromY(e.clientY);
    selectLetter(letter);
  }, [dragging, getLetterFromY, selectLetter]);

  const handleMouseUp = useCallback(() => {
    setDragging(false);
    setActiveLetter(null);
  }, []);

  // Touch events
  const handleTouchStart = useCallback((e) => {
    e.preventDefault();
    setDragging(true);
    const touch = e.touches[0];
    const letter = getLetterFromY(touch.clientY);
    selectLetter(letter);
  }, [getLetterFromY, selectLetter]);

  const handleTouchMove = useCallback((e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const letter = getLetterFromY(touch.clientY);
    selectLetter(letter);
  }, [getLetterFromY, selectLetter]);

  const handleTouchEnd = useCallback(() => {
    setDragging(false);
    setActiveLetter(null);
  }, []);

  return (
    <div
      ref={containerRef}
      className={`alphabet-scroller${dragging ? ' alphabet-scroller--active' : ''}`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      role="navigation"
      aria-label="Alphabet quick scroll"
    >
      {displayLabels.map((letter) => {
        const isActive = activeLetter === letter;
        const isAvailable = availableSet.has(letter);
        return (
          <div
            key={letter}
            className={[
              'alphabet-scroller__letter',
              isActive ? 'alphabet-scroller__letter--active' : '',
              !isAvailable ? 'alphabet-scroller__letter--dim' : '',
            ].join(' ')}
          >
            {letter}
          </div>
        );
      })}
      {dragging && activeLetter && (
        <div className="alphabet-scroller__bubble">
          {activeLetter}
        </div>
      )}
    </div>
  );
};

AlphabetScroller.propTypes = {
  labels: PropTypes.arrayOf(PropTypes.string),
  availableLetters: PropTypes.arrayOf(PropTypes.string),
  onSelect: PropTypes.func.isRequired,
};

AlphabetScroller.defaultProps = {
  labels: ALPHABET,
  availableLetters: ALPHABET,
};

export default AlphabetScroller;
