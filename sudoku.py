import time

def display(grid):
    for i in range(9):
        if i % 3 == 0 and i != 0:
            print('-'*6+'+'+'-'*7+'+'+'-'*6)
        for j in range(9):
            if j % 3 == 0 and j != 0:
                print('|', end=' ')
            print(grid[i*9 + j], end=' ')
        print()

def find_empty(grid):
    for i, value in enumerate(grid):
        if value == '.':
            return i
    return -1

def is_valid(grid, pos, num):
    row = pos // 9
    col = pos % 9

    # Check row and column
    for i in range(9):
        if grid[row*9 + i] == num:
            return False
        if grid[i*9 + col] == num:
            return False

    # Check 3x3 grid
    start_row = row - row % 3
    start_col = col - col % 3

    for i in range(3):
        for j in range(3):
            if grid[(start_row + i)*9 + (start_col + j)] == num:
                return False

    return True

def solve(grid):
    pos = find_empty(grid)

    if pos == -1:
        return True

    for num in range(1, 10):
        if is_valid(grid, pos, str(num)):
            grid[pos] = str(num)

            if solve(grid):
                return True

            grid[pos] = '.'
            
    return False

# Initialize grid
# grid = list('4.....8.5.3..........7......2.....6.....8.4......1.......6.3.7.5..2.....1.4......')
grid = list('...............9..97.3......1..6.5....47.8..2.....2..6.31..4......8..167.87......')
# grid = list('.................................................................................')

display(grid)
start_time = time.time()
if solve(grid):
    print(f'Time taken: {time.time() - start_time:.2f} seconds')
    display(grid)
else:
    print('No solution exists')
