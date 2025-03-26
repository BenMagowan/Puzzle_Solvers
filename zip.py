import time

# GRID INDEXES FROM 0 TO N*N-1

# grid = [
#     '.', '.', '.', '.', '.', '.',
#     '.', '1', '.', '.', '.', '.',
#     '.', '4', '.', '.', '.', '.',
#     '.', '.', '.', '.', '3', '.',
#     '.', '.', '.', '.', '2', '.',
#     '.', '.', '.', '.', '.', '.'
# ]

grid = [
    0, 0, 0, 0, 0, 0,
    0, 1, 0, 0, 0, 0,
    0, 4, 0, 0, 0, 0,
    0, 0, 0, 0, 3, 0,
    0, 0, 0, 0, 2, 0,
    0, 0, 0, 0, 0, 0
]

# path = [
#     3, 2, 33, 32, 25, 24,
#     4, 1, 34, 31, 26, 23,
#     5, 36, 35, 30, 27, 22,
#     6, 11, 12, 29, 28, 21,
#     7, 10, 13, 16, 17, 20,
#     8, 9, 14, 15, 18, 19
# ]

path = [
    0, 0, 0, 0, 0, 0,
    0, 1, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0
]

walls = [
    [6, 7],
    [12, 13],
    [18, 19],
    [24, 25],
    [10, 11],
    [16, 17],
    [22, 23],
    [28, 29]    
]

walls.extend([[b, a] for a, b in walls]) # Ugly by works

def display(grid, walls):
    N = 6
    CELL_WIDTH = 3
    # Create a set of frozensets so that order doesn’t matter when checking for a wall.
    wall_set = {frozenset(pair) for pair in walls}

    def has_vertical_wall(r, c):
        """Check if there is a wall between cell (r, c) and (r, c+1)."""
        idx = r * N + c
        idx_right = r * N + (c + 1)
        return frozenset((idx, idx_right)) in wall_set

    def has_horizontal_wall(r, c):
        """Check if there is a wall between cell (r, c) and the cell below it."""
        idx = r * N + c
        idx_below = (r + 1) * N + c
        return frozenset((idx, idx_below)) in wall_set

    def display_border(top=True):
        """Draw the top or bottom border of the grid."""
        left = '┌' if top else '└'
        right = '┐' if top else '┘'
        line = left
        for c in range(N - 1):
            line += '─' * (CELL_WIDTH + 1)
        line += '─' * CELL_WIDTH + right
        print(line)

    # Print the top border.
    display_border(top=True)

    for r in range(N):
        # Build the row showing cell contents with vertical walls.
        row_line = '│'
        for c in range(N):
            idx = r * N + c
            # Display nonzero numbers, space if cell is 0
            cell_text = str(grid[idx]) if grid[idx] != 0 else ' '
            row_line += cell_text.center(CELL_WIDTH)
            if c < N - 1:
                # Check for vertical wall between this cell and the next one.
                row_line += '│' if has_vertical_wall(r, c) else ' '
            else:
                row_line += '│'
        print(row_line)

        # If not the last row, print the horizontal separator line.
        if r < N - 1:
            sep_line = '│'
            for c in range(N):
                # Under the current cell, if there is a wall to the cell below, draw a solid segment.
                sep_line += ('─' * CELL_WIDTH) if has_horizontal_wall(r, c) else (' ' * CELL_WIDTH)
                if c < N - 1:
                    # Between cells, show a vertical intersection if there’s a vertical wall,
                    # otherwise leave a gap.
                    sep_line += '│' if has_vertical_wall(r, c) else ' '
                else:
                    sep_line += '│'
            print(sep_line)

    # Print the bottom border.
    display_border(top=False)

def find_empty_cells(path):
    N = 6

    # Find location of end of path
    end = path.index(max(path))

    empty_cells = []
    # Up
    if end - N >= 0 and path[end - N] == 0 and [end, end-N] not in walls: 
        empty_cells.append(end - N)
    # Down
    if end + N <= N*N-1 and path[end + N] == 0 and [end, end+N] not in walls:
        empty_cells.append(end + N)
    # Left
    if end % N > 0 and path[end - 1] == 0 and [end, end-1] not in walls:
        empty_cells.append(end - 1)
    # Right
    if end % N < N - 1 and path[end + 1] == 0 and [end, end+1] not in walls:
        empty_cells.append(end + 1)
    
    return empty_cells

# Connect the dots in order
# Fill every cell
def is_valid(grid, path):
    N = 6

    # check to dots are connected in order
    # First get the location of the dots in order
    locations = [grid.index(dot) for dot in grid if dot != 0]

    # Order locations based on grid value
    locations.sort(key=lambda x: grid[x])

    # Check if the path is in order
    for i in range(len(locations)-1):
        if path[locations[i+1]] != 0:
            if path[locations[i]] > path[locations[i+1]]:
                return False
            if path[locations[i]] == 0 and path[locations[i+1]] != 0:
                return False
        
    return True

def solve(grid, path):
    N = 6

    next_num = max(path) + 1

    if next_num > N*N:
        return True
    
    empty_cells = find_empty_cells(path)

    if not empty_cells:
        return False
        
    for empty_cell in empty_cells:
        if is_valid(grid, path):
            path[empty_cell] = next_num

            if solve(grid, path):
                return True
                        
            path[empty_cell] = 0  # backtrack

    return False

def create_walls(path, n=6):
    walls = []
    for row in range(n):
        for col in range(n):
            current_index = row * n + col
            # Check right neighbor
            if col < n - 1:
                right_index = row * n + (col + 1)
                if abs(path[current_index] - path[right_index]) > 1:
                    walls.append([current_index, right_index])
            # Check bottom neighbor
            if row < n - 1:
                down_index = (row + 1) * n + col
                if abs(path[current_index] - path[down_index]) > 1:
                    walls.append([current_index, down_index])
    return walls

display(grid, walls)
start = time.time()
if solve(grid, path):
    print(f'Solution found in {time.time() - start:.2f} seconds!')
    # walls = create_walls(path)
    display(path, walls)
else:
    print('No solution found!')
    