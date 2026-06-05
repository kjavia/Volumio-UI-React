### Layout Designer

Short description: A page in Stylish player plugin for users to visually design screen resolution specific layouts for the player screens.  Layout screen should use standard theme colors and UI elements, and no overides for font colors, sizes, etc. Use theme specific dark bg, with lighter text and borders for contrast. 

Scope:

1. Allow users to create one or more named layouts for each screen resolution (for example 800x600px or 1920x1080px etc.
2. Each layout will have a name unique to the resolution. Before creating ask user to entre Name, Width (px), Height (px).
3. Once created, user can edit name, width, or height and there will be a save button to save the layout. 
4. List all resolutions in a dropdown, let user select one from the dropdown to modify that screen. Next to dropdown, show buttons for editing Layout screen, deleting layout (with confirmation), setting the layout to default.
5. Once a layout is saved, open the layout on a floating dialog box with a toolbar on the same screen.
6. Initially the layout will have a single parent element representing the empty layout screen, with 1 cell inside initially created taking up 100% of space. 
7. Use grid layout for the screen structure, allow user to select one or more adjacent cells by clicking on it. 
8. Once a cell is selected, apply selected styles to the cell to diffrentiate between selected and unselected cells.
9. Toolbar will have buttons as follows:
   1. Split Cell into rows (enabled when only 1 cell is selected)
   2. Split Cell into columns (enabled when only 1 cell is selected)
   3. Merge cells (enabled when 2 or more adjacent cells are selected)
   4. Clear cell (removes any component assigned to the cell)
   5. When a cell with an item is selected, show buttons (grouped) to align the item in the cell using flexbox (all possible directions). 
   6. Close dialog.
10. Right clicking on cell should show a context menu with Add Item sub menu with the list of following items that the user can add to a cell (1 per cell). There should already be React components already defined for each item, if not 
    1. Track Title
    2. Album Name
    3. Artist Name
    4. Bitrate / Sample Rate (stream info)
    5. Service logo
    6. Player buttons (Skip, Play)
    7. Volume slider horizontal
    8. Volume button (with vertical slider)
    9. Track progress bar
    10. Control buttons (add to favorites, queue,  browse etc)
    11. Visualization (Peppy / Spectrum etc)
    12. Player (Vinyl / CD etc).
11. Each cell can be resized horizontally or vertically by dragging the boder.
12. Splitting a cell should not affect other cells. As we are using a CSS grid for layout, each cell can be sized independantly. 
13. All changes should be instantly saved on the plugin config.
14. Once an item is already added to any cell, the item should be removed from the context menu. Removing the item from the cell, should bring back the item in the context menu.
15. Add a new boolean Config setting called useCustomLayout (false by default). When enabled, the player screen will use a CustomPlayer.jsx component instead of current responsive player components. This CustomPlayer component will use the saved layouts matching the current screen resolutions, get the default layout, and dynamically create the layout based on the layout definition. If no layout matching the screen resolution is found, use standard responsive player.
