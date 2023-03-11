import React from 'react';

export default function CodeCard(props) {
  return (
    <div className="card" style={{ flexGrow: 1 }}>
      <div className="codebox">{props.code}</div>
      <h3>{props.name}</h3>
      <p>{props.desc}</p>
    </div>
  );
}
