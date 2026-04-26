import React, { useState, useEffect, useCallback } from "react";
import Node from "./Node/Node";
import { dijkstra } from "../algorithms/dijkstra";
import { AStar } from "../algorithms/aStar";
import { dfs } from "../algorithms/dfs";
import { bfs } from "../algorithms/bfs";
import basicMaze from "../maze/basicMaze";
import recursiveDivision from "../maze/recursive_division";

import "./PathfindingVisualizer.css";

const PathfindingVisualizer = () => {
  const [grid, setGrid] = useState([]);
  const [mouseIsPressed, setMouseIsPressed] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [isStartNode, setIsStartNode] = useState(false);
  const [isFinishNode, setIsFinishNode] = useState(false);
  const [isWallNode, setIsWallNode] = useState(false);
  const [currRow, setCurrRow] = useState(0);
  const [currCol, setCurrCol] = useState(0);

  const [startNodeRow, setStartNodeRow] = useState(5);
  const [finishNodeRow, setFinishNodeRow] = useState(5);
  const [startNodeCol, setStartNodeCol] = useState(5);
  const [finishNodeCol, setFinishNodeCol] = useState(15);
  const rowCount = 20;
  const colCount = 57;
  const [mazeID, setMazeID] = useState(0);
  const [selectedAlgorithm, setSelectedAlgorithm] = useState("Dijkstra");
  const [animateTime, setAnimationTime] = useState(35);

  const getInitialGrid = useCallback(() => {
    const initialGrid = [];
    for (let row = 0; row < rowCount; row++) {
      const currentRow = [];
      for (let col = 0; col < colCount; col++) {
        currentRow.push(createNode(row, col));
      }
      initialGrid.push(currentRow);
    }
    return initialGrid;
  }, []);

  useEffect(() => {
    const grid = getInitialGrid();
    setGrid(grid);
  }, [getInitialGrid]);

  const isGridClear = () => {
    for (const row of grid) {
      for (const node of row) {
        const nodeClassName = document.getElementById(
          `node-${node.row}-${node.col}`
        ).className;
        if (
          nodeClassName === "node node-visited" ||
          nodeClassName === "node node-shortest-path"
        ) {
          return false;
        }
      }
    }
    return true;
  };

  const createNode = (row, col) => {
    return {
      row,
      col,
      isStart: row === startNodeRow && col === startNodeCol,
      isFinish: row === finishNodeRow && col === finishNodeCol,
      distance: Infinity,
      distanceToFinishNode:
        Math.abs(finishNodeRow - row) + Math.abs(finishNodeCol - col),
      isVisited: false,
      isWall: false,
      previousNode: null,
      isNode: true,
    };
  };

  const handleMouseDown = (row, col) => {
    if (!isRunning) {
      if (isGridClear()) {
        if (
          document.getElementById(`node-${row}-${col}`).className ===
          "node node-start"
        ) {
          setMouseIsPressed(true);
          setIsStartNode(true);
          setCurrRow(row);
          console.log("this is mouse down - start", row, col);
          setCurrCol(col);
        } else if (
          document.getElementById(`node-${row}-${col}`).className ===
          "node node-finish"
        ) {
          setMouseIsPressed(true);
          setIsFinishNode(true);
          setCurrRow(row);
          console.log("this is mouse down - finish", row, col);
          setCurrCol(col);
        } else {
          const newGrid = getNewGridWithWallToggled(grid, row, col);
          setGrid(newGrid);
          setMouseIsPressed(true);
          setIsWallNode(true);
          setCurrRow(row);
          setCurrCol(col);
        }
      } else {
        clearGrid();
      }
    }
  };

  const handleMouseEnter = (row, col) => {
    if (!isRunning) {
      if (mouseIsPressed) {
        const nodeClassName = document.getElementById(
          `node-${row}-${col}`
        ).className;
        if (isStartNode) {
          if (nodeClassName !== "node node-wall") {
            const prevStartNode = grid[currRow][currCol];
            prevStartNode.isStart = false;
            document.getElementById(`node-${currRow}-${currCol}`).className =
              "node";

            setCurrRow(row);
            setCurrCol(col);
            const currStartNode = grid[row][col];
            currStartNode.isStart = true;
            document.getElementById(`node-${row}-${col}`).className =
              "node node-start";
          }
          console.log("entering each cell, with start node pressed", row, col);
          //setIsStartNode(false);
        } else if (isFinishNode) {
          if (nodeClassName !== "node node-wall") {
            const prevFinishNode = grid[currRow][currCol];
            prevFinishNode.isFinish = false;
            document.getElementById(`node-${currRow}-${currCol}`).className =
              "node";

            setCurrRow(row);
            setCurrCol(col);
            const currFinishNode = grid[row][col];
            currFinishNode.isFinish = true;
            document.getElementById(`node-${row}-${col}`).className =
              "node node-finish";
          }
          //setIsFinishNode(false);
        } else if (isWallNode) {
          const newGrid = getNewGridWithWallToggled(grid, row, col);
          setGrid(newGrid);
        }
      }
    }
  };

  const handleMouseUp = (row, col) => {
    if (!isRunning) {
      setMouseIsPressed(false);
      if (isStartNode) {
        setIsStartNode(false);
        setCurrRow(row);
        setCurrCol(col);
        console.log("this is startNode change");
        setStartNodeRow(row);
        setStartNodeCol(col);
      } else if (isFinishNode) {
        setIsFinishNode(false);
        setCurrRow(row);
        setCurrCol(col);
        console.log("this is finishNode change");
        setFinishNodeRow(row);
        setFinishNodeCol(col);
      }

      getInitialGrid();
    }
  };

  const handleMouseLeave = () => {
    if (isStartNode) {
      setIsStartNode(false);
      setMouseIsPressed(false);
    } else if (isFinishNode) {
      setIsFinishNode(false);
      setMouseIsPressed(false);
    } else if (isWallNode) {
      setIsWallNode(false);
      setMouseIsPressed(false);
      getInitialGrid();
    }
  };

  const getNewGridWithWallToggled = (grid, row, col) => {
    const newGrid = grid.slice();
    const node = newGrid[row][col];
    if (!node.isStart && !node.isFinish && node.isNode) {
      const newNode = {
        ...node,
        isWall: !node.isWall,
      };
      newGrid[row][col] = newNode;
    }
    return newGrid;
  };

  // Backtracks from the finishNode to find the shortest path.
  const getNodesInShortestPathOrder = (finishNode) => {
    const nodesInShortestPathOrder = [];
    let currentNode = finishNode;
    while (currentNode !== null) {
      nodesInShortestPathOrder.unshift(currentNode);
      currentNode = currentNode.previousNode;
    }
    return nodesInShortestPathOrder;
  };

  const clearGrid = () => {
    if (!isRunning) {
      const newGrid = grid.slice();
      for (const row of newGrid) {
        for (const node of row) {
          let nodeClassName = document.getElementById(
            `node-${node.row}-${node.col}`
          ).className;
          if (
            nodeClassName !== "node node-start" &&
            nodeClassName !== "node node-finish" &&
            nodeClassName !== "node node-wall"
          ) {
            document.getElementById(`node-${node.row}-${node.col}`).className =
              "node";
            node.isVisited = false;
            node.distance = Infinity;
            node.distanceToFinishNode =
              Math.abs(finishNodeRow - node.row) +
              Math.abs(finishNodeCol - node.col);
          }
          if (nodeClassName === "node node-finish") {
            node.isVisited = false;
            node.distance = Infinity;
            node.distanceToFinishNode = 0;
          }
          if (nodeClassName === "node node-start") {
            node.isVisited = false;
            node.distance = Infinity;
            node.distanceToFinishNode =
              Math.abs(finishNodeRow - node.row) +
              Math.abs(finishNodeCol - node.col);
            node.isStart = true;
            node.isWall = false;
            node.previousNode = null;
            node.isNode = true;
          }
        }
      }
    } 
  };

  const clearWalls = () => {
    if (!isRunning) {
      const newGrid = grid.map((row) => {
        return row.map((node) => {
          if (node.isWall) {
            return {
              ...node,
              isWall: false,
            };
          }
          return node;
        });
      });

      setGrid(newGrid);
    }
  };

  const visualize = async () => {
    if (!isRunning) {
      clearGrid();
      setIsRunning(true);
      const startNode = grid[startNodeRow][startNodeCol];
      const finishNode = grid[finishNodeRow][finishNodeCol];
      let visitedNodesInOrder;
      switch (selectedAlgorithm) {
        case "Dijkstra":
          visitedNodesInOrder = dijkstra(grid, startNode, finishNode);
          break;
        case "AStar":
          visitedNodesInOrder = AStar(grid, startNode, finishNode);
          break;
        case "BFS":
          visitedNodesInOrder = bfs(grid, startNode, finishNode);
          break;
        case "DFS":
          visitedNodesInOrder = dfs(grid, startNode, finishNode);
          break;
        default:
          // should never get here
          break;
      }
      const nodesInShortestPathOrder = getNodesInShortestPathOrder(finishNode);
      nodesInShortestPathOrder.push("end");
      await animate(visitedNodesInOrder);
      await animateShortestPath(nodesInShortestPathOrder);
      setIsRunning(false);
    }
  };

  const animate = async (visitedNodesInOrder) => {
    for (let i = 0; i < visitedNodesInOrder.length; i++) {
      const node = visitedNodesInOrder[i];
      if (node) {
        await waitForAnimatoin(animateTime);
        const nodeClassName = document.getElementById(
          `node-${node.row}-${node.col}`
        ).className;
        if (
          nodeClassName !== "node node-start" &&
          nodeClassName !== "node node-finish"
        ) {
          document.getElementById(`node-${node.row}-${node.col}`).className =
            "node node-visited";
        }
      }
    }
  };

  const animateShortestPath = async (nodesInShortestPathOrder) => {
    for (let i = 0; i < nodesInShortestPathOrder.length; i++) {
      const node = nodesInShortestPathOrder[i];
      if (node && node !== "end") {
        await waitForAnimatoin();
        const nodeClassName = document.getElementById(
          `node-${node.row}-${node.col}`
        ).className;
        if (
          nodeClassName !== "node node-start" &&
          nodeClassName !== "node node-finish"
        ) {
          document.getElementById(`node-${node.row}-${node.col}`).className =
            "node node-shortest-path";
        }
      }
    }
  };

  const mazeGenerator = async (ar) => {
    for (var i = 0; i < ar.length; i++) {
      if (
        (ar[i].r === startNodeRow && ar[i].c === startNodeCol) ||
        (ar[i].r === finishNodeRow && ar[i].c === finishNodeCol)
      )
        continue;
      await waitForAnimatoin(animateTime);
      const newGrid = getNewGridWithWallToggled(grid, ar[i].r, ar[i].c);
      setGrid(newGrid);
    }
  };

  async function waitForAnimatoin(time) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve("");
      }, time);
    });
  }
  /*maze code */
  const mazeHandle = async () => {
    var arr = [];
    switch (mazeID) {
      case 1:
        arr = basicMaze(rowCount, colCount);
        mazeGenerator(arr);
        break;
      case 2: // recursive division
        arr = recursiveDivision(rowCount, colCount);
        mazeGenerator(arr);
        break;
      default:
    }
  };

  const animationTimeHandle = (type) => {
    if (type === 1) setAnimationTime(8);
    else if (type === 2) setAnimationTime(35);
    else setAnimationTime(80);
  };

  return (
    <div style={{ margin: 0 }}>
      <nav
        className="navbar navbar-expand-lg navbar-dark bg-dark"
        style={{ padding: 15 }}
      >
        <a className="navbar-brand" href="/">
          <b className="Header">PathFinding Visualizer</b>
        </a>
        <button
          className="navbar-toggler"
          type="button"
          data-toggle="collapse"
          data-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
      </nav>
      <div className="controls">
        <div className="algorithm-controls">
          <label>Algorithm :</label>
          <select
            onChange={(e) => setSelectedAlgorithm(e.target.value)}
            value={selectedAlgorithm}
          >
            <option value="Dijkstra">Dijkstra's</option>
            <option value="AStar">A*</option>
            <option value="BFS">Bread First Search</option>
            <option value="DFS">Depth First Search</option>
          </select>
          <button type="button" className="btn btn-primary" onClick={visualize}>
            Visualize
          </button>
        </div>
        <div className="maze-controls">
          <button
            type="button"
            className="btn btn-danger"
            onClick={() => clearGrid()}
          >
            Clear Grid
          </button>
          <button
            type="button"
            className="btn btn-warning"
            onClick={() => clearWalls()}
          >
            Clear Walls
          </button>
          <select
            value={mazeID}
            onChange={(e) => {
              setMazeID(parseInt(e.target.value));
            }}
          >
            <option value="0">Select Maze</option>
            <option value="1">Random basic maze</option>
            <option value="2">Recursive division</option>
          </select>
          <button
            type="button"
            className="btn btn-primary"
            onClick={mazeHandle}
          >
            Create Maze
          </button>
        </div>
        <div className="speed-controls">
          <label>Animation Speed :</label>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => animationTimeHandle(1)}
          >
            Fast
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => animationTimeHandle(2)}
          >
            Average
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => animationTimeHandle(3)}
          >
            Slow
          </button>
        </div>
      </div>
      <div className="legend">
        <div className="legend-item">
          <div className="legend-color start-node"></div>
          <div className="legend-text">Start Node</div>
        </div>
        <div className="legend-item">
          <div className="legend-color finish-node"></div>
          <div className="legend-text">Finish Node</div>
        </div>
        <div className="legend-item">
          <div className="legend-color visited-node"></div>
          <div className="legend-text">Visited Nodes</div>
        </div>
        <div className="legend-item">
          <div className="legend-color path-node"></div>
          <div className="legend-text">Algorithm Generated Path</div>
        </div>
        <div className="legend-item">
          <div className="legend-color wall-node"></div>
          <div className="legend-text">Wall</div>
        </div>
      </div>

      <table className="grid-container" onMouseLeave={() => handleMouseLeave()}>
        <tbody className="grid">
          {grid.map((row, rowIdx) => {
            return (
              <tr key={rowIdx}>
                {row.map((node, nodeIdx) => {
                  const { row, col, isFinish, isStart, isWall } = node;
                  return (
                    <Node
                      key={nodeIdx}
                      col={col}
                      isFinish={isFinish}
                      isStart={isStart}
                      isWall={isWall}
                      mouseIsPressed={mouseIsPressed}
                      onMouseDown={(row, col) => handleMouseDown(row, col)}
                      onMouseEnter={(row, col) => handleMouseEnter(row, col)}
                      onMouseUp={() => handleMouseUp(row, col)}
                      row={row}
                    ></Node>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default PathfindingVisualizer;

// dark green - startNode
// red - finishNode
// light green - visited nodes
// yellow - Algorithm generated path
// dark grey - wall -- its for my clear understanding.
