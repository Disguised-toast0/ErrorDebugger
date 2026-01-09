import { useEffect, useState } from "react";
import { getBugs } from "../api/bugs";
import { useNavigate } from "react-router-dom";

export default function History() {
  const [bugs, setBugs] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    getBugs().then(setBugs);
  }, []);

  return (
    <div>
      <h2>Investigation History</h2>

      {bugs.length === 0 && <p>No investigations yet</p>}

      <ul>
        {bugs.map(bug => (
          <li key={bug._id}>
            <strong>{bug.errorType}</strong> — {bug.status}
            <button
              onClick={() =>
                navigate(`/bug/${bug._id}`)
              }
            >
              View
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
