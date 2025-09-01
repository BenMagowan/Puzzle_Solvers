# LinkedIn Puzzle Solver

A Chrome extension that automatically solves LinkedIn Games puzzles and displays visual solution hints directly on the game board.

## Supported Puzzles

-   **Queens**
-   **Zip**
-   **Tango**
-   **Mini Sudoku**

## Features

-   Automatic puzzle detection and solving
-   Visual overlay showing solutions
-   Individual puzzle solver toggle (enable/disable specific games)
-   Solution caching for improved performance
-   Real-time grid monitoring for dynamic updates
-   Non-intrusive interface that doesn't interfere with gameplay

## Installation

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension folder
5. The extension will appear in your browser toolbar

## Usage

1. Navigate to any LinkedIn Games puzzle: `https://www.linkedin.com/games/`
2. The extension automatically detects the puzzle type and displays solution hints
3. Overlays indicate suggested moves
4. Use the extension popup to enable/disable specific puzzle solvers

## How It Works

The extension uses:

-   **Content Scripts** to read puzzle state from LinkedIn's DOM
-   **Background Scripts** to solve puzzles using custom algorithms
-   **Mutation Observers** to detect grid changes and update solutions
-   **Chrome Storage** to cache solutions and store user preferences

## Contributing

Feel free to submit issues or pull requests to improve the puzzle solving algorithms or add support for new LinkedIn games.
