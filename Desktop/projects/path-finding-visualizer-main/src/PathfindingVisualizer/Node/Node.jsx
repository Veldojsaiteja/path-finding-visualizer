import React, { useEffect, useState } from 'react';

import './Node.css';

function Node(props) {
  const {
    col,
    isFinish,
    isStart,
    isWall,
    onMouseDown,
    onMouseEnter,
    onMouseUp,
    row,
  } = props;

  const [extraClassName, setExtraClassName] = useState('');

  useEffect(() => {
    setExtraClassName(
      isFinish ? 'node-finish' : isStart ? 'node-start' : isWall ? 'node-wall' : ''
    );
  }, [isFinish, isStart, isWall]);

  return (
    <td
      id={`node-${row}-${col}`}
      className={`node ${extraClassName}`}
      onMouseDown={() => onMouseDown(row, col)}
      onMouseEnter={() => onMouseEnter(row, col)}
      onMouseUp={() => onMouseUp(row, col)}
    ></td>
  );
}

export default Node;

