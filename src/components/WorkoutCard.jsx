import React from "react";
import { useNavigate } from "react-router-dom";

function WorkoutCard({ title, description, duration, difficulty, type }) {

  const navigate = useNavigate();

  const startWorkout = () => {
    navigate(`/workout/${type}`);
  };

  return (
    <div style={styles.card}>

      <h3>{title}</h3>

      <p style={styles.description}>{description}</p>

      <div style={styles.infoBox}>
        <span>⏱ {duration}</span>
        <span>🔥 {difficulty}</span>
      </div>

      <button style={styles.button} onClick={startWorkout}>
        Iniciar entrenamiento
      </button>

    </div>
  );
}

const styles = {

  card: {
    background: "#161616",
    padding: "25px",
    borderRadius: "14px",
    width: "260px",
    transition: "all 0.25s ease",
    boxShadow: "0 8px 20px rgba(0,0,0,0.4)",
    cursor: "pointer"
  },

  description: {
    color: "#aaa",
    fontSize: "14px",
    marginTop: "8px"
  },

  infoBox: {
    display: "flex",
    justifyContent: "space-between",
    marginTop: "10px",
    fontSize: "14px"
  },

  button: {
    marginTop: "18px",
    padding: "12px",
    width: "100%",
    background: "#00ff88",
    border: "none",
    borderRadius: "10px",
    fontWeight: "bold",
    cursor: "pointer"
  }

};

export default WorkoutCard;
