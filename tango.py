import time

# 0 = empty 1 = sun 2 = moon
grid = [
    0, 0, 0, 0, 0, 0,
    2, 0, 0, 0, 0, 0,   
    1, 0, 0, 2, 0, 0,
    0, 0, 2, 0, 0, 0,
    0, 0, 0, 0, 0, 2,
    0, 0, 0, 0, 0, 0
]

same_type = [
    [7, 8],
    [22, 23],
    [27, 28]
]

same_type.extend([[b, a] for a, b in same_type])

opposite_type = [
    [12, 13]
]

opposite_type.extend([[b, a] for a, b in opposite_type])


def display(grid, same_type, opposite_type):
    N = 6
    CELL_WIDTH = 3
    # Display top
    print('┌' + ('─'*CELL_WIDTH + '┬')*(N-1) + '─'*CELL_WIDTH + '┐')
    
    for i in range(N):
        # Display content
        print('│', end='')
        for j in range(N):
            print(' ' + ('☀' if grid[i*N + j] == 1 else '☽' if grid[i*N + j] == 2 else ' ') + ' ' * (CELL_WIDTH - 2) + ('=' if [i*N+j, i*N+j+1] in same_type else 'x' if [i*N+j, i*N+j+1] in opposite_type else '│'), end='')
        print()

        # Display separator
        if i != N - 1:
            print('├', end='')
            for j in range(N):
                print(('─' + ('=' if [i*N+j, (i+1)*N+j] in same_type else 'x' if [i*N+j, (i+1)*N+j] in opposite_type else '─') + '─'*(CELL_WIDTH-2)) + ('┤' if j == N-1 else '┼') , end='')
            print()

    # Display bottom
    print('└' + ('─'*CELL_WIDTH + '┴')*(N-1) + '─'*CELL_WIDTH + '┘')

def find_empty(grid):
    for i, value in enumerate(grid):
        if value == 0:
            return i
    return -1

def is_valid(grid, same_type, opposite_type):
    N = 6
    # Check if more then 2 suns or moons are in a row
    for i in range(N):
        for j in range(N-2):
            if grid[i*N + j] == grid[i*N + j+1] == grid[i*N + j+2] != 0:
                return False
        
    # Check if more then 2 suns or moons are in a column
    for i in range(N):
        for j in range(N-2):
            if grid[j*N + i] == grid[(j+1)*N + i] == grid[(j+2)*N + i] != 0:
                return False
            
    # Check same types
    for a, b in same_type:
        if grid[a] != 0 and grid[b] != 0 and grid[a] != grid[b]:
            return False
        
    # Check opposite types
    for a, b in opposite_type:
        if grid[a] != 0 and grid[b] != 0 and grid[a] == grid[b]:
            return False
        
    # Check if more then 3 suns or moons total are in a row
    for i in range(N):
        if grid[i*N:i*N+N].count(1) > 3 or grid[i*N:i*N+N].count(2) > 3:
            return False
        
    # Check if more then 3 suns or moons total are in a column
    for i in range(N):
        if [grid[j*N + i] for j in range(N)].count(1) > 3 or [grid[j*N + i] for j in range(N)].count(2) > 3:
            return False
        
    return True

def solve(grid, same_type, opposite_type):
    N = 6

    pos = find_empty(grid)

    if pos == -1:
        return True

    for num in range(1, 3):
        grid[pos] = num

        if is_valid(grid, same_type, opposite_type):
            if solve(grid, same_type, opposite_type):
                return True

        grid[pos] = 0

    return False

display(grid, same_type, opposite_type)
start_time = time.time()
if (solve(grid, same_type, opposite_type)):
    print(f'Solution found in {time.time() - start_time} seconds')
    display(grid, same_type, opposite_type)
else:
    print('No solution found!')
