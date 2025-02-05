import time

def display(GRID, QUEENS):
    N = 8
    CELL_WIDTH = 4  # adjust as needed for spacing

    ROWS = [GRID[i * N:(i + 1) * N] for i in range(N)]
    QUEEN_POSITIONS = [QUEENS[i * N:(i + 1) * N] for i in range(N)]

    def get_corner(i, row, previous_row):
        if previous_row is None:
            return "+" if i == 0 or row[i] != row[i - 1] else "-"
        if previous_row[i - 1] == row[i - 1] and previous_row[i] == row[i] and row[i - 1] == row[i]:
            return " "
        if i == 0 or previous_row[i - 1] == row[i - 1] and previous_row[i] == row[i]:
            return "|"
        if previous_row[i] == previous_row[i - 1] and row[i] == row[i - 1]:
            return "-"
        return "+"

    def print_border(row, previous_row):
        border = ""
        for i in range(N):
            corner = get_corner(i, row, previous_row)
            if previous_row is None or previous_row[i] != row[i]:
                border += corner + "-" * CELL_WIDTH
            else:
                border += corner + " " * CELL_WIDTH
        border += "+" if previous_row is None or row[-1] != previous_row[-1] else "|"
        print(border)

    def print_content(row, queen_row):
        line = "|"
        for i, cell in enumerate(row):
            line += " Q " + " " if queen_row[i] == 'Q' else " " * CELL_WIDTH
            if i < N - 1:
                line += "|" if row[i] != row[i + 1] else " "
        line += "|"
        print(line)

    def print_grid(rows, queen_positions):
        previous_row = None
        for row, queen_row in zip(rows, queen_positions):
            print_border(row, previous_row)
            print_content(row, queen_row)
            previous_row = row
        print_final_border(rows[-1])

    def print_final_border(last_row):
        line = "+" + "-" * CELL_WIDTH
        for i in range(1, N):
            if last_row[i - 1] == last_row[i]:
                line += "-" * (CELL_WIDTH + 1)
            else:
                line += "+" + "-" * CELL_WIDTH
        print(line + "+")

    print_grid(ROWS, QUEEN_POSITIONS)

def find_empty_colour(GRID, QUEENS):
    colours = set(GRID)
    sorted_colours = sorted(colours, key=lambda c: GRID.count(c))
    for colour in sorted_colours:
        found = True
        for i in range(len(GRID)):
            if GRID[i] == colour and QUEENS[i] == 'Q':
                found = False
                break
        if found:
            return colour
    return None

def is_valid(GRID, QUEENS, i, colour):
    N = 8
    # Check cell matches colour
    if GRID[i] != colour:
        return False
    
    # Check no queens in the same colour
    for j in range(len(GRID)):
        if QUEENS[j] == 'Q' and GRID[j] == GRID[i]:
            return False

    # Check no queens in the same row
    if 'Q' in QUEENS[i - i % N:i - i % N + N]:
        return False

    # Check no queens in the same column
    if 'Q' in QUEENS[i % N::N]:
        return False

    # Check no two queens in a 3x3 area
    row, col = divmod(i, N)
    for r in range(row - 1, row + 2):
        for c in range(col - 1, col + 2):
            if 0 <= r < N and 0 <= c < N and QUEENS[r * N + c] == 'Q':
                return False

    return True

def solve(GRID, QUEENS):
    colour = find_empty_colour(GRID, QUEENS)

    if colour is None:
        return True
    
    for i in range(len(GRID)):
        if is_valid(GRID, QUEENS, i, colour):
            QUEENS[i] = 'Q'

            if solve(GRID, QUEENS):
                return True

            QUEENS[i] = '.'  # backtrack
    return False

GRID = list('1111222213334242113444441134545413335456177758561717555611177666')
QUEENS = list('................................................................')

# Main execution
display(GRID, QUEENS)
start_time = time.time()
if solve(GRID, QUEENS):
    print("Solution found in %.2f seconds" % (time.time() - start_time))
    display(GRID, QUEENS)
else:
    print("No solution found")
