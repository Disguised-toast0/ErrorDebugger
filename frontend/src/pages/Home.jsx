import { useEffect, useState } from "react";
import { getErrors } from "../api/errors";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const [errors, setErrors] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    getErrors().then(setErrors);
  }, []);

  return (
    <div>
      <h2>Error Catalog</h2>

      <button onClick={() => navigate("/history")}>
        View History
      </button>

      <button onClick={() => navigate("/admin")}>
        Admin
      </button>

      <ul>
        {errors.map(err => (
          <li key={err.errorId}>
            <h4>{err.name}</h4>
            <button
              onClick={() =>
                navigate(`/start/${err.errorId}`)
              }
            >
              Start Investigation
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
