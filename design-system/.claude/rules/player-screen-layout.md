# Rules for Player screen layouts across all themes

## Sections

- Track Info section
  - Contains (1 per row, equally spaced between them)
    - Track Title (large display font)
    - Artist (medium secondary font) slightly muted color
    - Album name (medium secondary font) slightly muted color
    - Stream info (slightly muted color)
      - Stream Logo, sample rate (with gap between them)
  - Equal padding inside it.
  - Equal margins all around it so it doesn't touch the screen edges.
  - Equal spacing between rows
  - UIConfig setting for enabling theme specific background, border. All themes should have a panel on / off styles
- Player controls section (4 rows, equally space between them)
  - Seek bar, 100% width
    - track progress time on left edge
    - track total time or remaining time (depending on the config setting) on right edge
    - Enough spacing so that the text on bottom is not hidden by the slider knob
  - Play / pause, back, next buttons. The Play button will be larger than the other 2 by 25%
  - Shuffle, repeat, add to playlist, add to fav, queue, browse button row, slightly smaller buttons that the above skip/next buttons, icon only no borders or bg, just hover text effects
  - Volume slider
    - right edge - current volume /  100
    - volume button on left - size is same as the row above
- Player area section
  - Inside contents like Album art, etc, uses maximum available space with some margin around it

## Layouts

- All screens should have reponsive padding so no areas are clipped
- All areas should have responsive margins on all sides
- Small Desktops (<1920 width) and Tablets (landscape only)
  - Divide into 2 rows
    - Row 1 (divide into 2 columns equally, 75% height )
      - Player area on left column
      - Right column, 5 rows, equal vertical gap
        - Track panel (40% height of parent)
        - Seek bar (15% height of parent)
        - Player control buttons (15%)
        - Secondary button row (15%)
        - Volume slider (15%)
    - Row 2 (25% height)
      - Visualizations across the entire row
- Mobile screens
  - Layout top to bottom, only 1 column (equal vertical gap)
    - Row 1 (uses remaining height)
      - Player (make album art take as much space in the parent container without touching the edges.)
    - Row 2  (uses 10% of the height)
      - Vizualizations
    - Row 3 (uses max 20%)
      - Track info panel area
      - Make title, album, artist, and stream info fonts smaller so that the track panel when enabled doesn't overlap above or below elements. 
      - All rows equally spaced.
    - Row 4 (uses 10% height)
      - Track Seek bar (uses less vertical space, make sure there is enough heigh for the labels so they don't touch the slider knob). Font's should not be too small.
    - Row 5 (uses 10% height)
      - Play / Pause + Back + Next buttons (uses more vertical space).
    - Row 6 (uses 10% height)
      - Fav / Add to playlist / Shuffle / Repeat other buttons
    - Row 7 Volume seek bar (10% height)
      - same rules as the seekbar.
    - When any rows is hidden the height should be equally divided among other visible rows.

* Large Desktops and Ultra Wide screens (>=1920w)
  - 2 rows
    - Row 1 (aligned to top), divided into 4 rows
      1. Left edge: Track title - large title font - Right edge: Service logo
      2. Artist - smaller secondary font
      3. Album - smaller secondary font
      4. Stream info - same size as above 2\
         (Equal spacing between these 4 rows)
    - Row 2 (aligned to bottom) divided into 3 rows
      - Row 1
        - Left 50% Player area
        - Right 50% Visualization
      - Row 2 - track progress (full width)
      - Row 3
        - Context menu button left edge
        - Repeat, Player buttons, Shuffle - Middle
        - Fav, Add to Playlist, queue, Browser, Volume button on right edge
        - Volume button should open vertical volume slider as it currently does.

### AlbumArtMaxSpace setting

When this setting is on, same rules apply as above ***except***

- Album art should take all space in the parent container as it currently does
- All fonts take up maximum width, without clipping, margins and padding minimized, but still readable
- This setting only affects small desktop and tablet screens. It doesn't affect larger or mobile screens.

## General rules

All fonts, buttons, icon sizes, slider areas, players, vizualiztions should be responsive, no clipping, equal spacing among them (unless otherwise specified for screen specific layouts)

Context menu button on top left corner, except large >= 1920 screens where it's specified in the above section rules.
