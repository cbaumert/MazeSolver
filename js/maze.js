/*
 * This is an enumerated type to hold the types of cells required to represent a maze.
 */
MazeCellTypes = {
	WALL: '#',
	PASSAGEWAY: ' ',
	SOLUTION: '@',
	FRONTIER: 'F',
	VISITED: 'V',
}

class MazeCell {
	constructor(row, col, type) {
		this.row = row;
		this.col = col;
		this.type = type;
		// only used by Dijkstra's and A*
		this.priority = Infinity;
	}

	projection() {
		/*
		 * The projection function returns a string stating what kind of cell is coming up,
		 * with the cell type in all caps. This is somewhat similar to Java's enums and how
		 * you can customize their toString() methods.
		 */
		var projection = '';
		if (this.type === MazeCellTypes.WALL) {
			projection = "WALL cell at "
		}
		// a cell doesn't stop being a passageway when it becomes part of a solution.
		else if (this.type === MazeCellTypes.PASSAGEWAY || this.type === MazeCellTypes.SOLUTION) {
			projection = "PASSAGEWAY cell at "
		}
		projection += '[' + this.row + ',' + this.col + ']';
		return projection;
	}
}

class Maze {
	/* 
	 *this function constructs the maze object, and accepts an argument,
	 * plainTextMaze, which is an nxn string representation of a maze
	 * with each cell described by single-character MazeCellTypes.
	 */

	constructor(plainTextMaze) {
		// The Maze constructor creates mazes using a 2D array of chars.

		// split the string into rows
		this.maze = plainTextMaze.split('\n')

		for (var i = 0; i < this.maze.length; i++) {
			// store each row as a char array
			this.maze[i] = this.maze[i].split('');

			for (var j = 0; j < this.maze[i].length; j++) {
				var type = this.maze[i][j];
				this.maze[i][j] = new MazeCell(i, j, type);
			}
		}

		/*
		 * The start and end locations are hardcoded to ensure that the algorithm works as
		 * expected and the beginning/end aren't in the middle of the maze somewhere.
		 */
		this.start = this.maze[1][0];
		this.destination = this.maze[this.maze.length - 2][this.maze[0].length - 1];
	}

	/*
	 * this function determines whether the argument cell meets the destination criteria
	 */
	destinationPredicate(cell) {
		/*
		 * The destination predicate function checks that a given cell meets the destination criteria,
		 * and returns the relevant boolean value. i.e., it checks that the destination row and column
		 * are equal to the given cell's row and column.
		 */
		if (this.destination.row === cell.row && this.destination.col == cell.col)
			return true;
		else
			return false;
	}

	/*
	 * this function returns all of the neighbors of the argument cell (it does not
	 * check whether those neighbors have been visited)
	 */
	getNeighbors(cell) {
		/*
		 * Neighbors were originally added to the neighbors array in order of:
		 * top -> left -> bottom -> right (counterclockwise).
		 *
		 * This was changed to go right -> bottom -> left -> top because the start of the maze is always
		 * in the upper left, and the end is always in the bottom right. This means that top and left will
		 * rarely be the correct directions. Thus, they should be checked last.
		 */
		var neighbors = [];

		// checks the right direction
		if (cell.col + 1 < this.maze[cell.row].length &&
			this.maze[cell.row][cell.col + 1].type === MazeCellTypes.PASSAGEWAY) {
			neighbors.push(this.maze[cell.row][cell.col + 1]);
		}

		// checks the bottom direction
		if (cell.row + 1 < this.maze.length &&
			this.maze[cell.row + 1][cell.col].type === MazeCellTypes.PASSAGEWAY) {
			neighbors.push(this.maze[cell.row + 1][cell.col])
		}

		// checks the left direction
		if (cell.col - 1 >= 0 &&
			this.maze[cell.row][cell.col - 1].type === MazeCellTypes.PASSAGEWAY) {
			neighbors.push(this.maze[cell.row][cell.col - 1]);
		}

		// checks the vertical direction
		if (cell.row - 1 >= 0 &&
			this.maze[cell.row - 1][cell.col].type === MazeCellTypes.PASSAGEWAY) {
			neighbors.push(this.maze[cell.row - 1][cell.col]);
		}

		return neighbors;
	}


	/*
	 * this function uses a breadth first search to solve the maze. When the solution
	 * is found, the function modifies the maze by marking each cell of the solution
	 * with the type MazeCellTypes.SOLUTION. 
	 */
	solveMazeBFS() {
		// create the queue to hold the cells we have visited but need
		// to return to explore (we will treat the array like a queue)
		var frontier = new Array()
		frontier.push(this.start);

		// create a set to hold the cells we have visited and add the 
		// first element
		var visited = new Set();
		visited.add(this.start.projection())

		// create a map to hold cells to parents, set first element's
		// parents as false (is source cell). Generally, the parents
		// map will have projection values as keys and objects as values.

		/*
		 * The parents map maps cells to their parents, with the first cell's parents as false
		 * (the "parents" are the cells visited directly prior). The keys in this situation
		 * are projection values for the cells, and the objects are normal values. This variable
		 * is necessary so that once the end is reached, the map can be backtracked in order to get
		 * the maze solution.
		 */
		var parents = new Array();
		parents[this.start.projection()] = false;

		// search and continue searching  while there are still items in the queue
		while (frontier.length >= 1) {

			// get the next element in the queue
			var current = frontier.shift();

			// mark the next element as visited
			current.type = MazeCellTypes.VISITED;

			// test to see if it meets the destination criteria
			if (this.destinationPredicate(current)) {
				// we've reached the destination! Awesome!
				break;
			}

			// get the neighbors of the current cell (passageways)
			var neighbors = this.getNeighbors(current);

			// one by one, add neighbors to the queue
			for (var i = 0; i < neighbors.length; i++) {

				var neighbor = neighbors[i].projection();

				// see if we've already visited this cell
				if (!visited.has(neighbor)) {
					// if we haven't,  add it to the visited set
					visited.add(neighbor);
					// add current as the neighbor's parent
					parents[neighbor] = current;
					// add the neighbor to the queue
					frontier.push(neighbors[i])
						// set the neighbor to have a "frotier" type
					neighbors[i].type = MazeCellTypes.FRONTIER;
				}
			}
		}

		// backtrack through each cell's parent and set path cells to type
		// solution
		while (current) {
			current.type = MazeCellTypes.SOLUTION;
			current = parents[current.projection()];
		}
	}

	/*
	 * this function uses a depth first search to solve the maze. When the solution
	 * is found, the function modifies the maze by marking each cell of the solution
	 * with the type MazeCellTypes.SOLUTION. 
	 */
	solveMazeDFS() {
		// create the stack to hold the cells we have visited but need
		// to return to explore (we will treat the array like a stack)
		var frontier = new Array()
		frontier.push(this.start);

		// create a set to hold the cells we have visited and add the
		// first element
		var visited = new Set();
		visited.add(this.start.projection())

		// create a map to hold cells to parents, set first element's
		// parents as false (is source cell). Generally, the parents
		// map will have projection values as keys and objects as values.
		var parents = new Array();
		parents[this.start.projection()] = false;

		// search and continue searching  while there are still items in the queue
		while (frontier.length >= 1) {

			// get the next element in the queue
			var current = frontier.pop();

			// mark the next element as visited
			current.type = MazeCellTypes.VISITED;

			// test to see if it meets the destination criteria
			if (this.destinationPredicate(current)) {
				// we've reached the destination! Awesome!
				break;
			}

			// get the neighbors of the current cell (passageways)
			var neighbors = this.getNeighbors(current);

			// one by one, add neighbors to the stack
			for (var i = 0; i < neighbors.length; i++) {

				var neighbor = neighbors[i].projection();

				// see if we've already visited this cell
				if (!visited.has(neighbor)) {
					// if we haven't, add it to the visited set
					visited.add(neighbor);
					// add current as the neighbor's parent
					parents[neighbor] = current;
					// add the neighbor to the stack
					frontier.push(neighbors[i])
					// set the neighbor to have a "frotier" type
					neighbors[i].type = MazeCellTypes.FRONTIER;
				}
			}
		}

		// backtrack through each cell's parent and set path cells to type
		// solution
		while (current) {
			current.type = MazeCellTypes.SOLUTION;
			current = parents[current.projection()];
		}
	}
	
	/*
	 * this function uses a Dijkstra's algorithm to solve the maze. When the solution
	 * is found, the function modifies the maze by marking each cell of the solution
	 * with the type MazeCellTypes.SOLUTION. 
	 */
	solveMazeDijkstra() {
		// TODO
	}
	
	/*
	 * this function uses A* to solve the maze. When the solution
	 * is found, the function modifies the maze by marking each cell of the solution
	 * with the type MazeCellTypes.SOLUTION. 
	 */
	solveMazeAStar() {
		// TODO
	}

	
	/*
	 * this function returns the number of cells that are included in the solution path.
	 */
	cellCounts() {
		var counter = []
		counter['solution'] = 0;
		counter['visited'] = 0;
		counter['frontier'] = 0;
		for (var i = 0; i < this.maze.length; i++) {
			for (var j = 0; j < this.maze[i].length; j++) {
				if (this.maze[i][j].type === MazeCellTypes.SOLUTION) {
					counter['solution']++;
				}
				if (this.maze[i][j].type === MazeCellTypes.SOLUTION ||
					this.maze[i][j].type == MazeCellTypes.VISITED) {
					counter['visited']++;
				}
				if (this.maze[i][j].type === MazeCellTypes.FRONTIER) {
					counter['frontier']++;
				}
			}
		}
		return counter;
	}

}

/*
 * On average, DFS visits most all of the cells in the maze, while BFS visits approximately half.
 *
 * In the average case, BFS is better-suited for pathfinding.
 */