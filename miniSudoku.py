import time


def display(grid):
    for i in range(6):
        if i % 2 == 0 and i != 0:
            print("─" * 6 + "┼" + "─" * 7)
        for j in range(6):
            if j % 3 == 0 and j != 0:
                print("│", end=" ")
            print(grid[i * 6 + j], end=" ")
        print()


def find_empty(grid):
    for i, value in enumerate(grid):
        if value == ".":
            return i
    return -1


def is_valid(grid, pos, num):
    row = pos // 6
    col = pos % 6

    # Check row and column
    for i in range(6):
        if grid[row * 6 + i] == num:
            return False
        if grid[i * 6 + col] == num:
            return False

    # Check 3x2 grid
    start_row = row - (row % 2)
    start_col = col - (col % 3)

    for i in range(2):
        for j in range(3):
            if grid[(start_row + i) * 6 + (start_col + j)] == num:
                return False

    return True


def solve(grid):
    pos = find_empty(grid)

    if pos == -1:
        return True

    for num in range(1, 7):
        if is_valid(grid, pos, str(num)):
            grid[pos] = str(num)

            if solve(grid):
                return True

            grid[pos] = "."

    return False


# Initialize grid
grid = list("..1....2.3..4...2..5...6..3.6....5..")

display(grid)
start_time = time.time()
if solve(grid):
    print(f"Time taken: {time.time() - start_time:.2f} seconds")
    display(grid)
else:
    print("No solution exists")
